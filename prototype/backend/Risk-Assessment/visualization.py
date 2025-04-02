import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import contextily as ctx
import os
import argparse
import folium
from folium.plugins import HeatMap

# file_path = "vehicle_data./csv"
# df = pd.read_csv(file_path)

def visualize_risk(file_path):
    print("Generating Risk Heatmap...")
    df = pd.read_csv(file_path)
    if "dp_" in file_path:
        df = pd.read_csv(file_path)
        # risk_scores_df = pd.read_csv(file_path.replace(".csv", "_risk_scores.csv"))
        location_df = pd.read_csv(file_path.replace("dp_", ""))
        # df = df.merge(risk_scores_df, on="Vehicle_ID")
        df["Latitude"] = location_df["Latitude"]
        df["Longitude"] = location_df["Longitude"]
        del location_df
        # del risk_scores_df
    # risk_scores_df = pd.read_csv(file_path.replace(".csv", "_risk_scores.csv"))
    # df = df.merge(risk_scores_df, on="Vehicle_ID")

    print("Sampling Data...")
    veh_ids = df[df['Vehicle_ID'].str.startswith('veh')]['Vehicle_ID'].drop_duplicates().sample(n=800, random_state=42)
    motorcycle_ids = df[df['Vehicle_ID'].str.startswith('motorcycle')]['Vehicle_ID'].drop_duplicates().sample(n=40, random_state=42)
    truck_ids = df[df['Vehicle_ID'].str.startswith('truck')]['Vehicle_ID'].drop_duplicates().sample(n=120, random_state=42)
    df = df[df['Vehicle_ID'].isin(veh_ids) | df['Vehicle_ID'].isin(motorcycle_ids) | df['Vehicle_ID'].isin(truck_ids)]

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
    del df

    road_risk_scores.rename(columns={"Risk_Score": "Avg_Risk_Score"}, inplace=True)
    road_risk_scores["Latitude"] = pd.to_numeric(road_risk_scores["Latitude"], errors="coerce")
    road_risk_scores["Longitude"] = pd.to_numeric(road_risk_scores["Longitude"], errors="coerce")
    road_risk_scores["Avg_Risk_Score"] = pd.to_numeric(road_risk_scores["Avg_Risk_Score"], errors="coerce")
    

    # scaler = MinMaxScaler(feature_range=(0, 1))
    # road_risk_scores["Normalized_Risk_Score"] = scaler.fit_transform(road_risk_scores[["Avg_Risk_Score"]])


    print("Plotting Heatmap...")
    map_center = [road_risk_scores["Latitude"].mean(), road_risk_scores["Longitude"].mean()]
    risk_map = folium.Map(location=map_center, zoom_start=12)
    heatmap_data = []

    for index, row in road_risk_scores.iterrows():
        print(f"Processing row: {index} of {len(road_risk_scores)}")
        heatmap_data.append([row["Latitude"], row["Longitude"], row["Avg_Risk_Score"]])

    HeatMap(heatmap_data, min_opacity=0.2, radius=15, blur=10).add_to(risk_map)

    risk_map.save(f"{os.path.basename(file_path.replace('.csv', ''))}_risk_heatmap_.html")

    print(f"Min Risk Score: {road_risk_scores['Avg_Risk_Score'].min()}, Max Risk Score: {road_risk_scores['Avg_Risk_Score'].max()}, Avg Risk Score: {road_risk_scores['Avg_Risk_Score'].mean()}")
    print(f"Min Latitude : {road_risk_scores['Latitude'].min()}, Max Latitude: {road_risk_scores['Latitude'].max()}, Avg Latitude: {road_risk_scores['Latitude'].mean()}")
    print(f"Min Longitude: {road_risk_scores['Longitude'].min()}, Max Longitude: {road_risk_scores['Longitude'].max()}, Avg Longitude: {road_risk_scores['Longitude'].mean()}")

    print("Risk Heatmap saved as risk_heatmap.html")

    # fig, ax = plt.subplots(figsize=(10, 6))

    # sc = ax.scatter(
    #     road_risk_scores["Longitude"], road_risk_scores["Latitude"], 
    #     c=road_risk_scores["Avg_Risk_Score"], cmap="YlOrRd", 
    #     s=road_risk_scores["Avg_Risk_Score"] * 20, 
    #     edgecolor="black", alpha=0.7
    # )

    # ctx.add_basemap(ax, crs="EPSG:4326", source=ctx.providers.OpenStreetMap.Mapnik)

    # plt.colorbar(sc, label="Average Risk Score")
    # ax.set_title("Risk Heatmap on Road Segments", fontsize=14, fontweight="bold")
    # ax.set_xlabel("Longitude", fontsize=12)
    # ax.set_ylabel("Latitude", fontsize=12)
    # plt.grid(True, linestyle="--", alpha=0.5)
    # plt.show()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Live Map")
    parser.add_argument("--dataset",  type=str, required=True, help="Full path of dataset file (e.g., /path/to/vehicle_data.csv)")
    args = parser.parse_args()
    dataset_path = args.dataset

    if not os.path.exists(dataset_path):
        print(f"File not found: {dataset_path}")
        exit(1)

    visualize_risk(dataset_path)