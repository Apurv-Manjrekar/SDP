import pandas as pd

# ------------------ Data Loading ------------------

def load_data(file_path):
    """Loads the SUMO CSV data into a DataFrame."""
    return pd.read_csv(file_path)

# ------------------ Feature Detection Functions ------------------

def detect_speeding(df):
    """
    Detects speeding violations where the vehicle's speed exceeds the posted speed limit.
    Adds a boolean flag and counts the number of violations per vehicle.
    """
    df['SpeedingViolationFlag'] = df['Speed'] > df['Speed_Limit']
    return df.groupby('Vehicle_ID').agg(SpeedingViolations=('SpeedingViolationFlag', 'sum')).reset_index()

def detect_fast_acceleration(df, threshold=3.0):
    """
    Detects instances where vehicle acceleration exceeds a specified threshold (default 3.0 m/s^2).
    """
    df['FastAccelerationFlag'] = df['Acceleration'] > threshold
    return df.groupby('Vehicle_ID').agg(FastAccelerations=('FastAccelerationFlag', 'sum')).reset_index()

def detect_hard_braking(df, threshold=-3.0):
    """
    Detects hard braking events where deceleration exceeds a negative threshold (default -3.0 m/s^2).
    """
    df['HardBrakingFlag'] = df['Acceleration'] < threshold
    return df.groupby('Vehicle_ID').agg(HardBrakings=('HardBrakingFlag', 'sum')).reset_index()

def detect_lane_changes(df):
    """
    Detects the number of lane changes by retrieving the maximum lane change value per vehicle.
    Assumes 'Lane_Change' column represents a count or binary flag.
    """
    return df.groupby('Vehicle_ID').agg(LaneChanges=('Lane_Change', 'max')).reset_index()

def detect_headway_violations(df, threshold=2.0):
    """
    Flags time gaps below a safety threshold (default 2.0 seconds) as unsafe headways.
    """
    df['UnsafeHeadwayFlag'] = df['Time_Gap'] < threshold
    return df.groupby('Vehicle_ID').agg(UnsafeHeadways=('UnsafeHeadwayFlag', 'sum')).reset_index()

def detect_unsafe_time_gap(df, threshold=1.5):
    """
    Detects critically unsafe following time gaps (default < 1.5 seconds).
    """
    df['UnsafeTimeGapFlag'] = df['Time_Gap'] < threshold
    return df.groupby('Vehicle_ID').agg(UnsafeTimeGaps=('UnsafeTimeGapFlag', 'sum')).reset_index()

def detect_collisions(df):
    """
    Counts the number of collision events recorded for each vehicle.
    Assumes 'Collision' column is a binary flag indicating whether a collision occurred.
    """
    return df.groupby('Vehicle_ID').agg(Collisions=('Collision', 'sum')).reset_index()

# ------------------ Main Processing Function ------------------

def process_sumo_data(file_path):
    """
    Main function to load SUMO driving data and compute various aggressive driving metrics.
    Returns a DataFrame where each row summarizes a vehicle’s behavior.
    """
    # Load raw SUMO CSV data
    df = load_data(file_path)
    
    # Precompute behavior flags
    df['SpeedingViolation'] = df['Speed'] > df['Speed_Limit']
    df['FastAcceleration'] = df['Acceleration'] > 3.0
    df['HardBraking'] = df['Acceleration'] < -3.0
    df['LaneChangeFrequency'] = df['Lane_Change'].astype(int)
    df['UnsafeHeadway'] = df['Time_Gap'] < 2.0
    df['UnsafeTimeGap'] = df['Time_Gap'] < 1.5

    # Count how many data points exist for each vehicle (for context)
    instance_counts = df.groupby("Vehicle_ID").size().reset_index(name="Instance_Count")
    
    # Generate and merge all behavioral feature summaries
    agg_df = detect_speeding(df)
    agg_df = agg_df.merge(detect_fast_acceleration(df), on='Vehicle_ID', how='left')
    agg_df = agg_df.merge(detect_hard_braking(df), on='Vehicle_ID', how='left')
    agg_df = agg_df.merge(detect_lane_changes(df), on='Vehicle_ID', how='left')
    agg_df = agg_df.merge(detect_headway_violations(df), on='Vehicle_ID', how='left')
    agg_df = agg_df.merge(detect_unsafe_time_gap(df), on='Vehicle_ID', how='left')
    agg_df = agg_df.merge(detect_collisions(df), on='Vehicle_ID', how='left')
    agg_df = agg_df.merge(instance_counts, on="Vehicle_ID", how="left")

    # Uncomment below to save results to CSV
    # agg_df.to_csv(output_path, index=False)
    # print(f"Processed data saved to {output_path}")

    return agg_df

# Example usage (can be uncommented to run as a script)
# if __name__ == "__main__":
#     input_file = "/Users/saimanish/SeniorDesign/SDP/prototype/backend/SUMO/results/vehicle_data.csv"
#     output_file = "/Users/saimanish/SeniorDesign/SDP/prototype/backend/Data Processing/processed_sumo_features.csv"
#     process_sumo_data(input_file, output_file)
