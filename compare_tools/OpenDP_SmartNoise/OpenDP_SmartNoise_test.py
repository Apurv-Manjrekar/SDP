import time
import math
import pandas as pd
import snsql
from snsql import Privacy
from snsql.metadata import Metadata

def load_uci_adult_dataset():
    url = "https://archive.ics.uci.edu/ml/machine-learning-databases/adult/adult.data"
    columns = [
        "age", "workclass", "fnlwgt", "education", "education-num", "marital-status", 
        "occupation", "relationship", "race", "sex", "capital-gain", "capital-loss", 
        "hours-per-week", "native-country", "income"
    ]
    data = pd.read_csv(url, header=None, names=columns, na_values=" ?", skipinitialspace=True)
    data.dropna(inplace=True)
    
    data.rename(columns = {'education-num':'education_num', 'hours-per-week':'hours_per_week', 'capital-gain': 'capital_gain', 'capital-loss':'capital_loss'}, inplace=True)
    features = ["age", "education_num", "hours_per_week", "capital_gain", "capital_loss"]
    target = "income"
    data = data[features + [target]]
    
    
    print(data.head())
    print(data.shape)
    
    return data, data[features], data[target]

def load_kaggle_healthcare_dataset():
    healthcare_df = df = pd.read_csv('/home/apurv/Github/SDP/compare_tools/kaggle_healthcare_dataset/healthcare_dataset.csv')
    healthcare_df.dropna(inplace=True)
    healthcare_df['Billing Amount'] = healthcare_df['Billing Amount'].astype(int)
    healthcare_df.rename(columns={'Medical Condition':'Medical_Condition', 'Billing Amount': 'Billing_Amount'}, inplace=True)
    print(healthcare_df.head())
    print(healthcare_df.shape)
    # print(healthcare_df["Medical Condition"].value_counts().sort_values())
    # print(healthcare_df["Age"].value_counts().sort_values())
    # print(healthcare_df[healthcare_df["Age"]==38]["Medical Condition"].value_counts().sort_values())
    return healthcare_df

def create_metadata(data):
    metadata_dict = {
        "data": {
            "data": {
                "data": {
                    "max_ids": 1,
                    "row_privacy": True,
                    "rows": len(data),
                }
            }
        }
    }
    for column in data.columns:
        if pd.api.types.is_integer_dtype(data[column]):
            column_info = {
                "type": "int",
                "lower": int(data[column].min()),
                "upper": int(data[column].max())
            }
        elif pd.api.types.is_float_dtype(data[column]):
            column_info = {
                "type": "float",
                "lower": float(data[column].min()),
                "upper": float(data[column].max())
            }
        else:
            column_info = {
                "type": "string"
            }
        metadata_dict["data"]["data"]["data"][column] = column_info
    
    # print(metadata_dict)
    
    return Metadata.from_dict(metadata_dict)

def uci_adult_aggregations_test(data, num_trials, epsilon):
    base_avg_mean_age = 0
    base_avg_capital_gain = 0
    base_avg_capital_gain_age_36 = 0
    base_avg_capital_gain_age_36_education_4 = 0

    dp_avg_mean_age = 0
    dp_avg_capital_gain = 0
    dp_avg_capital_gain_age_36 = 0
    dp_avg_capital_gain_age_36_education_4 = 0
    try:
        for i in range(num_trials):
            base_mean_age = data["age"].mean()
            base_capital_gain = data["capital_gain"].mean()
            base_capital_gain_age_36 = data[data["age"] == 36]["capital_gain"].mean()
            base_capital_gain_age_36_education_4 = data[(data["age"] == 36) & (data["education_num"] >= 4)]["capital_gain"].mean()

            metadata = create_metadata(data)
            privacy = Privacy(epsilon=epsilon)
            delta = 1.0 / ((len(data))*(math.sqrt(len(data))))
            reader = snsql.from_connection(data, privacy=privacy, delta=delta, metadata=metadata)

            dp_mean_age = reader.execute("SELECT AVG(age) FROM data.data")
            dp_mean_capital_gain = reader.execute("SELECT AVG(capital_gain) FROM data.data")
            dp_mean_capital_gain_age_36 = reader.execute("SELECT AVG(capital_gain) FROM data.data WHERE age = 36")
            dp_mean_capital_gain_age_36_education_4 = reader.execute("SELECT AVG(capital_gain) FROM data.data WHERE age = 36 AND 'education_num' >= 4")

            base_avg_mean_age += base_mean_age
            base_avg_capital_gain += base_capital_gain
            base_avg_capital_gain_age_36 += base_capital_gain_age_36
            base_avg_capital_gain_age_36_education_4 += base_capital_gain_age_36_education_4

            # print(dp_mean_age)
            # print(dp_mean_capital_gain)
            # print(dp_mean_capital_gain_age_36)
            # print(dp_mean_capital_gain_age_36_education_4)
            dp_avg_mean_age += dp_mean_age[1][0]
            dp_avg_capital_gain += dp_mean_capital_gain[1][0]
            dp_avg_capital_gain_age_36 += dp_mean_capital_gain_age_36[1][0]
            dp_avg_capital_gain_age_36_education_4 += dp_mean_capital_gain_age_36_education_4[1][0]
    except Exception as e:
        print(e)

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
    try:
        for i in range(num_trials):
            base_mean_age = data["Age"].mean()
            base_billing_amount = data["Billing_Amount"].mean()
            base_billing_amount_age_38 = data[data["Age"] == 38]["Billing_Amount"].mean()
            base_billing_amount_age_38_diabetes = data[(data["Age"] == 38) & (data["Medical_Condition"] == "Diabetes")]["Billing_Amount"].mean()

            metadata = create_metadata(data)
            privacy = Privacy(epsilon=epsilon)
            reader = snsql.from_connection(data, privacy=privacy, metadata=metadata)

            dp_mean_age = reader.execute("SELECT AVG(Age) FROM data.data")
            dp_mean_billing_amount = reader.execute("SELECT AVG(Billing_Amount) FROM data.data")
            dp_mean_billing_amount_age_38 = reader.execute("SELECT AVG(Billing_Amount) FROM data.data WHERE Age = 38")
            dp_mean_billing_amount_age_38_diabetes = reader.execute("SELECT AVG(Billing_Amount) FROM data.data WHERE Age = 38 AND Medical_Condition = 'Diabetes'")

            base_avg_mean_age += base_mean_age
            base_avg_billing_amount += base_billing_amount
            base_avg_billing_amount_age_38 += base_billing_amount_age_38
            base_avg_billing_amount_age_38_diabetes += base_billing_amount_age_38_diabetes

            dp_avg_mean_age += dp_mean_age[1][0]
            dp_avg_billing_amount += dp_mean_billing_amount[2][0]
            dp_avg_billing_amount_age_38 += dp_mean_billing_amount_age_38[1][0]
            dp_avg_billing_amount_age_38_diabetes += dp_mean_billing_amount_age_38_diabetes[1][0]
    except Exception as e:
        print(e)

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