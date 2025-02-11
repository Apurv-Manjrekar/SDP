import pandas as pd
import numpy as np
from pydp.algorithms.laplacian import BoundedSum, BoundedMean

# Simulated Driving Data (Replace with SUMO-generated data)
def generate_driving_data(num_vehicles=1000, num_records=10000):
    np.random.seed(42)
    data = {
        "Time": np.random.randint(0, 86400, num_records),  # Seconds in a day
        "Vehicle_ID": np.random.randint(1, num_vehicles + 1, num_records),
        "Speed": np.random.uniform(0, 30, num_records),  # Speed in m/s
        "Acceleration": np.random.uniform(-5, 5, num_records),  # Acceleration in m/s²
        "Latitude": np.random.uniform(35.0, 36.0, num_records),  # Latitude
        "Longitude": np.random.uniform(-120.0, -119.0, num_records),  # Longitude
        "Time_Gap": np.random.uniform(0.5, 5, num_records),  # Time gap between vehicles (s)
        "Headway": np.random.uniform(1, 50, num_records),  # Distance headway in meters
        "Distance": np.random.uniform(0, 500, num_records),  # Distance traveled
        "Lane_Changes": np.random.randint(0, 5, num_records),  # Number of lane changes
    }
    return pd.DataFrame(data)

# Compute Risk Score for Individual Driver
def compute_risk_score(data):
    data["Risk_Score"] = (
        data["Speed"] * 0.3 + 
        abs(data["Acceleration"]) * 0.3 + 
        (5 - data["Time_Gap"]) * 0.2 + 
        data["Lane_Changes"] * 0.2
    )
    return data

# Apply Differential Privacy to Risk Scores
def apply_differential_privacy(data, epsilon):
    dp_mean_speed = BoundedMean(epsilon=epsilon, lower_bound=0, upper_bound=30)
    dp_mean_acceleration = BoundedMean(epsilon=epsilon, lower_bound=-5, upper_bound=5)
    dp_mean_risk = BoundedMean(epsilon=epsilon, lower_bound=0, upper_bound=100)

    dp_mean_speed.add_entries(data["Speed"])
    dp_mean_acceleration.add_entries(data["Acceleration"])
    dp_mean_risk.add_entries(data["Risk_Score"])

    dp_results = {
        "Baseline_Mean_Speed": data["Speed"].mean(),
        "DP_Mean_Speed": dp_mean_speed.result(),
        "Baseline_Mean_Acceleration": data["Acceleration"].mean(),
        "DP_Mean_Acceleration": dp_mean_acceleration.result(),
        "Baseline_Mean_Risk_Score": data["Risk_Score"].mean(),
        "DP_Mean_Risk_Score": dp_mean_risk.result(),
    }

    return dp_results

# Main Execution
if __name__ == "__main__":
    driving_data = generate_driving_data()
    driving_data = compute_risk_score(driving_data)
    
    epsilons = [0.001, 0.01, 0.05, 0.1, 0.5, 1, 5, 10, 50, 100, 1000]  # Varying privacy budgets

    for epsilon in epsilons:
        dp_results = apply_differential_privacy(driving_data, epsilon)
        print(f"\nResults (Epsilon: {epsilon}):")
        for key, value in dp_results.items():
            print(f"{key}: {value:.3f}")
