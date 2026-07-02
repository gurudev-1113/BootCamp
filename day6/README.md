# Day 6: Advanced Machine Learning Models & Techniques

This directory contains the `BootcampD6.ipynb` notebook, which focuses on advanced classification techniques, hyperparameter optimization, and model interpretability.

## Dataset
- **Breast Cancer Dataset** (loaded from `sklearn.datasets`)
- **Objective**: Binary classification to predict whether a tumor is malignant or benign.

## Models Implemented
1. **Random Forest Classifier**
2. **XGBoost Classifier**
3. **LightGBM Classifier**
4. **Decision Tree Classifier** (with balanced class weights)

## Key Techniques & Concepts Covered

### 1. Model Evaluation
- Accuracy, Precision, Recall, and F1-Score
- Confusion Matrices
- ROC-AUC Curve and Score

### 2. Hyperparameter Tuning
- **GridSearchCV**: Exhaustive search over a specified parameter grid.
- **RandomizedSearchCV**: Randomized search over parameters for faster tuning.
- **Optuna**: Automated, state-of-the-art hyperparameter optimization framework.

### 3. Handling Imbalanced Data
- **SMOTE** (Synthetic Minority Over-sampling Technique)
- **RandomOverSampler**
- Adjusting class weights directly within models (`scale_pos_weight`, `class_weight="balanced"`).

### 4. Model Interpretability (SHAP)
- Used the **SHAP (SHapley Additive exPlanations)** library to interpret model predictions.
- Generated global feature importance plots (`summary_plot`).
- Generated local individual prediction explanations (`force_plot` configured with `matplotlib=True` for static rendering).

## Requirements
To run this notebook, ensure you have the following installed:
```bash
pip install pandas numpy matplotlib seaborn scikit-learn xgboost lightgbm optuna imbalanced-learn shap
```
