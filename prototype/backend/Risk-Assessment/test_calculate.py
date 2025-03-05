# source venv/bin/activate
import pandas as pd
import numpy as np
import os
import argparse

def calculate_risk(df):
    # Define risk weightings (adjustable based on importance)
    WEIGHTS = {
        "speeding": 2.0,
        "acceleration": 1.5,
        "braking": 1.5,
        "lane_change": 1.0,
        "headway": 2.0
    }

    # Define thresholds
    ACCELERATION_THRESHOLD = 3.0                    # m/s² (fast acceleration)
    BRAKING_THRESHOLD = -3.0                        # m/s² (hard braking)
    HEADWAY_THRESHOLD = 2.0                         # seconds (safe following distance)

    # Compute risk factors
    df["Speeding_Risk"] = (df["Speed"] > df["Speed_Limit"]).astype(int) * WEIGHTS["speeding"]
    df["Acceleration_Risk"] = (df["Acceleration"] > ACCELERATION_THRESHOLD).astype(int) * WEIGHTS["acceleration"]
    df["Braking_Risk"] = (df["Acceleration"] < BRAKING_THRESHOLD).astype(int) * WEIGHTS["braking"]
    df["Lane_Change_Risk"] = df["Lane_Change"].astype(int) * WEIGHTS["lane_change"]
    df["Headway_Risk"] = (df["Time_Gap"] < HEADWAY_THRESHOLD).astype(int) * WEIGHTS["headway"]

    # Compute total risk score per vehicle instance
    df["Risk_Score"] = df[["Speeding_Risk", "Acceleration_Risk", "Braking_Risk", "Lane_Change_Risk", "Headway_Risk"]].sum(axis=1)

    # Compute aggregate risk scores per road segment
    road_risk_scores = df.groupby(["Vehicle_ID"])["Risk_Score"].mean().reset_index()
    # road_risk_scores.rename(columns={"Risk_Score": "Avg_Risk_Score"}, inplace=True)

    # Save the baseline risk metrics
    # df.to_csv("baseline_risk_scores.csv", index=False)

    # Output summary statistics
    # print(df[["Speeding_Risk", "Acceleration_Risk", "Braking_Risk", "Lane_Change_Risk", "Headway_Risk"]].describe())
    #print(df[["Risk_Score"]].describe())
    print(road_risk_scores.head())

    return road_risk_scores

if __name__ == "__main__":
    '''parser = argparse.ArgumentParser(description="Calculate risk scores from vehicle data.")
    parser.add_argument("--dataset", type=str, required=True, help="Full path of dataset file (e.g., /path/to/vehicle_data.csv)")

    args = parser.parse_args()

    curr_dir_path = os.path.dirname(os.path.realpath(__file__))
    results_dir_path = os.path.join(curr_dir_path, "..", "SUMO", "results")

    dataset_path = os.path.abspath(args.dataset)
    input_dir = os.path.dirname(dataset_path)'''

    # Load the dataset
    input_file = "/Users/saimanish/SeniorDesign/SDP/prototype/backend/SUMO/results/vehicle_data.csv"
    df = pd.read_csv(input_file)
    #df = process_sumo_data(input_file)

    road_risk_scores = calculate_risk(df)
    # risk_score = road_risk_scores["Avg_Risk_Score"][0]

    # Save the risk metrics
    '''output_file_path = os.path.join(input_dir, os.path.basename(dataset_path)[:-4] + "_risk_scores.csv")
    road_risk_scores.to_csv(output_file_path, index=False)'''