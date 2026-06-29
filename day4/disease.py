import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, mutual_info_regression
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
import os

try:
    from category_encoders import TargetEncoder
except ImportError:
    TargetEncoder = None
    print("Warning: category_encoders not installed. Target Encoding will be skipped.")


def main():
    print("Loading Dataset...")

    file_path = "disease_prediction.csv"

    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    df = pd.read_csv(file_path)

    print(
        f"Dataset loaded successfully.\n"
        f"Rows: {df.shape[0]}\n"
        f"Columns: {df.shape[1]}"
    )

    print("\nColumn names:")
    print(df.columns.tolist())

    print("\nHandle Missing DATA")

    df.loc[0:25, 'age'] = np.nan

    imputer = SimpleImputer(strategy='median')

    df[['age']] = imputer.fit_transform(df[['age']])

    print(
        f"Imputation complete. "
        f"'H' column now has {df['age'].isnull().sum()} missing values"
    )

    print("Evaluating skewness of Runs (R)...")

    df['LogRuns'] = np.log1p(df['glucose_mg_dl'])

    print(
        f"Log Transformation applied. "
        f"New skewness: {df['LogRuns'].skew():.2f}"
    )

    df['Team_ID'] = [
        'Team_' + str(np.random.randint(1, 150))
        for _ in range(len(df))
    ]

    print("Categorical Data Created")

    if TargetEncoder is not None:
        print("Applying Target Encoder")

        encoder = TargetEncoder()

        df['Team_ID_Encoder'] = encoder.fit_transform(
            df['Team_ID'],
            df['disease']
        )

    else:
        print("Category Encoder not Installed")

    print("\nPerforming Feature Selection...")

    features_to_test = ['glucose_mg_dl', 'cholesterol_mg_dl', 'systolic_bp', 'bmi']

    x_features = df[features_to_test].fillna(0)

    # Encode target: 'Yes' -> 1, 'No' -> 0
    y_target = df['disease'].map({'Yes': 1, 'No': 0})

    selector = SelectKBest(
        score_func=mutual_info_regression,
        k=2
    )

    selector.fit(x_features, y_target)

    winning_features = selector.get_support()

    best_features = x_features.columns[
        winning_features
    ].tolist()

    print("\nFeature Selection Results")
    print("-------------------------")

    for feature, score in zip(
        x_features.columns,
        selector.scores_
    ):
        print(f"{feature}: {score:.4f}")

    print("\nBest Features:")
    print(best_features)

    x = df[best_features]
    y = df['disease'].map({'Yes': 1, 'No': 0})

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42
    )

    print(f"x_train shape: {x_train.shape}")
    print(f"x_test shape: {x_test.shape}")
    print(f"y_train shape: {y_train.shape}")
    print(f"y_test shape: {y_test.shape}")

    model = LinearRegression()

    model.fit(x_train, y_train)

    predictions = model.predict(x_test)

    print("\nPredictions:")
    print(predictions)

    actual_wins = y_test.head(3).values
    predicted_wins = predictions[:3]

    print("\nPrediction Comparison")

    for i in range(3):
        predicted = round(predicted_wins[i])

        actual = actual_wins[i]

        difference = abs(actual - predicted)

        print(f"\nModel Guessed: {predicted}")
        print(f"Real Answer: {actual}")
        print(f"Difference: {difference}")


if __name__ == "__main__":
    main()