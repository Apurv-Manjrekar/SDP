import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import contextily as ctx

file_path = "vehicle_data.csv"
df = pd.read_csv(file_path)

WEIGHTS = {
    "speeding": 2.0,
    "acceleration": 1.5,
    "braking": 1.5,
    "lane_change": 1.0,
    "headway": 2.0
}

ACCELERATION_THRESHOLD = 2.5
BRAKING_THRESHOLD = -2.5
HEADWAY_THRESHOLD = 2.5
SPEEDING_MULTIPLIER = 1.05

df["Speeding_Risk"] = (df["Speed"] > df["Speed_Limit"] * SPEEDING_MULTIPLIER).astype(int) * WEIGHTS["speeding"]
df["Acceleration_Risk"] = (df["Acceleration"] > ACCELERATION_THRESHOLD).astype(int) * WEIGHTS["acceleration"]
df["Braking_Risk"] = (df["Acceleration"] < BRAKING_THRESHOLD).astype(int) * WEIGHTS["braking"]
df["Lane_Change_Risk"] = df["Lane_Change"].astype(int) * WEIGHTS["lane_change"]
df["Headway_Risk"] = (df["Time_Gap"] < HEADWAY_THRESHOLD).astype(int) * WEIGHTS["headway"]

df["Risk_Score"] = df[["Speeding_Risk", "Acceleration_Risk", "Braking_Risk", "Lane_Change_Risk", "Headway_Risk"]].sum(axis=1)

road_risk_scores = df.groupby(["Latitude", "Longitude"])["Risk_Score"].mean().reset_index()
road_risk_scores.rename(columns={"Risk_Score": "Avg_Risk_Score"}, inplace=True)

df.to_csv("updated_risk_scores.csv", index=False)

fig, ax = plt.subplots(figsize=(10, 6))

sc = ax.scatter(
    road_risk_scores["Longitude"], road_risk_scores["Latitude"], 
    c=road_risk_scores["Avg_Risk_Score"], cmap="YlOrRd", 
    s=road_risk_scores["Avg_Risk_Score"] * 20, 
    edgecolor="black", alpha=0.7
)

ctx.add_basemap(ax, crs="EPSG:4326", source=ctx.providers.OpenStreetMap.Mapnik)

plt.colorbar(sc, label="Average Risk Score")
ax.set_title("Risk Heatmap on Road Segments", fontsize=14, fontweight="bold")
ax.set_xlabel("Longitude", fontsize=12)
ax.set_ylabel("Latitude", fontsize=12)
plt.grid(True, linestyle="--", alpha=0.5)
plt.show()
