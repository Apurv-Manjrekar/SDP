import time
import torch
from opacus import PrivacyEngine
from torch import nn, optim
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
from sklearn.linear_model import LogisticRegression as base_LogisticRegression
import pandas as pd
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

def logistic_regression_test(X, y, num_trials, epsilon, delta=1e-5):
    base_model_avg_time = 0
    dp_model_avg_time = 0
    base_model_avg_accuracy = 0
    dp_model_avg_accuracy = 0
    
    if isinstance(y, pd.DataFrame):
        y = y.squeeze()

    for i in range(num_trials):
        # print(f"Trial: {i}, Epsilon: {epsilon}")
        # Split and scale the data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)

        # Convert data to PyTorch tensors
        X_train = torch.tensor(X_train, dtype=torch.float32)
        X_test = torch.tensor(X_test, dtype=torch.float32)
        y_train = torch.tensor(y_train.values, dtype=torch.long)
        y_test = torch.tensor(y_test.values, dtype=torch.long)

        num_classes = y.nunique()
        # print("Input features (X_train.shape[1]):", X_train.shape[1])
        # print("Number of output classes (num_classes):", num_classes)
        # Define logistic regression model
        model = nn.Sequential(nn.Linear(X_train.shape[1], num_classes))
        optimizer = optim.SGD(model.parameters(), lr=0.01)
        criterion = nn.CrossEntropyLoss()

        # Attach PrivacyEngine and specify batch size in make_private
        privacy_engine = PrivacyEngine()
        model, optimizer, data_loader = privacy_engine.make_private(
            module=model,
            optimizer=optimizer,
            data_loader=torch.utils.data.DataLoader(list(zip(X_train, y_train)), batch_size=32, shuffle=True),
            noise_multiplier=1.0 / epsilon,
            max_grad_norm=1.0
        )

        # DP model training
        dp_model_start = time.time()
        for epoch in range(1):  # Training for 5 epochs
            for X_batch, y_batch in data_loader:
                optimizer.zero_grad()
                outputs = model(X_batch)
                loss = criterion(outputs, y_batch)
                loss.backward()
                optimizer.step()
            # print(f"Trial: {i}, Epsilon: {epsilon}, Epoch: {epoch}")
        
        dp_model_time = time.time() - dp_model_start

        # Non-private model training
        base_model_start = time.time()
        base_model = base_LogisticRegression()
        base_model.fit(X_train.numpy(), y_train.numpy())
        base_model_time = time.time() - base_model_start

        # Predictions and accuracy calculation
        y_pred = base_model.predict(X_test.numpy())
        base_model_accuracy = accuracy_score(y_test, y_pred)
        dp_model_accuracy = (torch.argmax(model(X_test), dim=1) == y_test).float().mean().item()

        base_model_avg_time += base_model_time
        dp_model_avg_time += dp_model_time
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