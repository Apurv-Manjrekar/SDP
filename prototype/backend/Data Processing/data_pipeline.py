import pandas as pd

#Remove headway and time gap values to be less 

def load_data(file_path):
    """Loads the SUMO CSV data into a DataFrame."""
    return pd.read_csv(file_path)

def detect_speeding(df):
    """Detects speeding violations where speed exceeds the speed limit."""
    df['SpeedingViolationFlag'] = df['Speed'] > df['Speed_Limit']
    return df.groupby('Vehicle_ID').agg(SpeedingViolations=('SpeedingViolationFlag', 'sum'))

def detect_fast_acceleration(df, threshold=3.0):
    """Detects instances of fast acceleration exceeding a given threshold."""
    df['FastAccelerationFlag'] = df['Acceleration'] > threshold
    return df.groupby('Vehicle_ID').agg(FastAccelerations=('FastAccelerationFlag', 'sum'))

def detect_hard_braking(df, threshold=-3.0):
    """Detects instances of hard braking (sudden deceleration)."""
    df['HardBrakingFlag'] = df['Acceleration'] < threshold
    return df.groupby('Vehicle_ID').agg(HardBrakings=('HardBrakingFlag', 'sum'))

def detect_lane_changes(df):
    """Detects lane changes by checking lane change frequency."""
    return df.groupby('Vehicle_ID').agg(LaneChanges=('Lane_Change', 'max'))

def detect_headway_violations(df, threshold=2.0):
    """Detects vehicles with dangerously low headway time gap."""
    df['UnsafeHeadwayFlag'] = df['Time_Gap'] < threshold
    return df.groupby('Vehicle_ID').agg(UnsafeHeadways=('UnsafeHeadwayFlag', 'sum'))

def detect_unsafe_time_gap(df, threshold=1.5):
    """Detects instances of unsafe time gaps."""
    df['UnsafeTimeGapFlag'] = df['Time_Gap'] < threshold
    return df.groupby('Vehicle_ID').agg(UnsafeTimeGaps=('UnsafeTimeGapFlag', 'sum'))

def detect_collisions(df):
    """Counts the number of collisions per vehicle."""
    return df.groupby('Vehicle_ID').agg(Collisions=('Collision', 'sum'))

def process_sumo_data(file_path, output_path):
    """Processes SUMO CSV data to extract aggressive driving features."""
    df = load_data(file_path)
    
    df['SpeedingViolation'] = df['Speed'] > df['Speed_Limit']
    df['FastAcceleration'] = df['Acceleration'] > 3.0
    df['HardBraking'] = df['Acceleration'] < -3.0
    df['LaneChangeFrequency'] = df['Lane_Change'].astype(int)
    df['UnsafeHeadway'] = df['Time_Gap'] < 2.0
    df['UnsafeTimeGap'] = df['Time_Gap'] < 1.5
    
    # Aggregate all features
    agg_df = detect_speeding(df)
    agg_df = agg_df.merge(detect_fast_acceleration(df), on='Vehicle_ID')
    agg_df = agg_df.merge(detect_hard_braking(df), on='Vehicle_ID')
    agg_df = agg_df.merge(detect_lane_changes(df), on='Vehicle_ID')
    agg_df = agg_df.merge(detect_headway_violations(df), on='Vehicle_ID')
    agg_df = agg_df.merge(detect_unsafe_time_gap(df), on='Vehicle_ID')
    agg_df = agg_df.merge(detect_collisions(df), on='Vehicle_ID')
    
    agg_df.to_csv(output_path, index=False)
    print(f"Processed data saved to {output_path}")
    return agg_df

# Example usage
if __name__ == "__main__":
    input_file = "/Users/saimanish/SeniorDesign/SDP/prototype/backend/SUMO/results/vehicle_data.csv"  # Actual File
    output_file = "/Users/saimanish/SeniorDesign/SDP/prototype/backend/Data Processing/processed_sumo_features.csv"
    process_sumo_data(input_file, output_file)