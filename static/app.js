// AutoML Studio client side application logic

// State Management
const state = {
    currentState: 'empty', // empty -> loaded -> preprocessed -> selected -> trained
    filename: null,
    columns: [],
    types: {},
    skewness: {},
    missingValues: {},
    head: [],
    
    // Preprocessed states
    p_columns: [],
    p_types: {},
    p_skewness: {},
    p_missingValues: {},
    p_head: [],
    
    // Feature selection results
    selectedFeatures: [],
    targetVariable: null,
    featureScores: {},
    
    // Model results
    r2Score: null,
    rmse: null,
    mse: null,
    coefficients: {},
    intercept: null,
    comparison: []
};

// Chart registry to manage Chart.js instances (allows destroying old charts before drawing new ones)
const charts = {
    missingChart: null,
    featuresChart: null,
    predictionChart: null
};

// DOM Elements
const elements = {
    // Navigation
    navBtns: document.querySelectorAll('.nav-btn'),
    pipelineStatus: document.getElementById('pipeline-status'),
    pageTitle: document.getElementById('page-title'),
    pageSubtitle: document.getElementById('page-subtitle'),
    sections: document.querySelectorAll('.step-section'),
    
    // Alerts
    errorBanner: document.getElementById('error-banner'),
    errorMessage: document.getElementById('error-message'),
    successBanner: document.getElementById('success-banner'),
    successMessage: document.getElementById('success-message'),
    
    // Step 1: Load
    presetSelect: document.getElementById('preset-select'),
    btnLoadPreset: document.getElementById('btn-load-preset'),
    customFilePath: document.getElementById('custom-file-path'),
    btnLoadCustom: document.getElementById('btn-load-custom'),
    statRows: document.getElementById('stat-rows'),
    statCols: document.getElementById('stat-cols'),
    loadedFilename: document.getElementById('loaded-filename'),
    datasetLoadedIndicator: document.getElementById('dataset-loaded-indicator'),
    datasetDetailsContainer: document.getElementById('dataset-details-container'),
    columnsInfoTable: document.getElementById('columns-info-table').querySelector('tbody'),
    previewTable: document.getElementById('preview-table'),
    
    // Step 2: Preprocess
    preprocessForm: document.getElementById('preprocess-form'),
    imputeStrategy: document.getElementById('impute-strategy'),
    imputeColsCheckboxes: document.getElementById('impute-cols-checkboxes'),
    logTransformCheckboxes: document.getElementById('log-transform-checkboxes'),
    createTeamIdCheckbox: document.getElementById('create-team-id-checkbox'),
    targetEncodeCol: document.getElementById('target-encode-col'),
    targetEncodeY: document.getElementById('target-encode-y'),
    preprocessEmptyState: document.getElementById('preprocess-empty-state'),
    preprocessResultsContainer: document.getElementById('preprocess-results-container'),
    pStatRows: document.getElementById('p-stat-rows'),
    pStatCols: document.getElementById('p-stat-cols'),
    preprocessPreviewTable: document.getElementById('preprocess-preview-table'),
    
    // Step 3: Feature Selection
    featureSelectionForm: document.getElementById('feature-selection-form'),
    selectTarget: document.getElementById('select-target'),
    featureCandidatesCheckboxes: document.getElementById('feature-candidates-checkboxes'),
    selectK: document.getElementById('select-k'),
    featureEmptyState: document.getElementById('feature-empty-state'),
    featureResultsContainer: document.getElementById('feature-results-container'),
    bestFeaturesTags: document.getElementById('best-features-tags'),
    
    // Step 4: Train & Predict
    trainForm: document.getElementById('train-form'),
    trainFeaturesDisplay: document.getElementById('train-features-display'),
    trainTargetDisplay: document.getElementById('train-target-display'),
    testSplitSlider: document.getElementById('test-split-slider'),
    testSplitVal: document.getElementById('test-split-val'),
    randomStateInput: document.getElementById('random-state-input'),
    trainEmptyState: document.getElementById('train-empty-state'),
    trainResultsContainer: document.getElementById('train-results-container'),
    metricR2: document.getElementById('metric-r2'),
    metricRmse: document.getElementById('metric-rmse'),
    modelEquationText: document.getElementById('model-equation-text'),
    comparisonTable: document.getElementById('comparison-table').querySelector('tbody'),
    predictorCardContainer: document.getElementById('predictor-card-container'),
    dynamicPredictionInputs: document.getElementById('dynamic-prediction-inputs'),
    predictionForm: document.getElementById('prediction-form'),
    predictionResult: document.getElementById('prediction-result'),
    predictedValue: document.getElementById('predicted-value')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupEventListeners();
});

// ----------------------------------------------------
// Navigation Handlers
// ----------------------------------------------------
function setupNavigation() {
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            
            // Update active button state
            elements.navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding section
            elements.sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });
            
            // Update Top Header titles dynamically
            updatePageHeader(targetId);
        });
    });
}

function updatePageHeader(sectionId) {
    let title = "Dataset Loader";
    let subtitle = "Start by loading a CSV file to inspect the data.";
    
    switch(sectionId) {
        case 'step-load':
            title = "Dataset Loader";
            subtitle = "Load and explore structural features of the data.";
            break;
        case 'step-preprocess':
            title = "Data Preprocessor";
            subtitle = "Impute missing values, apply log transforms, and target-encode categorical fields.";
            break;
        case 'step-features':
            title = "Feature Explorer & Selection";
            subtitle = "Compute scores using Mutual Information regression and select optimal variables.";
            break;
        case 'step-train':
            title = "Model Studio & Predictor";
            subtitle = "Train a Linear Regression model, evaluate residuals, and make custom predictions.";
            break;
    }
    
    elements.pageTitle.textContent = title;
    elements.pageSubtitle.textContent = subtitle;
}

function updatePipelineStatus(newState) {
    state.currentState = newState;
    elements.pipelineStatus.textContent = newState;
    elements.pipelineStatus.className = 'status-badge';
    
    // Enable/disable navigation buttons based on current progress
    const btnPreprocess = document.getElementById('nav-btn-preprocess');
    const btnFeatures = document.getElementById('nav-btn-features');
    const btnTrain = document.getElementById('nav-btn-train');
    
    if (newState === 'loaded') {
        btnPreprocess.removeAttribute('disabled');
        btnFeatures.setAttribute('disabled', 'true');
        btnTrain.setAttribute('disabled', 'true');
        elements.pipelineStatus.classList.add('active');
        elements.pipelineStatus.textContent = 'Data Loaded';
    } else if (newState === 'preprocessed') {
        btnPreprocess.removeAttribute('disabled');
        btnFeatures.removeAttribute('disabled');
        btnTrain.setAttribute('disabled', 'true');
        elements.pipelineStatus.classList.add('active');
        elements.pipelineStatus.textContent = 'Preprocessed';
    } else if (newState === 'selected') {
        btnPreprocess.removeAttribute('disabled');
        btnFeatures.removeAttribute('disabled');
        btnTrain.removeAttribute('disabled');
        elements.pipelineStatus.classList.add('active');
        elements.pipelineStatus.textContent = 'Features Selected';
    } else if (newState === 'trained') {
        btnPreprocess.removeAttribute('disabled');
        btnFeatures.removeAttribute('disabled');
        btnTrain.removeAttribute('disabled');
        elements.pipelineStatus.classList.add('active');
        elements.pipelineStatus.textContent = 'Model Trained';
    } else {
        btnPreprocess.setAttribute('disabled', 'true');
        btnFeatures.setAttribute('disabled', 'true');
        btnTrain.setAttribute('disabled', 'true');
        elements.pipelineStatus.classList.add('idle');
        elements.pipelineStatus.textContent = 'No Data';
    }
}

// ----------------------------------------------------
// Alert Handlers
// ----------------------------------------------------
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorBanner.classList.remove('hidden');
    elements.successBanner.classList.add('hidden');
    elements.mainContent.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeErrorBanner() {
    elements.errorBanner.classList.add('hidden');
}

function showSuccess(message) {
    elements.successMessage.textContent = message;
    elements.successBanner.classList.remove('hidden');
    elements.errorBanner.classList.add('hidden');
    // auto hide after 5 seconds
    setTimeout(() => {
        elements.successBanner.classList.add('hidden');
    }, 5000);
}

function closeSuccessBanner() {
    elements.successBanner.classList.add('hidden');
}

// ----------------------------------------------------
// Event Listeners Configuration
// ----------------------------------------------------
function setupEventListeners() {
    // Preset file loading
    elements.btnLoadPreset.addEventListener('click', () => {
        const file = elements.presetSelect.value;
        loadDataset(file);
    });
    
    // Custom file loading
    elements.btnLoadCustom.addEventListener('click', () => {
        const file = elements.customFilePath.value.trim();
        if (!file) {
            showError("Please specify a valid file path.");
            return;
        }
        loadDataset(file);
    });
    
    // Preprocess form submit
    elements.preprocessForm.addEventListener('submit', (e) => {
        e.preventDefault();
        runPreprocessing();
    });
    
    // Create Team ID checkbox change (creates/removes custom categorical team dropdowns in form)
    elements.createTeamIdCheckbox.addEventListener('change', (e) => {
        // Just triggers UI helper dynamically if needed, or simply passed to API
        // If checked, we might want to manually insert "Team_ID" as options in category select box
        const optionExists = Array.from(elements.targetEncodeCol.options).some(opt => opt.value === 'Team_ID');
        if (e.target.checked && !optionExists) {
            const opt = document.createElement('option');
            opt.value = 'Team_ID';
            opt.textContent = 'Team_ID (Generated)';
            elements.targetEncodeCol.appendChild(opt);
        } else if (!e.target.checked && optionExists) {
            for (let i = 0; i < elements.targetEncodeCol.options.length; i++) {
                if (elements.targetEncodeCol.options[i].value === 'Team_ID') {
                    elements.targetEncodeCol.remove(i);
                    break;
                }
            }
        }
    });

    // Feature Selection form submit
    elements.featureSelectionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        runFeatureSelection();
    });
    
    // Test split slider change label
    elements.testSplitSlider.addEventListener('input', (e) => {
        elements.testSplitVal.textContent = `${e.target.value}%`;
    });
    
    // Model Train form submit
    elements.trainForm.addEventListener('submit', (e) => {
        e.preventDefault();
        runModelTraining();
    });
    
    // Prediction Form submit
    elements.predictionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        runPrediction();
    });
}

// ----------------------------------------------------
// API Calls & Actions
// ----------------------------------------------------

// 1. LOAD DATASET
async function loadDataset(fileName) {
    try {
        const response = await fetch('/api/load-dataset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_name: fileName })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load dataset.');
        }
        
        // Save state
        state.filename = data.file_name;
        state.columns = data.columns;
        state.types = data.types;
        state.skewness = data.skewness;
        state.missingValues = data.missing_values;
        state.head = data.head;
        
        // Update Load UI elements
        elements.statRows.textContent = data.shape[0].toLocaleString();
        elements.statCols.textContent = data.shape[1].toString();
        elements.loadedFilename.textContent = data.file_name;
        elements.datasetLoadedIndicator.classList.remove('hidden');
        elements.datasetDetailsContainer.classList.remove('hidden');
        
        // Build tables and charts
        buildColumnsTable(data.columns, data.types, data.missing_values, data.skewness);
        buildPreviewTable(data.columns, data.head, 'preview-table');
        buildMissingChart(data.missing_values);
        
        // Populate Preprocessing select boxes and checkboxes
        populatePreprocessingOptions(data.columns, data.types);
        
        // Reset subsequent tabs empty state UI
        elements.preprocessEmptyState.classList.remove('hidden');
        elements.preprocessResultsContainer.classList.add('hidden');
        elements.featureEmptyState.classList.remove('hidden');
        elements.featureResultsContainer.classList.add('hidden');
        elements.trainEmptyState.classList.remove('hidden');
        elements.trainResultsContainer.classList.add('hidden');
        
        updatePipelineStatus('loaded');
        showSuccess(`Dataset "${fileName}" loaded successfully!`);
        
        // Auto navigate to Preprocessing tab after loading for a fluid user experience
        setTimeout(() => {
            document.getElementById('nav-btn-preprocess').click();
        }, 800);
        
    } catch (err) {
        showError(err.message);
    }
}

function buildColumnsTable(cols, types, missing, skew) {
    elements.columnsInfoTable.innerHTML = '';
    cols.forEach(col => {
        const tr = document.createElement('tr');
        
        const tdName = document.createElement('td');
        tdName.textContent = col;
        tdName.style.fontWeight = '600';
        
        const tdType = document.createElement('td');
        tdType.innerHTML = `<span class="tag" style="background-color: ${types[col] === 'numeric' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(236, 72, 153, 0.1)'}; color: ${types[col] === 'numeric' ? 'var(--accent-teal)' : '#f472b6'}; border-color: ${types[col] === 'numeric' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(236, 72, 153, 0.2)'}">${types[col]}</span>`;
        
        const tdMissing = document.createElement('td');
        tdMissing.textContent = missing[col].toString();
        if (missing[col] > 0) {
            tdMissing.style.color = 'var(--accent-red)';
            tdMissing.style.fontWeight = 'bold';
        }
        
        const tdSkew = document.createElement('td');
        tdSkew.textContent = types[col] === 'numeric' ? skew[col].toFixed(3) : '-';
        if (types[col] === 'numeric' && Math.abs(skew[col]) > 0.75) {
            tdSkew.style.color = '#fbbf24'; // Highlight highly skewed features
        }
        
        tr.appendChild(tdName);
        tr.appendChild(tdType);
        tr.appendChild(tdMissing);
        tr.appendChild(tdSkew);
        
        elements.columnsInfoTable.appendChild(tr);
    });
}

function buildPreviewTable(columns, headData, tableId) {
    const table = document.getElementById(tableId);
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    if (headData.length === 0) return;
    
    // Header
    const trHead = document.createElement('tr');
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    
    // Body
    headData.forEach(row => {
        const trRow = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            const val = row[col];
            td.textContent = val !== null && val !== undefined ? val : 'NaN';
            if (val === null || val === undefined) {
                td.style.color = 'rgba(239, 68, 68, 0.6)';
                td.style.fontStyle = 'italic';
            }
            trRow.appendChild(td);
        });
        tbody.appendChild(trRow);
    });
}

function buildMissingChart(missingValues) {
    const ctx = document.getElementById('missing-chart').getContext('2d');
    
    // Destroy existing chart instance
    if (charts.missingChart) {
        charts.missingChart.destroy();
    }
    
    const labels = Object.keys(missingValues);
    const data = Object.values(missingValues);
    
    // Only show columns that actually have missing values, or top 8 if none
    const sorted = labels.map((l, i) => ({label: l, value: data[i]}))
                         .sort((a,b) => b.value - a.value);
    
    const chartLabels = sorted.map(x => x.label);
    const chartData = sorted.map(x => x.value);
    
    charts.missingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Missing Values Count',
                data: chartData,
                backgroundColor: chartData.map(v => v > 0 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(6, 182, 212, 0.4)'),
                borderColor: chartData.map(v => v > 0 ? 'var(--accent-red)' : 'var(--accent-teal)'),
                borderWidth: 1.5,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#64748b' }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#64748b',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function populatePreprocessingOptions(cols, types) {
    // Empty checkboxes
    elements.imputeColsCheckboxes.innerHTML = '';
    elements.logTransformCheckboxes.innerHTML = '';
    
    // Clear Select Options
    elements.targetEncodeCol.innerHTML = '<option value="">-- Select Column --</option>';
    elements.targetEncodeY.innerHTML = '<option value="">-- Select Target --</option>';
    
    cols.forEach(col => {
        const isNumeric = types[col] === 'numeric';
        
        // 1. Imputation checkboxes (only for columns with missing values)
        if (state.missingValues[col] > 0) {
            createCheckbox(elements.imputeColsCheckboxes, 'impute-col-', col, true);
        }
        
        // 2. Log Transform checkboxes (only for numeric columns)
        if (isNumeric) {
            // Pre-check if skewness is high (> 0.75) as recommended
            const isHighlySkewed = Math.abs(state.skewness[col] || 0) > 0.75;
            createCheckbox(elements.logTransformCheckboxes, 'log-col-', col, isHighlySkewed);
        }
        
        // 3. Target encode selector options
        if (!isNumeric) {
            const opt = document.createElement('option');
            opt.value = col;
            opt.textContent = col;
            elements.targetEncodeCol.appendChild(opt);
        }
        
        // 4. Target Y options (usually numeric target)
        if (isNumeric) {
            const opt = document.createElement('option');
            opt.value = col;
            opt.textContent = col;
            // Pre-select 'W' if it exists
            if (col === 'W') opt.selected = true;
            elements.targetEncodeY.appendChild(opt);
        }
    });
    
    // Fallbacks if no options exist
    if (elements.imputeColsCheckboxes.children.length === 0) {
        elements.imputeColsCheckboxes.innerHTML = '<p class="placeholder-tag">No missing values detected in current dataset.</p>';
    }
}

function createCheckbox(container, prefix, colName, checked = false) {
    const div = document.createElement('div');
    div.className = 'form-check';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `${prefix}${colName}`;
    input.value = colName;
    input.className = 'form-check-input';
    input.checked = checked;
    
    const label = document.createElement('label');
    label.htmlFor = `${prefix}${colName}`;
    label.className = 'form-check-label';
    label.textContent = colName;
    
    div.appendChild(input);
    div.appendChild(label);
    container.appendChild(div);
}


// 2. RUN PREPROCESSING
async function runPreprocessing() {
    try {
        // Collect checked columns
        const imputeCols = Array.from(elements.imputeColsCheckboxes.querySelectorAll('input:checked')).map(cb => cb.value);
        const logTransformCols = Array.from(elements.logTransformCheckboxes.querySelectorAll('input:checked')).map(cb => cb.value);
        
        const strategy = elements.imputeStrategy.value;
        const targetEncodeColVal = elements.targetEncodeCol.value;
        const targetEncodeYVal = elements.targetEncodeY.value;
        const createTeamIdVal = elements.createTeamIdCheckbox.checked;
        
        const payload = {
            impute_cols: imputeCols,
            impute_strategy: strategy,
            log_transform_cols: logTransformCols,
            target_encode_col: targetEncodeColVal,
            target_encode_y: targetEncodeYVal,
            create_team_id: createTeamIdVal
        };
        
        const response = await fetch('/api/preprocess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to preprocess dataset.');
        }
        
        // Save state
        state.p_columns = data.columns;
        state.p_types = data.types;
        state.p_skewness = data.skewness;
        state.p_missingValues = data.missing_values;
        state.p_head = data.head;
        
        // Update Preprocessed UI elements
        elements.pStatRows.textContent = data.shape[0].toLocaleString();
        elements.pStatCols.textContent = data.shape[1].toString();
        elements.preprocessEmptyState.classList.add('hidden');
        elements.preprocessResultsContainer.classList.remove('hidden');
        
        buildPreviewTable(data.columns, data.head, 'preprocess-preview-table');
        
        // Populate Feature Selection Select Target & Candidates
        populateFeatureSelectionOptions(data.columns, data.types);
        
        updatePipelineStatus('preprocessed');
        showSuccess("Preprocessing pipeline applied successfully!");
        
        // Auto navigate to features selection tab
        setTimeout(() => {
            document.getElementById('nav-btn-features').click();
        }, 800);
        
    } catch (err) {
        showError(err.message);
    }
}

function populateFeatureSelectionOptions(cols, types) {
    elements.selectTarget.innerHTML = '';
    elements.featureCandidatesCheckboxes.innerHTML = '';
    
    cols.forEach(col => {
        const isNumeric = types[col] === 'numeric';
        
        // 1. Target Selector options (numeric)
        if (isNumeric) {
            const opt = document.createElement('option');
            opt.value = col;
            opt.textContent = col;
            if (col === 'W') opt.selected = true; // Default to 'W' if baseball
            elements.selectTarget.appendChild(opt);
            
            // 2. Candidates checkboxes
            // Exclude ID and target variables from candidate list by default
            const isDefaultCandidate = ['R', 'HR', 'SO', 'SB', 'LogR', 'LogRuns', 'Team_ID_Encoded'].some(prefix => col.startsWith(prefix));
            // Check if name is 'ID' or equal to selected target (we will handle dynamic target exclusion on submit)
            if (col !== 'ID') {
                createCheckbox(elements.featureCandidatesCheckboxes, 'feat-col-', col, isDefaultCandidate);
            }
        }
    });
}


// 3. RUN FEATURE SELECTION
async function runFeatureSelection() {
    try {
        const targetVal = elements.selectTarget.value;
        const candidateCols = Array.from(elements.featureCandidatesCheckboxes.querySelectorAll('input:checked'))
                                   .map(cb => cb.value)
                                   .filter(val => val !== targetVal); // Exclude target if checked
        
        const kVal = elements.selectK.value;
        
        if (candidateCols.length === 0) {
            throw new Error("Please select at least one feature candidate.");
        }
        
        const payload = {
            feature_cols: candidateCols,
            target_col: targetVal,
            k: kVal
        };
        
        const response = await fetch('/api/feature-selection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to select features.');
        }
        
        // Save state
        state.selectedFeatures = data.best_features;
        state.targetVariable = targetVal;
        state.featureScores = data.scores;
        
        // Update Features UI elements
        elements.featureEmptyState.classList.add('hidden');
        elements.featureResultsContainer.classList.remove('hidden');
        
        // Build selected best features tags
        elements.bestFeaturesTags.innerHTML = '';
        data.best_features.forEach(feat => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = feat;
            elements.bestFeaturesTags.appendChild(span);
        });
        
        // Plot scores chart
        buildFeaturesChart(data.scores, data.best_features);
        
        // Setup details for Model Tab display
        populateModelTrainingSetup();
        
        updatePipelineStatus('selected');
        showSuccess(`Mutual Information computed successfully! ${data.best_features.length} best features selected.`);
        
        // Auto navigate to Train tab
        setTimeout(() => {
            document.getElementById('nav-btn-train').click();
        }, 800);
        
    } catch (err) {
        showError(err.message);
    }
}

function buildFeaturesChart(scores, bestFeatures) {
    const ctx = document.getElementById('features-chart').getContext('2d');
    
    if (charts.featuresChart) {
        charts.featuresChart.destroy();
    }
    
    const labels = Object.keys(scores);
    const data = Object.values(scores);
    
    // Sort features by score desc
    const sorted = labels.map((l, i) => ({label: l, value: data[i]}))
                         .sort((a,b) => b.value - a.value);
    
    const chartLabels = sorted.map(x => x.label);
    const chartData = sorted.map(x => x.value);
    
    charts.featuresChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Mutual Information Score',
                data: chartData,
                backgroundColor: chartLabels.map(label => bestFeatures.includes(label) ? 'rgba(16, 185, 129, 0.6)' : 'rgba(255, 255, 255, 0.1)'),
                borderColor: chartLabels.map(label => bestFeatures.includes(label) ? 'var(--accent-green)' : 'var(--border-color)'),
                borderWidth: 1.5,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal bars
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#64748b' }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            }
        }
    });
}

function populateModelTrainingSetup() {
    elements.trainFeaturesDisplay.innerHTML = '';
    state.selectedFeatures.forEach(feat => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = feat;
        elements.trainFeaturesDisplay.appendChild(span);
    });
    
    elements.trainTargetDisplay.textContent = state.targetVariable;
}


// 4. RUN MODEL TRAINING
async function runModelTraining() {
    try {
        if (state.selectedFeatures.length === 0) {
            throw new Error("No features selected. Please complete feature selection first.");
        }
        
        const testSplit = elements.testSplitSlider.value / 100;
        const randomState = elements.randomStateInput.value;
        
        const payload = {
            feature_cols: state.selectedFeatures,
            target_col: state.targetVariable,
            test_size: testSplit,
            random_state: randomState
        };
        
        const response = await fetch('/api/train-model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to train model.');
        }
        
        // Save state
        state.r2Score = data.r2_score;
        state.rmse = data.rmse;
        state.mse = data.mse;
        state.coefficients = data.coefficients;
        state.intercept = data.intercept;
        state.comparison = data.comparison;
        
        // Update Model Results UI elements
        elements.metricR2.textContent = data.r2_score.toFixed(4);
        elements.metricRmse.textContent = data.rmse.toFixed(3);
        elements.trainEmptyState.classList.add('hidden');
        elements.trainResultsContainer.classList.remove('hidden');
        
        // Print regression formula
        buildEquationText(data.coefficients, data.intercept, state.targetVariable);
        
        // Load comparison sample table
        buildComparisonTable(data.comparison);
        
        // Plot regression comparison scatter chart
        buildPredictionChart(data.comparison);
        
        // Build Interactive Predictor
        buildInteractivePredictorForm(state.selectedFeatures);
        
        updatePipelineStatus('trained');
        showSuccess("Linear Regression model trained and evaluated successfully!");
        
    } catch (err) {
        showError(err.message);
    }
}

function buildEquationText(coefs, intercept, targetName) {
    let eq = `${targetName} = ${intercept.toFixed(3)}`;
    
    Object.keys(coefs).forEach(feat => {
        const val = coefs[feat];
        const sign = val >= 0 ? '+' : '-';
        eq += ` ${sign} ${Math.abs(val).toFixed(3)}*(${feat})`;
    });
    
    elements.modelEquationText.textContent = eq;
}

function buildComparisonTable(comparison) {
    elements.comparisonTable.innerHTML = '';
    comparison.forEach(row => {
        const tr = document.createElement('tr');
        
        const tdId = document.createElement('td');
        tdId.textContent = row.id;
        
        const tdActual = document.createElement('td');
        tdActual.textContent = row.actual.toFixed(1);
        tdActual.style.fontWeight = '500';
        
        const tdPredicted = document.createElement('td');
        tdPredicted.textContent = row.predicted.toFixed(2);
        tdPredicted.style.color = 'var(--accent-teal)';
        tdPredicted.style.fontWeight = '600';
        
        const tdDiff = document.createElement('td');
        tdDiff.textContent = row.difference.toFixed(2);
        if (row.difference > 10) {
            tdDiff.style.color = '#f87171'; // Higher difference highlighted in red
        } else {
            tdDiff.style.color = 'var(--accent-green)';
        }
        
        tr.appendChild(tdId);
        tr.appendChild(tdActual);
        tr.appendChild(tdPredicted);
        tr.appendChild(tdDiff);
        
        elements.comparisonTable.appendChild(tr);
    });
}

function buildPredictionChart(comparison) {
    const ctx = document.getElementById('prediction-chart').getContext('2d');
    
    if (charts.predictionChart) {
        charts.predictionChart.destroy();
    }
    
    const actualValues = comparison.map(x => x.actual);
    const predictedValues = comparison.map(x => x.predicted);
    
    // Sort actual values for the perfect diagonal line
    const minVal = Math.min(...actualValues, ...predictedValues) * 0.95;
    const maxVal = Math.max(...actualValues, ...predictedValues) * 1.05;
    
    charts.predictionChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Predictions',
                    data: comparison.map(x => ({x: x.actual, y: x.predicted})),
                    backgroundColor: 'rgba(6, 182, 212, 0.6)',
                    borderColor: 'var(--accent-teal)',
                    borderWidth: 1,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: 'Perfect Fit (y = x)',
                    data: [{x: minVal, y: minVal}, {x: maxVal, y: maxVal}],
                    type: 'line',
                    borderColor: 'rgba(16, 185, 129, 0.5)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#94a3b8' }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: `Actual ${state.targetVariable}`,
                        color: '#94a3b8'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#64748b' }
                },
                y: {
                    title: {
                        display: true,
                        text: `Predicted ${state.targetVariable}`,
                        color: '#94a3b8'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#64748b' }
                }
            }
        }
    });
}

function buildInteractivePredictorForm(features) {
    elements.dynamicPredictionInputs.innerHTML = '';
    
    // Group inputs into rows of two for clean layout
    features.forEach(feat => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.htmlFor = `pred-input-${feat}`;
        label.textContent = `${feat} Value:`;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.step = 'any';
        input.id = `pred-input-${feat}`;
        input.className = 'form-control';
        input.required = true;
        
        // Set placeholder or default value based on mean or median if possible
        // Let's use mean from descriptive calculations if we had it, otherwise simple defaults
        if (state.p_head && state.p_head.length > 0) {
            // Find average in first few rows as helper default
            const vals = state.p_head.map(row => row[feat]).filter(v => typeof v === 'number');
            if (vals.length > 0) {
                const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
                input.value = avg.toFixed(2);
            } else {
                input.value = '0';
            }
        } else {
            input.value = '0';
        }
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        elements.dynamicPredictionInputs.appendChild(formGroup);
    });
    
    elements.predictorCardContainer.classList.remove('hidden');
    elements.predictionResult.classList.add('hidden');
}


// 5. RUN PREDICTION
async function runPrediction() {
    try {
        const inputs = {};
        state.selectedFeatures.forEach(feat => {
            const val = document.getElementById(`pred-input-${feat}`).value;
            inputs[feat] = parseFloat(val);
        });
        
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: inputs })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate prediction.');
        }
        
        elements.predictedValue.textContent = data.prediction.toFixed(2);
        elements.predictionResult.classList.remove('hidden');
        
        // Scroll slightly down to make sure result is visible
        elements.predictionResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
    } catch(err) {
        showError(err.message);
    }
}
