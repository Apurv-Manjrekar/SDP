import time
import pandas as pd
import diffprivlib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from diffprivlib.models import LogisticRegression
from sklearn.linear_model import LogisticRegression as base_LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder


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
    
    return data

def logistic_regression_test(data, num_trials, epsilon):
    X = data[["age", "education-num", "hours-per-week", "capital-gain", "capital-loss"]]
    y = data["income_binary"]

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
    
    base_model_avg_accuracy /= num_trials
    dp_model_avg_accuracy /= num_trials
    base_model_avg_time /= num_trials
    dp_model_avg_time /= num_trials

    # Display time taken
    print(f"IBM Diffprivlib DP Logistic Regression Time Taken (Epsilon: {epsilon}):", dp_model_avg_time)
    print("Base Case Logistic Regression Time Taken:", base_model_avg_time)

    # Evaluate models
    print(f"IBM Diffprivlib DP Logistic Regression accuracy (Epsilon: {epsilon}):", dp_model_avg_accuracy)
    print("Base Case Logistic Regression Accuracy:", base_model_avg_accuracy)

if __name__ == '__main__':
    data = load_uci_adult_dataset()
    for epsilon in [0.01, 1, 100]:
        logistic_regression_test(data, 50, epsilon)