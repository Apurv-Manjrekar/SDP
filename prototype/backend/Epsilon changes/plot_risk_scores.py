import pandas as pd
import matplotlib.pyplot as plt

# File paths (assuming they are in the same directory as this script)
dp_file = "dp_vehicle_data_risk_scores.csv"
non_dp_file = "vehicle_data_risk_scores.csv"

# Load datasets
dp_data = pd.read_csv(dp_file)
non_dp_data = pd.read_csv(non_dp_file)

# Merge datasets on Vehicle_ID
merged_data = pd.merge(non_dp_data, dp_data, on="Vehicle_ID", suffixes=("_NonDP", "_DP"))

# Filter based on Vehicle_ID prefix
motorcycles = merged_data[merged_data["Vehicle_ID"].str.startswith("motorcycle")].sample(n=50, random_state=42)
trucks = merged_data[merged_data["Vehicle_ID"].str.startswith("truck")].sample(n=50, random_state=42)
vehicles = merged_data[merged_data["Vehicle_ID"].str.startswith("veh")].sample(n=50, random_state=42)

# Combine selected samples and sort by Vehicle_ID
sampled_data = pd.concat([motorcycles, trucks, vehicles]).sort_values(by="Vehicle_ID")

# Plot
plt.figure(figsize=(12, 6))
plt.plot(sampled_data.index, sampled_data["Risk_Score_NonDP"], label="Without Differential Privacy", marker='o', linestyle='-')
plt.plot(sampled_data.index, sampled_data["Risk_Score_DP"], label="With Differential Privacy", marker='s', linestyle='-')

# Formatting
plt.xlabel("Vehicle ID")
plt.ylabel("Risk Score")
plt.title("Risk Scores With and Without Differential Privacy")
plt.xticks([])  
plt.legend()
plt.grid(True)

# Save plot as an image in the same directory
plot_filename = "risk_scores_plot.png"
plt.savefig(plot_filename, dpi=300, bbox_inches='tight')

# Show the plot
plt.show()

print(f"Plot saved as {plot_filename}")
