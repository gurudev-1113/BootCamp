import os
import sys
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, mutual_info_regression
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

try:
    from category_encoders import TargetEncoder
except ImportError:
    TargetEncoder = None

app = Flask(__name__, static_folder='static', static_url_path='')

# Global state to keep track of loaded dataset, preprocessed dataset, and trained model
global_state = {
    'raw_df': None,
    'processed_df': None,
    'model': None,
    'selected_features': None,
    'target_col': None,
    'imputer': None,
    'encoder': None,
    'encoder_col': None,
    'log_transform_cols': []
}

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/load-dataset', methods=['POST'])
def load_dataset():
    try:
        data = request.json or {}
        file_name = data.get('file_name', 'train.csv')
        
        # Check if file exists
        if not os.path.exists(file_name):
            return jsonify({'error': f"File '{file_name}' not found."}), 404
        
        df = pd.read_csv(file_name)
        
        # Reset state on loading new dataset
        global_state['raw_df'] = df.copy()
        global_state['processed_df'] = df.copy()
        global_state['model'] = None
        global_state['selected_features'] = None
        global_state['target_col'] = None
        global_state['imputer'] = None
        global_state['encoder'] = None
        global_state['encoder_col'] = None
        global_state['log_transform_cols'] = []
        
        # If train.csv, artificially insert missing values for 'H' to demonstrate imputation like ml_project.py
        if file_name == 'train.csv' and 'H' in df.columns:
            # Artificially delete some 'H' data
            df.loc[0:25, 'H'] = np.nan
            global_state['raw_df'] = df.copy()
            global_state['processed_df'] = df.copy()

        # Compute information
        columns = df.columns.tolist()
        shape = list(df.shape)
        
        # Check column types
        types = {}
        skewness = {}
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                types[col] = 'numeric'
                # handle nan in skewness calculation
                skew_val = df[col].dropna().skew()
                skewness[col] = float(skew_val) if not pd.isna(skew_val) else 0.0
            else:
                types[col] = 'categorical'
        
        # Handle nan for json serialization in head
        head_df = df.head(10).replace({np.nan: None})
        head_records = head_df.to_dict(orient='records')
        
        missing_values = df.isnull().sum().to_dict()
        # Convert values to int for serialization
        missing_values = {k: int(v) for k, v in missing_values.items()}
        
        return jsonify({
            'file_name': file_name,
            'shape': shape,
            'columns': columns,
            'types': types,
            'skewness': skewness,
            'missing_values': missing_values,
            'head': head_records
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/preprocess', methods=['POST'])
def preprocess():
    try:
        if global_state['raw_df'] is None:
            return jsonify({'error': 'No dataset loaded. Please load a dataset first.'}), 400
            
        data = request.json or {}
        impute_cols = data.get('impute_cols', [])
        impute_strategy = data.get('impute_strategy', 'median')
        log_transform_cols = data.get('log_transform_cols', [])
        target_encode_col = data.get('target_encode_col', '')
        target_encode_y = data.get('target_encode_y', '')
        create_team_id = data.get('create_team_id', False)
        
        df = global_state['raw_df'].copy()
        
        # 1. Artificially create Team_ID if requested (like in ml_project.py)
        if create_team_id:
            np.random.seed(42)  # For reproducibility
            df['Team_ID'] = ['Team_'+str(np.random.randint(1, 150)) for _ in range(len(df))]
        
        # 2. Imputation
        if impute_cols:
            # SimpleImputer expects 2D array or df
            imputer = SimpleImputer(strategy=impute_strategy)
            df[impute_cols] = imputer.fit_transform(df[impute_cols])
            global_state['imputer'] = imputer
            
        # 3. Log Transformation
        global_state['log_transform_cols'] = log_transform_cols
        for col in log_transform_cols:
            if col in df.columns:
                # To match ml_project.py naming or apply in place? Let's apply in place or create a new column.
                # In ml_project.py, it created 'LogRuns' = np.log1p(df['R']). 
                # Let's create 'Log' + ColName to keep the original clean, or apply in place.
                # Creating a new column is cleaner and allows selecting both in feature selection.
                new_col_name = f"Log{col}"
                df[new_col_name] = np.log1p(df[col])
                
        # 4. Target Encoding
        if target_encode_col and target_encode_y:
            if target_encode_col in df.columns and target_encode_y in df.columns:
                if TargetEncoder is not None:
                    encoder = TargetEncoder()
                    new_encoded_col = f"{target_encode_col}_Encoded"
                    df[new_encoded_col] = encoder.fit_transform(df[target_encode_col], df[target_encode_y])
                    global_state['encoder'] = encoder
                    global_state['encoder_col'] = target_encode_col
                else:
                    return jsonify({'error': 'category_encoders package is not available.'}), 500
        
        global_state['processed_df'] = df.copy()
        
        # Compute info
        columns = df.columns.tolist()
        shape = list(df.shape)
        
        types = {}
        skewness = {}
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                types[col] = 'numeric'
                skew_val = df[col].dropna().skew()
                skewness[col] = float(skew_val) if not pd.isna(skew_val) else 0.0
            else:
                types[col] = 'categorical'
                
        head_df = df.head(10).replace({np.nan: None})
        head_records = head_df.to_dict(orient='records')
        missing_values = df.isnull().sum().to_dict()
        missing_values = {k: int(v) for k, v in missing_values.items()}
        
        return jsonify({
            'shape': shape,
            'columns': columns,
            'types': types,
            'skewness': skewness,
            'missing_values': missing_values,
            'head': head_records
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/feature-selection', methods=['POST'])
def feature_selection():
    try:
        if global_state['processed_df'] is None:
            return jsonify({'error': 'Please load and preprocess dataset first.'}), 400
            
        data = request.json or {}
        feature_cols = data.get('feature_cols', [])
        target_col = data.get('target_col', '')
        k = data.get('k', 2)
        
        df = global_state['processed_df'].copy()
        
        if not target_col or target_col not in df.columns:
            return jsonify({'error': f"Target column '{target_col}' not found in dataset."}), 400
            
        # Filter feature columns that exist in the dataframe
        valid_features = [f for f in feature_cols if f in df.columns]
        if not valid_features:
            return jsonify({'error': 'No valid feature columns provided.'}), 400
            
        # Select numeric types and fill remaining missing values with 0 for safety
        x_features = df[valid_features].select_dtypes(include=[np.number]).fillna(0)
        y_target = df[target_col].fillna(0)
        
        if x_features.shape[1] == 0:
            return jsonify({'error': 'No numeric features available for selection.'}), 400
            
        # Limit k to total features
        k = min(int(k), x_features.shape[1])
        
        selector = SelectKBest(score_func=mutual_info_regression, k=k)
        selector.fit(x_features, y_target)
        
        winning_features = selector.get_support()
        best_features = x_features.columns[winning_features].tolist()
        
        scores = {col: float(score) for col, score in zip(x_features.columns, selector.scores_)}
        
        return jsonify({
            'scores': scores,
            'best_features': best_features
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/train-model', methods=['POST'])
def train_model():
    try:
        if global_state['processed_df'] is None:
            return jsonify({'error': 'Please load and preprocess dataset first.'}), 400
            
        data = request.json or {}
        feature_cols = data.get('feature_cols', [])
        target_col = data.get('target_col', '')
        test_size = float(data.get('test_size', 0.2))
        random_state = int(data.get('random_state', 42))
        
        df = global_state['processed_df'].copy()
        
        if not target_col or target_col not in df.columns:
            return jsonify({'error': f"Target column '{target_col}' not found in dataset."}), 400
            
        valid_features = [f for f in feature_cols if f in df.columns]
        if not valid_features:
            return jsonify({'error': 'No valid features selected for training.'}), 400
            
        # Prepare inputs
        x = df[valid_features].fillna(0)
        y = df[target_col].fillna(0)
        
        x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=test_size, random_state=random_state)
        
        # Fit model
        model = LinearRegression()
        model.fit(x_train, y_train)
        
        # Evaluate
        predictions = model.predict(x_test)
        
        mse = mean_squared_error(y_test, predictions)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test, predictions)
        
        # Save state
        global_state['model'] = model
        global_state['selected_features'] = valid_features
        global_state['target_col'] = target_col
        
        # Coefficients
        coefficients = {feat: float(coef) for feat, coef in zip(valid_features, model.coef_)}
        intercept = float(model.intercept_)
        
        # Generate head comparisons (up to 30)
        comparison = []
        y_test_values = y_test.values
        for i in range(min(30, len(y_test_values))):
            comparison.append({
                'id': i + 1,
                'actual': float(y_test_values[i]),
                'predicted': float(predictions[i]),
                'difference': float(abs(y_test_values[i] - predictions[i]))
            })
            
        return jsonify({
            'r2_score': float(r2),
            'mse': float(mse),
            'rmse': float(rmse),
            'coefficients': coefficients,
            'intercept': intercept,
            'comparison': comparison
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        if global_state['model'] is None:
            return jsonify({'error': 'No trained model available. Please train a model first.'}), 400
            
        data = request.json or {}
        inputs = data.get('inputs', {})
        
        # Verify inputs match selected features
        selected = global_state['selected_features']
        missing_inputs = [feat for feat in selected if feat not in inputs]
        if missing_inputs:
            return jsonify({'error': f"Missing input values for features: {missing_inputs}"}), 400
            
        # Order inputs correctly
        ordered_input = [float(inputs[feat]) for feat in selected]
        
        model = global_state['model']
        prediction = model.predict([ordered_input])[0]
        
        return jsonify({
            'prediction': float(prediction)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run locally on port 5000
    app.run(debug=True, host='127.0.0.1', port=5000)
