import xml.etree.ElementTree as ET
import gzip
import os
import traci
import pandas as pd
import math
import shutil


### ------------------------------ FILE MANAGEMENT ------------------------------ ###
def decompress_gz(input_gz_file):
    """
    Decompresses a gzip file and returns the path to the decompressed file.
    """
    output_xml_file = input_gz_file.replace('.gz', '')  # Remove .gz from filename
    with gzip.open(input_gz_file, 'rb') as f_in:
        with open(output_xml_file, 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
    print(f"Decompressed: {output_xml_file}")
    return output_xml_file


def extract_network_info(net_file, is_gz=True):
    """
    Extracts network offsets and projection from a SUMO network file.
    """
    if is_gz:
        with gzip.open(net_file, 'rt', encoding='utf-8') as f:
            tree = ET.parse(f)
            root = tree.getroot()
    else:
        tree = ET.parse(net_file)
        root = tree.getroot()

    location = root.find("location")
    if location is None:
        raise ValueError("No <location> tag found in the network file.")

    net_offset_x, net_offset_y = map(float, location.get("netOffset").split(','))
    min_lon, min_lat, max_lon, max_lat = map(float, location.get("origBoundary").split(','))
    
    return net_offset_x, net_offset_y, min_lon, min_lat, max_lon, max_lat


def sumo_to_latlon(x, y, net_offset_x, net_offset_y, min_lon, min_lat, max_lon, max_lat):
    """
    Converts SUMO coordinates to real-world latitude and longitude.
    """
    abs_x = x + net_offset_x
    abs_y = y + net_offset_y
    
    lon_range = max_lon - min_lon
    lat_range = max_lat - min_lat
    
    lon = min_lon + (abs_x / net_offset_x) * lon_range
    lat = min_lat + (abs_y / net_offset_y) * lat_range
    
    return lat, lon


### ------------------------------ METRIC EXTRACTION ------------------------------ ###
def extract_lane_change_data(lane_change_file):
    """
    Extracts lane change data from a SUMO lane change output file.
    """
    tree = ET.parse(lane_change_file)
    root = tree.getroot()

    lane_changes = []
    for lane_change in root.findall("change"):
        time = float(lane_change.get("time"))
        vehicle_id = lane_change.get("id")
        from_lane = lane_change.get("from")
        to_lane = lane_change.get("to")
        reason = lane_change.get("reason", "unknown")

        lane_changes.append({
            'Time': time,
            'Vehicle_ID': vehicle_id,
            'Lane_Change': True,
            'From_Lane': from_lane,
            'To_Lane': to_lane,
            'Lane_Change_Reason': reason
        })

    return pd.DataFrame(lane_changes)


def extract_collision_data(collision_file):
    """
    Extracts collision data from a SUMO collision output file.
    """
    tree = ET.parse(collision_file)
    root = tree.getroot()

    collisions = []
    for collision in root.findall("collision"):
        time = float(collision.get("time"))
        vehicle_1 = collision.get("vehicle1")
        vehicle_2 = collision.get("vehicle2")

        collisions.append({'Time': time, 'Vehicle_ID': vehicle_1, 'Collision': True})
        collisions.append({'Time': time, 'Vehicle_ID': vehicle_2, 'Collision': True})

    return pd.DataFrame(collisions)


### ------------------------------ SIMULATION ------------------------------ ###
def simulate_and_extract_metrics(sumo_cfg, net_path, simulation_time=100, vehicles=None):
    """
    Runs the SUMO simulation and extracts vehicle metrics.
    """
    net_offset_x, net_offset_y, min_lon, min_lat, max_lon, max_lat = extract_network_info(net_path)

    traci.start(["sumo", "-c", sumo_cfg, "--start", "--delay", "0", "--threads", "16",
                "--device.rerouting.probability", "0", "--device.emissions.probability", "0", 
                "--no-internal-links", "1", "--ignore-junction-blocker", "5",
                "--collision.mingap-factor", "0", "--collision.action", "remove", "--collision.check-junctions", "0",
                "--step-method.ballistic", "1",
                "--sloppy-insert", "1", "--eager-insert", "0", "--emergency-insert", "1",
                "--time-to-teleport", "60", "--time-to-teleport.highways", "30",
                "--route-steps", "500",
                "--default.action-step-length", "1", "--lateral-resolution", "1",
                "--ignore-route-errors", "--no-warnings", "--no-step-log"
                ]) # python SUMO

    data_rows = []

    vehicles_remaining = set(vehicles)
    vehicles_in_progress = set()

    # while traci.simulation.getMinExpectedNumber() > 0: # until all vehicles have left the network
    for step in range(simulation_time): # run for SIMULATION_TIME seconds
        traci.simulationStep()
        current_time = float(traci.simulation.getTime())
        print(f"Time: {current_time}")
        vehicle_ids = traci.vehicle.getIDList()

        if vehicles != None:
            vehicle_ids = [v for v in vehicle_ids if v in vehicles_remaining]

        for vehicle_id in vehicle_ids:
            speed = traci.vehicle.getSpeed(vehicle_id)
            acceleration = traci.vehicle.getAcceleration(vehicle_id)
            x, y = traci.vehicle.getPosition(vehicle_id)
            lat, lon = sumo_to_latlon(x, y, net_offset_x, net_offset_y, min_lon, min_lat, max_lon, max_lat)
            lane_id = traci.vehicle.getLaneID(vehicle_id)
            speed_limit = traci.lane.getMaxSpeed(lane_id)
            
            leader_info = traci.vehicle.getLeader(vehicle_id)
            if leader_info:
                _, headway_distance = leader_info
                time_gap = headway_distance / speed if speed > 0 else None
            else:
                headway_distance, time_gap = None, None

            data_rows.append({
                'Time': current_time,
                'Vehicle_ID': vehicle_id,
                'Speed': speed,
                'Acceleration': acceleration,
                'Latitude': lat,
                'Longitude': lon,
                'Lane': lane_id,
                'Headway_Distance': headway_distance,
                'Time_Gap': time_gap,
                'Speed_Limit': speed_limit
            })
        
        if vehicles != None:
            for vehicle_id in vehicles_in_progress.copy():
                if vehicle_id not in vehicle_ids:
                    vehicles_remaining.discard(vehicle_id)
                    vehicles_in_progress.discard(vehicle_id)
                    print(f"Vehicle {vehicle_id} has left the network.")

            for vehicle_id in vehicles_remaining.copy():
                if vehicle_id not in vehicles_in_progress and vehicle_id in vehicle_ids:
                    vehicles_in_progress.add(vehicle_id)
                    print(f"Vehicle {vehicle_id} has entered the network.")
            
            if len(vehicles_remaining) == 0:
                print("All vehicles have left the network.")
                break

    traci.close() # not needed for libsumo
    
    return pd.DataFrame(data_rows)


### ------------------------------ DATA MERGING ------------------------------ ###
def merge_additional_data(vehicle_data, lane_change_file, collision_file):
    """
    Merges lane change and collision data with real-time vehicle data.
    """
    lane_change_data = extract_lane_change_data(lane_change_file)
    if lane_change_data.empty:
        print("No lane change data found!")
        merged_data = vehicle_data
        merged_data['Lane_Change'] = False
        merged_data['Lane_Change_Reason'] = 'None'
        merged_data['From_Lane'] = 'None'
        merged_data['To_Lane'] = 'None'
    else:
        merged_data = pd.merge(vehicle_data, lane_change_data, how='left', on=['Time', 'Vehicle_ID'])
        merged_data['Lane_Change_Reason'] = merged_data['Lane_Change_Reason'].fillna('None')
        merged_data['Lane_Change'] = merged_data['From_Lane'].notna()
        merged_data['From_Lane'] = merged_data['From_Lane'].fillna('None')
        merged_data['To_Lane'] = merged_data['To_Lane'].fillna('None')
    
    collision_data = extract_collision_data(collision_file)
    if collision_data.empty:
        print("No collision data found!")
        merged_data['Collision'] = False
    else:
        merged_data = pd.merge(merged_data, collision_data, how='left', on=['Time', 'Vehicle_ID'])
        merged_data['Collision'] = merged_data['Collision'].fillna(False)
    
    return merged_data


### ------------------------------ MAIN ------------------------------ ###
if __name__ == "__main__":
    curr_dir_path = os.path.dirname(os.path.realpath(__file__))
    # ./../configs/
    MAP = "medium_map"
    configs_dir_path = os.path.join(curr_dir_path, "..", "configs", MAP)
    results_dir_path = os.path.join(curr_dir_path, "..", "results")

    sumocfg_file = "osm.sumocfg"
    net_file = "osm.net.xml.gz"
    lanechange_file = "lanechange_output.xml"
    collision_file = "collision_output.xml"

    sumocfg_path = os.path.join(configs_dir_path, sumocfg_file)
    net_path = os.path.join(configs_dir_path, net_file)
    lanechange_path = os.path.join(results_dir_path, lanechange_file)
    collision_path = os.path.join(results_dir_path, collision_file)

    vehicle_data = simulate_and_extract_metrics(sumocfg_path, net_path, simulation_time=1800, vehicles=['veh0'])

    vehicle_data = merge_additional_data(vehicle_data, lanechange_path, collision_path)

    speeding_data = vehicle_data[vehicle_data['Speed'] > vehicle_data['Speed_Limit']]
    speeding_data.head()

    vehicle_data.to_csv(results_dir_path + "/vehicle_data.csv", index=False)
    print("Vehicle data saved to vehicle_data.csv!")
    print(vehicle_data.head())