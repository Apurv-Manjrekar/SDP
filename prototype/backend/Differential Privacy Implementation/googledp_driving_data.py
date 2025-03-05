import pandas as pd
from pydp.algorithms.numerical_mechanisms import LaplaceMechanism  # Correct import
import os
import numpy as np
import argparse
from ast import literal_eval


def calculate_continous_sensitivity(df, column):
    """
    Calculates the sensitivity of a given numerical column.
    Sensitivity = max(column) - min(column)
    """
    return df[column].max() - df[column].min()

def calculate_percentile_sensitivity(df, column):
    return df[column].quantile(0.75) - df[column].quantile(0.25)

def calculate_location_sensitivity(df, column):
    return df[column].dropna().diff().abs().max()

def add_laplace_noise(value, sensitivity, epsilon):
    """
    Adds Laplace noise to a given value using the specified sensitivity and epsilon.
    """
    laplace_mech = LaplaceMechanism(epsilon, sensitivity)
    return laplace_mech.add_noise(value)

def apply_differential_privacy(df, numeric_columns=["Speed", "Acceleration", "Latitude", "Longitude", "Time_Gap", "Headway_Distance"], epsilon=5):
    """
    Applies Differential Privacy to specified numeric columns in the dataframe.
    
    Parameters:
    df (pd.DataFrame): Input DataFrame.
    numeric_columns (list): List of numeric column names to apply DP.
    epsilon (float): Privacy budget (default: 5).
    
    Returns:
    pd.DataFrame: DataFrame with DP-applied columns.
    """
    df_copy = df.copy()  # Avoid modifying original data

    senstivities = {}
    for column in numeric_columns:
        if column in df_copy.columns:
            if column == "Speed" or column == "Acceleration":
                senstivities[column] = calculate_continous_sensitivity(df_copy, column)
            elif column == "Latitude" or column == "Latitude":
                senstivities[column] = calculate_location_sensitivity(df_copy, column)
            else:
                senstivities[column] = calculate_percentile_sensitivity(df_copy, column)
            print(f"Sensitivity for {column}: {senstivities[column]}")

    epsilon_weights = {
        "Speed": 0.3,
        "Acceleration": 0.4,
        "Time_Gap": 0.2,
        "Latitude": 0.05,
        "Longitude": 0.05,
    }

    for column in numeric_columns:
        if column in df_copy.columns:
            column_sensitivity = senstivities[column]
            column_epsilon = epsilon * epsilon_weights[column]

            noise = column_sensitivity / column_epsilon

            print(f"Epsilon for {column}: {column_epsilon}")
            print(f"Noise for {column}: {noise}")
            
            df_copy[column] = df_copy[column].apply(
                lambda x: add_laplace_noise(x, column_sensitivity, column_epsilon) if pd.notnull(x) else x
            )
    
    return df_copy

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Apply Differential Privacy to vehicle data.")
    parser.add_argument("--dataset", type=str, required=True, help="Full path to dataset file (e.g., /path/to/vehicle_data.csv)")
    parser.add_argument("--epsilon", type=float, default=5.0, help="Epsilon parameter to use while applying differential privacy.")

    args = parser.parse_args()

    epsilon = args.epsilon

    curr_dir_path = os.path.dirname(os.path.realpath(__file__))
    results_dir_path = os.path.join(curr_dir_path, "..", "SUMO", "results")

    dataset_path = os.path.abspath(args.dataset)
    input_dir = os.path.dirname(dataset_path)
    
    # Load dataset
    df = pd.read_csv(dataset_path)

    # Define numerical columns that need DP
    numeric_columns = ["Speed", "Acceleration", "Latitude", "Longitude", 
                       "Time_Gap", 
                    #    "Headway_Distance"
                       ]
    
    # Get all original columns that are not numeric
    non_numeric_columns = [col for col in df.columns if col not in numeric_columns]

    # Apply Differential Privacy
    df_dp = apply_differential_privacy(df, numeric_columns=numeric_columns, epsilon=epsilon)

    # Keep only original and DP columns
    # dp_columns = [f"{col}_DP" for col in numeric_columns]
    # selected_columns = non_numeric_columns + dp_columns    
    # df_dp = df_dp[selected_columns]

    # Save and display results
    output_file_path = os.path.join(input_dir, "dp_" + os.path.basename(dataset_path))
    df_dp.to_csv(output_file_path, index=False)
    print(f"Differentially private dataset saved as {output_file_path}")
    print(df_dp.head())


###################### FOR CONTINOUS DATA ######################
# import numpy as np
# import pandas as pd
# from pydp.algorithms.numerical_mechanisms import LaplaceMechanism  # Correct import

# # Load the collected data
# df = pd.read_csv("vehicle_data.csv")

# # Define privacy budget (epsilon)
# epsilon = 5  # Smaller epsilon = more privacy, larger epsilon = better accuracy

# # Function to calculate sensitivity dynamically (for numeric columns)
# def calculate_sensitivity(df, column):
#     return df[column].max() - df[column].min()

# # Function to add Laplace noise using column-specific sensitivity
# def add_laplace_noise(value, sensitivity, epsilon):
#     laplace_mech = LaplaceMechanism(epsilon, sensitivity)
#     return laplace_mech.add_noise(value)

# # Apply DP to numeric columns
# columns_to_noise = ["Speed", "Acceleration"]
# for column in columns_to_noise:
#     if column in df.columns:  # Ensure column exists
#         sensitivity = calculate_sensitivity(df, column)  # Auto-determine sensitivity
#         print(f"Sensitivity for {column}: {sensitivity}")
#         df[f"{column}_DP"] = df[column].apply(lambda x: add_laplace_noise(x, sensitivity, epsilon))


# df = df[["Speed", "Speed_DP", "Acceleration", "Acceleration_DP"]]


# print("Differentially private dataset saved as dp_vehicle_data.csv!")
# print(df.head())

#######SENSITIVITY
# def calculate_sensitivity(df, column):
#     # Constraint-based sensitivity for fields with known limits
#     # constraint_sens = {
#     #     "Speed": 120,          # Maximum speed limit (0-120 km/h)
#     #     "Acceleration": 20,    # Maximum acceleration/deceleration (m/s²)
#     #     "Time_Gap": 60,        # Maximum allowed time gap (seconds)
#     #     "Headway_Distance": 200 # Maximum headway distance (meters)
#     # }
#     # If the column is in the constraint sensitivity dictionary, return the corresponding value
#     # if column in constraint_sens:
#     #     return constraint_sens[column]
#     #
#     # Local sensitivity for geographical coordinates (Latitude, Longitude)
#     # if column in ["Latitude", "Longitude"]:
#     #     # Calculate the absolute differences between consecutive values
#     #     diffs = np.abs(df[column].diff().dropna())
#     #     # Return the 95th percentile of differences to avoid outliers
#     #     return np.percentile(diffs, 95) if not diffs.empty else 0.0
#     # Default to global sensitivity
#     return df[column].max() - df[column].min()