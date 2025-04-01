import pandas as pd
import os
from pydp.algorithms.numerical_mechanisms import LaplaceMechanism
import argparse

#Calculate continuous sensitivity for a given column
def calculate_continous_sensitivity(df, column):
    return df[column].max() - df[column].min()

#Calculate sensitivity based on interquartile range
def calculate_percentile_sensitivity(df, column):
    return df[column].quantile(0.75) - df[column].quantile(0.25)

#Calculate sensitivity for location data
def calculate_location_sensitivity(df, column):
    return df[column].dropna().diff().abs().max()

#Add Laplace noise to a value based on sensitivity and epsilon
def add_laplace_noise(value, sensitivity, epsilon):
    laplace_mech = LaplaceMechanism(epsilon, sensitivity)
    return laplace_mech.add_noise(value)

#Apply differential privacy to specified numeric columns in the dataset
def apply_differential_privacy(df, numeric_columns=["Speed", "Acceleration", "Latitude", "Longitude", "Time_Gap"], epsilon=5):
    df_copy = df.copy()  

    #Calculate and store sensitivities
    sensitivities = {}
    for column in numeric_columns:
        if column in df_copy.columns:
            if column == "Speed" or column == "Acceleration":
                sensitivities[column] = calculate_continous_sensitivity(df_copy, column)
            elif column == "Latitude" or column == "Latitude":
                sensitivities[column] = calculate_location_sensitivity(df_copy, column)
            else:
                sensitivities[column] = calculate_percentile_sensitivity(df_copy, column)
            print(f"Sensitivity for {column}: {sensitivities[column]}")
    
    #Apply epsilon weight to each numeric column
    epsilon_weights = {
        "Speed": 0.3,
        "Acceleration": 0.4,
        "Time_Gap": 0.2,
        "Latitude": 0.05,
        "Longitude": 0.05,
    }

    #Apply Laplace noise to each numeric column
    for column in numeric_columns:
        if column in df_copy.columns:
            column_sensitivity = sensitivities[column]
            column_epsilon = epsilon * epsilon_weights[column]

            noise = column_sensitivity / column_epsilon

            print(f"Epsilon for {column}: {column_epsilon}")
            print(f"Noise for {column}: {noise}")
            
            df_copy[column] = df_copy[column].apply(
                lambda x: add_laplace_noise(x, column_sensitivity, column_epsilon) if pd.notnull(x) else x
            )
    
    return df_copy

def apply_multiple_epsilons(dataset, epsilon_values):
    for epsilon in epsilon_values:
        #Apply DP for each epsilon
        df_dp = apply_differential_privacy(dataset, epsilon=epsilon)

        #Save the output for each epsilon value
        output_file_path = f"dp_vehicle_data_epsilon_{epsilon}.csv"
        df_dp.to_csv(output_file_path, index=False)
        print(f"Differentially private dataset with epsilon {epsilon} saved as {output_file_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Apply Differential Privacy to vehicle data.")
    parser.add_argument("--dataset", type=str, required=True, help="Full path to dataset file (e.g., /path/to/vehicle_data.csv)")
    parser.add_argument("--epsilon_values", type=str, default="0.01,0.1,0.5,1.0,2.0,5.0", help="Comma-separated list of epsilon values to use (e.g., 0.01,0.1,1.0,5.0)")

    args = parser.parse_args()

    #Parse epsilon values from the command line argument
    epsilon_values = [float(e) for e in args.epsilon_values.split(",")]

    #Load dataset
    dataset_path = os.path.abspath(args.dataset)
    df = pd.read_csv(dataset_path, low_memory=False)
    df['Lane_Change'] = df['Lane_Change'].astype('boolean').fillna(False).astype(int)
    df['Collision'] = df['Collision'].astype('boolean').fillna(False).astype(int)

    #Apply Differential Privacy for each epsilon value
    apply_multiple_epsilons(df, epsilon_values)
