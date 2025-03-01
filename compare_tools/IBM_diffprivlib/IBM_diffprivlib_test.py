import time
import pandas as pd
import diffprivlib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from diffprivlib.models import LogisticRegression
from sklearn.linear_model import LogisticRegression as base_LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings("ignore")


def load_uci_adult_dataset():
    url = "https://archive.ics.uci.edu/ml/machine-learning-databases/adult/adult.data"
    columns = [
        "age", "workclass", "fnlwgt", "education", "education-num", "marital-status", 
        "occupation", "relationship", "race", "sex", "capital-gain", "capital-loss", 
        "hours-per-week", "native-country", "income"
    ]
    data = pd.read_csv(url, header=None, names=columns, na_values=" ?", skipinitialspace=True)
    data.dropna(inplace=True)

    features = ["age", "education-num", "hours-per-week", "capital-gain", "capital-loss"]
    target = "income"
    data = data[features + [target]]

    data["income_binary"] = LabelEncoder().fit_transform(data["income"])

    data = data[features + ["income_binary"]]
    
    print(data.head())
    print(data.shape)
    
    return data, data[features], data["income_binary"]

def load_kaggle_healthcare_dataset():
    healthcare_df = df = pd.read_csv('/home/apurv/Github/SDP/compare_tools/kaggle_healthcare_dataset/healthcare_dataset.csv')
    healthcare_df.dropna(inplace=True)
    healthcare_df['Billing Amount'] = healthcare_df['Billing Amount'].astype(int)
    healthcare_df['Gender Binary'] = LabelEncoder().fit_transform(healthcare_df["Gender"])
    healthcare_df['Medical Condition Binary'] = LabelEncoder().fit_transform(healthcare_df["Medical Condition"])
    healthcare_df['Admission Type Binary'] = LabelEncoder().fit_transform(healthcare_df["Admission Type"])
    healthcare_df['Medication Binary'] = LabelEncoder().fit_transform(healthcare_df["Medication"])
    healthcare_df['Test Results Binary'] = LabelEncoder().fit_transform(healthcare_df["Test Results"])
    features = ["Age", "Gender Binary", "Medical Condition Binary", "Admission Type Binary", "Medication Binary", "Billing Amount"]
    target = ["Test Results Binary"]
    healthcare_df = healthcare_df[features + target]
    print(healthcare_df.head())
    print(healthcare_df.shape)
    return healthcare_df, healthcare_df[features], healthcare_df[target]

def logistic_regression_test(X, y, num_trials, epsilon):
    base_model_avg_time = 0
    dp_model_avg_time = 0
    base_model_avg_accuracy = 0
    dp_model_avg_accuracy = 0

    for i in range(num_trials):
        # Split and scale the data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)

        # Train DP Logistic Regression model
        dp_model_start = time.time()
        dp_model = LogisticRegression(epsilon=epsilon)
        dp_model.fit(X_train, y_train)
        dp_model_time = time.time() - dp_model_start

        # Train non-private logistic regression model
        base_model_start = time.time()
        base_model = base_LogisticRegression()
        base_model.fit(X_train, y_train)
        base_model_time = time.time() - base_model_start

        base_model_avg_time += base_model_time
        dp_model_avg_time += dp_model_time
        
        y_pred = base_model.predict(X_test)
        base_model_accuracy = accuracy_score(y_test, y_pred)
        dp_model_accuracy = dp_model.score(X_test, y_test)

        base_model_avg_accuracy += base_model_accuracy
        dp_model_avg_accuracy += dp_model_accuracy
    
    results = {
        "Metric": [
            "Time Taken",
            "Accuracy"
        ],
        "Baseline": [0] * 2,
        "Differentially Private": [0] * 2,
    }

    results["Baseline"][0] = base_model_avg_time / num_trials
    results["Baseline"][1] = base_model_avg_accuracy / num_trials

    results["Differentially Private"][0] = dp_model_avg_time / num_trials
    results["Differentially Private"][1] = dp_model_avg_accuracy / num_trials

    results_df = pd.DataFrame(results)
    print(f"\nResults (Epsilon: {epsilon}):")
    print(results_df)

if __name__ == '__main__':
    _, X, y = load_uci_adult_dataset()
    for epsilon in [0.001, 0.01, 0.05, 0.1, 0.5, 1, 5, 10, 50, 100, 1000]:
        logistic_regression_test(X, y, 10, epsilon)
    _, X, y = load_kaggle_healthcare_dataset()
    for epsilon in [0.001, 0.01, 0.05, 0.1, 0.5, 1, 5, 10, 50, 100, 1000]:
        logistic_regression_test(X, y, 10, epsilon)