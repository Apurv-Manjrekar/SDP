import pandas as pd
import folium
from folium.plugins import HeatMap

# Update File path to CSV
file_path = "updated_risk_scores.csv"

df = pd.read_csv(file_path)
# print(f"Total Data Points: {len(df)}")
# print(f"Unique Vehicles: {df['Vehicle_ID'].nunique()}")


def generate_live_map():
    df = pd.read_csv(file_path)
    
    required_columns = {"Vehicle_ID", "Latitude", "Longitude", "Time", "Risk_Score", "Speed"}
    if not required_columns.issubset(df.columns):
        print(f"Missing columns in CSV: {required_columns - set(df.columns)}")
        return

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

    for vehicle_id, trip in df.groupby("Vehicle_ID"):
        trip = trip.sort_values("Time")

        if len(trip) < 2:
            print(f"⚠️ Vehicle {vehicle_id} has insufficient data points.")
            continue

        trip_coords = list(zip(trip["Latitude"], trip["Longitude"]))
        avg_risk = trip["Risk_Score"].mean()
        
        if avg_risk < 2:
            trip_color = "green"
        elif avg_risk < 4:
            trip_color = "orange"
        else:
            trip_color = "red"

        folium.PolyLine(
            locations=trip_coords,
            color=trip_color,
            weight=4,
            opacity=0.7,
            popup=f"Vehicle {vehicle_id} | Avg Risk: {avg_risk:.2f}"
        ).add_to(risk_map)

        for _, row in trip.iterrows():
            # print(f"Adding point: {row['Latitude']}, {row['Longitude']} - Risk: {row['Risk_Score']}")
            risk_color = "green" if row["Risk_Score"] < 2 else "orange" if row["Risk_Score"] < 4 else "red"
            folium.CircleMarker(
                location=[row["Latitude"], row["Longitude"]],
                radius=5,
                color=risk_color,
                fill=True,
                fill_color=risk_color,
                fill_opacity=0.8,
                popup=f"⏱ {row['Time']}\n Speed: {row['Speed']} mph\n⚠️ Risk Score: {row['Risk_Score']}"
            ).add_to(risk_map)

    risk_map.save("live_vehicle_map.html")
    print("Live Map Updated! Open 'live_vehicle_map.html' in a browser.")

generate_live_map()