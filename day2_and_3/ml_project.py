from sklearn import feature_selection
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, mutual_info_regression
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
import os

# category_encoders is needed for Target Encoding
try:
    from category_encoders import TargetEncoder
except ImportError:
    TargetEncoder = None
    print("Warning: category_encoders not installed. Target Encoding will be skipped.")


def main():
    print("Loading Dataset...")

    file_path = "train.csv"

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

    # Handling Missing Values
    print("\nHandle Missing DATA")
    print("Artificially deleting some 'Hits' (H) data to demonstrate")

    # Artificially create missing values
    df.loc[0:25, 'H'] = np.nan

    # Create an imputer that replaces missing values
    # with the median of H
    imputer = SimpleImputer(strategy='median')

    df[['H']] = imputer.fit_transform(df[['H']])

    print(
        f"Imputation complete. "
        f"'H' column now has {df['H'].isnull().sum()} missing values"
    )
#skewed Distributions

    print("Evaluating the skewed of the Runs (R) distribution.....")
    df['LogRuns']=np.log1p(df['R'])
    print(f"Log Transformation applied.New skewness:{df['LogRuns'].skew():.2f}")

#Creating High Cardineality manually


    df['Team_ID']=['Team_'+str(np.random.randint(1,150))for _ in range(len(df))]
    print("Categorical Data Created")
    if TargetEncoder is not None:
        print("Applying Target Encoder")

        encoder = TargetEncoder()
        df['Team_ID_Encoder']=encoder.fit_transform(df['Team_ID'],df['W'])
    else:
        print("Category Encoder not Installed")

        # Feature Selection
    print("\nPerforming Feature Selection...")

    features_to_test = ['R', 'HR', 'SO', 'SB']
    x_features = df[features_to_test].fillna(0)
    y_target = df['W']

    # Select the best 2 features using Mutual Information
    selector = SelectKBest(score_func=mutual_info_regression, k=2)
    selector.fit(x_features, y_target)

    winning_features = selector.get_support()
    best_features = x_features.columns[winning_features].tolist()

    print("\nFeature Selection Results")
    print("-------------------------")

    # Display feature scores
    for feature, score in zip(x_features.columns, selector.scores_):
        print(f"{feature}: {score:.4f}")

    print("\nBest Features:")
    print(best_features)

#Splitting Data

    x=df[best_features]
    y=df['W']

    x_train,x_test,y_train,y_test=train_test_split(x,y,test_size=0.2,random_state=42)

    print(f"x_train shape: {x_train.shape}\n")
    print(f"x_test shape: {x_test.shape}\n")
    print(f"y_train shape: {y_train.shape}\n")
    print(f"y_test shape: {y_test.shape}\n")

#train Model
    model=LinearRegression()
    model.fit(x_train,y_train)

    predictions = model.predict(x_test)

    print(predictions)

#comparing model prediction with actual real answer
    actual_wins=y_test.head(3).values
    predicted_wins=predictions[:3]

    for i in range(3):
        predicted = round(predicted_wins[i])
        actual = actual_wins[i]
        difference=abs(actual-predicted)

        print(f"Model Guessed: {predicted}")
        print(f"Real Answer: {actual}")
        print(f"Difference: {difference}")
if __name__ == "__main__":
    main()

















