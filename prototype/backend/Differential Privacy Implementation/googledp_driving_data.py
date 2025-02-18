import pandas as pd
from pydp.algorithms.numerical_mechanisms import LaplaceMechanism  # Correct import
import os
import numpy as np

def calculate_sensitivity(df, column):
    """
    Calculates the sensitivity of a given numerical column.
    Sensitivity = max(column) - min(column)
    """
    return df[column].max() - df[column].min()

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
    
    for column in numeric_columns:
        if column in df_copy.columns:
            sensitivity = calculate_sensitivity(df_copy, column)
            print(f"Sensitivity for {column}: {sensitivity}")
            
            df_copy[f"{column}_DP"] = df_copy[column].apply(
                lambda x: add_laplace_noise(x, sensitivity, epsilon) if pd.notnull(x) else x
            )
    
    return df_copy

if __name__ == "__main__":
    curr_dir_path = os.path.dirname(os.path.realpath(__file__))
    results_dir_path = os.path.join(curr_dir_path, "..", "SUMO", "results")
    # Load dataset
    df = pd.read_csv(results_dir_path + "/vehicle_data.csv")

    # Define numerical columns that need DP
    numeric_columns = ["Speed", "Acceleration", "Latitude", "Longitude", 
                       "Time_Gap", "Headway_Distance"]
    
    # Get all original columns that are not numeric
    non_numeric_columns = [col for col in df.columns if col not in numeric_columns]

    # Apply Differential Privacy
    df_dp = apply_differential_privacy(df, numeric_columns=numeric_columns, epsilon=5)

    # Keep only original and DP columns
    dp_columns = [f"{col}_DP" for col in numeric_columns]
    selected_columns = non_numeric_columns + dp_columns    
    df_dp = df_dp[selected_columns]
    
    # Save and display results
    df_dp.to_csv(results_dir_path + "/dp_vehicle_data.csv", index=False)
    print("Differentially private dataset saved as dp_vehicle_data.csv!")
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
