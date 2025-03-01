import time
import pandas as pd
from pydp.algorithms.laplacian import BoundedSum, BoundedMean

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
    
    print(data.head())
    print(data.shape)
    
    return data, data[features], data[target]

def load_kaggle_healthcare_dataset():
    healthcare_df = df = pd.read_csv('/home/apurv/Github/SDP/compare_tools/kaggle_healthcare_dataset/healthcare_dataset.csv')
    healthcare_df.dropna(inplace=True)
    healthcare_df['Billing Amount'] = healthcare_df['Billing Amount'].astype(int)
    print(healthcare_df.head())
    print(healthcare_df.shape)
    # print(healthcare_df["Medical Condition"].value_counts().sort_values())
    # print(healthcare_df["Age"].value_counts().sort_values())
    # print(healthcare_df[healthcare_df["Age"]==38]["Medical Condition"].value_counts().sort_values())
    return healthcare_df

def uci_adult_aggregations_test(data, num_trials, epsilon):
    base_avg_mean_age = 0
    base_avg_capital_gain = 0
    base_avg_capital_gain_age_36 = 0
    base_avg_capital_gain_age_36_education_4 = 0

    dp_avg_mean_age = 0
    dp_avg_capital_gain = 0
    dp_avg_capital_gain_age_36 = 0
    dp_avg_capital_gain_age_36_education_4 = 0

    for i in range(num_trials):
        base_mean_age = data["age"].mean()
        base_capital_gain = data["capital-gain"].mean()
        base_capital_gain_age_36 = data[data["age"] == 36]["capital-gain"].mean()
        base_capital_gain_age_36_education_4 = data[(data["age"] == 36) & (data["education-num"] >= 4)]["capital-gain"].mean()

        dp_mean_age = BoundedMean(epsilon=epsilon, lower_bound=data["age"].min(), upper_bound=data["age"].max())
        dp_mean_capital_gain = BoundedMean(epsilon=epsilon, lower_bound=data["capital-gain"].min(), upper_bound=data["capital-gain"].max())
        dp_mean_capital_gain_age_36 = BoundedMean(epsilon=epsilon, lower_bound=data["capital-gain"].min(), upper_bound=data["capital-gain"].max())
        dp_mean_capital_gain_age_36_education_4 = BoundedMean(epsilon=epsilon, lower_bound=data["capital-gain"].min(), upper_bound=data["capital-gain"].max())
        
        dp_mean_age.add_entries(data['age'])
        dp_mean_capital_gain.add_entries(data['capital-gain'])
        dp_mean_capital_gain_age_36.add_entries(data[data["age"] == 36]["capital-gain"].tolist())
        dp_mean_capital_gain_age_36_education_4.add_entries(data[(data["age"] == 36) & (data["education-num"] >= 4)]["capital-gain"].tolist())

        base_avg_mean_age += base_mean_age
        base_avg_capital_gain += base_capital_gain
        base_avg_capital_gain_age_36 += base_capital_gain_age_36
        base_avg_capital_gain_age_36_education_4 += base_capital_gain_age_36_education_4

        dp_avg_mean_age += dp_mean_age.result()
        dp_avg_capital_gain += dp_mean_capital_gain.result()
        dp_avg_capital_gain_age_36 += dp_mean_capital_gain_age_36.result()
        dp_avg_capital_gain_age_36_education_4 += dp_mean_capital_gain_age_36_education_4.result()
    
    results = {
        "Metric": [
            "Mean Age",
            "Mean Capital Gain",
            "Mean Capital Gain for Age 36",
            "Mean Capital Gain for Age 36 and Education 4+",
        ],
        "Baseline": [0] * 4,
        "Differentially Private": [0] * 4,
    }

    results["Baseline"][0] = base_avg_mean_age / num_trials
    results["Baseline"][1] = base_avg_capital_gain / num_trials
    results["Baseline"][2] = base_avg_capital_gain_age_36 / num_trials
    results["Baseline"][3] = base_avg_capital_gain_age_36_education_4 / num_trials

    results["Differentially Private"][0] = dp_avg_mean_age / num_trials
    results["Differentially Private"][1] = dp_avg_capital_gain / num_trials
    results["Differentially Private"][2] = dp_avg_capital_gain_age_36 / num_trials
    results["Differentially Private"][3] = dp_avg_capital_gain_age_36_education_4 / num_trials
    
    results_df = pd.DataFrame(results)
    print(f"\nResults (Epsilon: {epsilon}):")
    print(results_df)

def kaggle_healthcare_aggregations_test(data, num_trials, epsilon):
    base_avg_mean_age = 0
    base_avg_billing_amount = 0
    base_avg_billing_amount_age_38 = 0
    base_avg_billing_amount_age_38_diabetes = 0

    dp_avg_mean_age = 0
    dp_avg_billing_amount = 0
    dp_avg_billing_amount_age_38 = 0
    dp_avg_billing_amount_age_38_diabetes = 0

    for i in range(num_trials):
        base_mean_age = data["Age"].mean()
        base_billing_amount = data["Billing Amount"].mean()
        base_billing_amount_age_38 = data[data["Age"] == 38]["Billing Amount"].mean()
        base_billing_amount_age_38_diabetes = data[(data["Age"] == 38) & (data["Medical Condition"] == "Diabetes")]["Billing Amount"].mean()

        dp_mean_age = BoundedMean(epsilon=epsilon, lower_bound=data["Age"].min(), upper_bound=data["Age"].max())
        dp_mean_billing_amount = BoundedMean(epsilon=epsilon, lower_bound=data["Billing Amount"].min(), upper_bound=data["Billing Amount"].max())
        dp_mean_billing_amount_age_38 = BoundedMean(epsilon=epsilon, lower_bound=data["Billing Amount"].min(), upper_bound=data["Billing Amount"].max())
        dp_mean_billing_amount_age_38_diabetes = BoundedMean(epsilon=epsilon, lower_bound=data["Billing Amount"].min(), upper_bound=data["Billing Amount"].max())
        
        dp_mean_age.add_entries(data['Age'])
        dp_mean_billing_amount.add_entries(data['Billing Amount'])
        dp_mean_billing_amount_age_38.add_entries(data[data["Age"] == 38]["Billing Amount"].tolist())
        dp_mean_billing_amount_age_38_diabetes.add_entries(data[(data["Age"] == 38) & (data["Medical Condition"] == "Diabetes")]["Billing Amount"].tolist())

        base_avg_mean_age += base_mean_age
        base_avg_billing_amount += base_billing_amount
        base_avg_billing_amount_age_38 += base_billing_amount_age_38
        base_avg_billing_amount_age_38_diabetes += base_billing_amount_age_38_diabetes

        dp_avg_mean_age += dp_mean_age.result()
        dp_avg_billing_amount += dp_mean_billing_amount.result()
        dp_avg_billing_amount_age_38 += dp_mean_billing_amount_age_38.result()
        dp_avg_billing_amount_age_38_diabetes += dp_mean_billing_amount_age_38_diabetes.result()
    
    results = {
        "Metric": [
            "Mean Age",
            "Mean Billing Amount",
            "Mean Billing Amount for Age 38",
            "Mean Billing Amount for Age 38 and Diabetes",
        ],
        "Baseline": [0] * 4,
        "Differentially Private": [0] * 4,
    }

    results["Baseline"][0] = base_avg_mean_age / num_trials
    results["Baseline"][1] = base_avg_billing_amount / num_trials
    results["Baseline"][2] = base_avg_billing_amount_age_38 / num_trials
    results["Baseline"][3] = base_avg_billing_amount_age_38_diabetes / num_trials

    results["Differentially Private"][0] = dp_avg_mean_age / num_trials
    results["Differentially Private"][1] = dp_avg_billing_amount / num_trials
    results["Differentially Private"][2] = dp_avg_billing_amount_age_38 / num_trials
    results["Differentially Private"][3] = dp_avg_billing_amount_age_38_diabetes / num_trials
    
    results_df = pd.DataFrame(results)
    print(f"\nResults (Epsilon: {epsilon}):")
    print(results_df)    


if __name__ == '__main__':
    uci_adult_data, _, _ = load_uci_adult_dataset()
    for epsilon in [0.001, 0.01, 0.05, 0.1, 0.5, 1, 5, 10, 50, 100, 1000]:
        uci_adult_aggregations_test(uci_adult_data, 10, epsilon)
    heatlhcare_data = load_kaggle_healthcare_dataset()
    for epsilon in [0.001, 0.01, 0.05, 0.1, 0.5, 1, 5, 10, 50, 100, 1000]:
        kaggle_healthcare_aggregations_test(heatlhcare_data, 10, epsilon)
