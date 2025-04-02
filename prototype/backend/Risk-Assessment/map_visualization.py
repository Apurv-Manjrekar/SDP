import pandas as pd
import folium
from folium.plugins import HeatMap
import os
import argparse

# Update File path to CSV
# file_path = "updated_risk_scores.csv"

# df = pd.read_csv(file_path)
# print(f"Total Data Points: {len(df)}")
# print(f"Unique Vehicles: {df['Vehicle_ID'].nunique()}")


def generate_live_map(file_path):
    print("Generating Live Map...")
    print(f"Reading CSV: {file_path}")
    file_name = os.path.basename(file_path)
    if "dp_" in file_name:
        df = pd.read_csv(file_path)
        risk_scores_df = pd.read_csv(file_path.replace(".csv", "_risk_scores.csv"))
        location_df = pd.read_csv(file_path.replace("dp_", ""))
        df = df.merge(risk_scores_df, on="Vehicle_ID")
        df["Latitude"] = location_df["Latitude"]
        df["Longitude"] = location_df["Longitude"]
        del location_df
        del risk_scores_df
    else:
        df = pd.read_csv(file_path)
        risk_scores_df = pd.read_csv(file_path.replace(".csv", "_risk_scores.csv"))
        df = df.merge(risk_scores_df, on="Vehicle_ID")
        del risk_scores_df
    
    print("Validating CSV...")
    required_columns = {"Vehicle_ID", "Latitude", "Longitude", "Time", "Risk_Score"}
    if not required_columns.issubset(df.columns):
        print(f"Missing columns in CSV: {required_columns - set(df.columns)}")
        return

    df = df[["Vehicle_ID", "Latitude", "Longitude", "Time", "Risk_Score"]]

    print("Sampling Data...")
    # veh_ids = df[df['Vehicle_ID'].str.startswith('veh')]['Vehicle_ID'].drop_duplicates().sample(n=800, random_state=42)
    # motorcycle_ids = df[df['Vehicle_ID'].str.startswith('motorcycle')]['Vehicle_ID'].drop_duplicates().sample(n=40, random_state=42)
    # truck_ids = df[df['Vehicle_ID'].str.startswith('truck')]['Vehicle_ID'].drop_duplicates().sample(n=120, random_state=42)
    # df = df[df['Vehicle_ID'].isin(veh_ids) | df['Vehicle_ID'].isin(motorcycle_ids) | df['Vehicle_ID'].isin(truck_ids)]

    

    df["Time"] = pd.to_datetime(df["Time"], errors="coerce")
    df["Latitude"] = pd.to_numeric(df["Latitude"], errors="coerce")
    df["Longitude"] = pd.to_numeric(df["Longitude"], errors="coerce")
    df["Risk_Score"] = pd.to_numeric(df["Risk_Score"], errors="coerce")
    
    df = df.dropna(subset=["Time", "Latitude", "Longitude", "Risk_Score"])
    
    if df.empty:
        print("No valid data available!")
        return

    map_center = [df["Latitude"].mean(), df["Longitude"].mean()]
    risk_map = folium.Map(location=map_center, zoom_start=12)
    heatmap_data = []

    print("Generating Heatmap...")

    for vehicle_id, trip in df.groupby("Vehicle_ID"):
        print(f"Processing vehicle {vehicle_id}")
        trip = trip.sort_values("Time")

        if len(trip) < 2:
            print(f"⚠️ Vehicle {vehicle_id} has insufficient data points.")
            continue

        trip_coords = list(zip(trip["Latitude"], trip["Longitude"], trip["Risk_Score"]))
        heatmap_data.extend(trip_coords)
    HeatMap(heatmap_data, radius=15, blur=10, min_opacity=0.2).add_to(risk_map)

    print("Saving Heatmap...")
    risk_map.save(f"vehicle_heatmap_{file_name.replace('.csv', '')}.html")
        # avg_risk = trip["Risk_Score"].mean()
        
        # if avg_risk < 1:
        #     trip_color = "green"
        # elif avg_risk < 2:
        #     trip_color = "orange"
        # else:
        #     trip_color = "red"

        # folium.PolyLine(
        #     locations=trip_coords,
        #     color=trip_color,
        #     weight=4,
        #     opacity=0.7,
        #     popup=f"Vehicle {vehicle_id} | Avg Risk: {avg_risk:.2f}"
        # ).add_to(risk_map)

        # for _, row in trip.iterrows():
        #     # print(f"Adding point: {row['Latitude']}, {row['Longitude']} - Risk: {row['Risk_Score']}")
        #     risk_color = "green" if row["Risk_Score"] < 2 else "orange" if row["Risk_Score"] < 4 else "red"
        #     folium.CircleMarker(
        #         location=[row["Latitude"], row["Longitude"]],
        #         radius=5,
        #         color=risk_color,
        #         fill=True,
        #         fill_color=risk_color,
        #         fill_opacity=0.8,
        #         popup=f"⏱ {row['Time']}\n Speed: {row['Speed']} mph\n⚠️ Risk Score: {row['Risk_Score']}"
        #     ).add_to(risk_map)

    # print("Saving Live Map...")
    # risk_map.save("live_vehicle_map.html")
    # print("Live Map Updated! Open 'live_vehicle_map.html' in a browser.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Live Map")
    parser.add_argument("--dataset",  type=str, required=True, help="Full path of dataset file (e.g., /path/to/vehicle_data.csv)")
    args = parser.parse_args()
    dataset_path = args.dataset

    if not os.path.exists(dataset_path):
        print(f"File not found: {dataset_path}")
        exit(1)

    generate_live_map(dataset_path)
    print(f"Live Map Updated! Open 'vehicle_heatmap_{os.path.basename(dataset_path)}.html' in a browser.")

