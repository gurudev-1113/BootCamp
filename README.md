# Machine Learning Data Preprocessing Project

## Overview

This project demonstrates a complete machine learning preprocessing pipeline using Python and Scikit-learn.

The workflow includes:

* Loading a dataset
* Handling missing values
* Log transformation for skewed data
* Creating a high-cardinality categorical feature
* Target Encoding
* Feature Selection using Mutual Information
* Splitting data into training and testing sets
* Training a Linear Regression model
* Comparing predicted values with actual values

---

## Dataset

The project uses the **train.csv** dataset.

Target Variable:

* **W** (Wins)

Features Used:

* R (Runs)
* HR (Home Runs)
* SO (Strikeouts)
* SB (Stolen Bases)

---

## Technologies Used

* Python
* Pandas
* NumPy
* Scikit-learn
* Category Encoders

---

## Project Workflow

1. Load dataset
2. Handle missing values using Median Imputation
3. Apply Log Transformation to reduce skewness
4. Create a high-cardinality categorical feature
5. Encode categorical data using Target Encoding
6. Perform Feature Selection using Mutual Information
7. Split data into Train/Test sets
8. Train a Linear Regression model
9. Predict target values
10. Compare predictions with actual values

---

## Installation

Install the required libraries:

```bash
pip install -r requirements.txt
```

---

## Run the Project

```bash
python ml_project.py
```

---

## Sample Output

* Dataset Loaded
* Missing Values Imputed
* Log Transformation Applied
* Target Encoding Completed
* Best Features Selected
* Linear Regression Model Trained
* Predictions Generated

---

## Author

Gurudev
