import xml.etree.ElementTree as ET
import gzip
from pyproj import Proj, Transformer
import os
import xml.etree.ElementTree as ET
import traci
import pandas as pd

def extract_network_info(net_file, is_gz=True):
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

    proj_params = location.get("projParameter")
    net_offset = location.get("netOffset")
    offset_x, offset_y = map(float, net_offset.split(','))
    orig_boundary = location.get("origBoundary")
    min_lon, min_lat, max_lon, max_lat = map(float, orig_boundary.split(','))
    
    return offset_x, offset_y, min_lon, min_lat, max_lon, max_lat

def sumo_to_latlon(x, y, net_offset_x, net_offset_y, min_lon, min_lat, max_lon, max_lat):
    abs_x = x + net_offset_x
    abs_y = y + net_offset_y
    
    lon_range = max_lon - min_lon
    lat_range = max_lat - min_lat
    
    lon = min_lon + (abs_x / net_offset_x) * lon_range
    lat = min_lat + (abs_y / net_offset_y) * lat_range
    
    return lat, lon

def simulate_and_extract_metrics():
    columns = [
        'Time', 'Vehicle_ID', 'Speed', 'Acceleration', 'Latitude', 'Longitude', 'Lane', 
        # 'Headway_Distance', 'Time_Gap', 'Red_Light_Violation', 'Speeding_Violation', 'Lane_Change'
    ]
    
    vehicle_data = pd.DataFrame(columns=columns)

    net_offset_x, net_offset_y, min_lon, min_lat, max_lon, max_lat = extract_network_info(net_path)

    sumoBinary = "sumo" #sumo-gui for GUI
    traci.start([sumoBinary, "-c", "osm.sumocfg", "--start", "--delay", "1000"])

    SIMULATION_TIME = 10

    # while traci.simulation.getMinExpectedNumber() > 0: # until all vehicles have left the network
    for step in range(SIMULATION_TIME): # run for SIMULATION_TIME seconds
        traci.simulationStep()
        print(f"Time: {step}")

        data_rows = []

        current_time = traci.simulation.getTime()
        vehicle_ids = traci.vehicle.getIDList()
        for vehicle_id in vehicle_ids:
            speed = traci.vehicle.getSpeed(vehicle_id)
            acceleration = traci.vehicle.getAcceleration(vehicle_id)

            position = traci.vehicle.getPosition(vehicle_id)
            x, y = position
            lat, lon = sumo_to_latlon(x, y, net_offset_x, net_offset_y, min_lon, min_lat, max_lon, max_lat)

            lane_id = traci.vehicle.getLaneID(vehicle_id)

            speed_limit = traci.lane.getMaxSpeed(lane_id)
            if speed > speed_limit:
                speeding_violation = True
            else:
                speeding_violation = False
            
            leader_info = traci.vehicle.getLeader(vehicle_id)
            if leader_info is not None:
                leader_vehicle_id, headway_distance = leader_info
                if speed > 0:
                    time_gap = headway_distance / speed
                else:
                    time_gap = float('inf')
            else:
                leader_vehicle_id = None
                headway_distance = float('inf')
                time_gap = float('inf')

            # red_light_violation = check_red_light_violation(vehicle_id)

            # lane_change = check_lane_change(vehicle_id)

            vehicle_metrics = {
                'Time': current_time,
                'Vehicle_ID': vehicle_id,
                'Speed': speed,
                'Speed_Limit': speed_limit,
                'Speeding_Violation': speeding_violation,
                'Acceleration': acceleration,
                'Latitude': lat,
                'Longitude': lon,
                'Lane': lane_id,
                'Time_Gap': time_gap,
                'Headway_Distance': headway_distance
            }

            data_rows.append(vehicle_metrics)

        vehicle_data = pd.concat([vehicle_data, pd.DataFrame(data_rows)], ignore_index=True)

    vehicle_data.to_csv("vehicle_metrics.csv", index=False)

    traci.close()

    print(vehicle_data.head())
    
    speeding_data = vehicle_data[vehicle_data['Speeding_Violation'] == True]

    print(speeding_data.head())

    return vehicle_data

import shutil

def decompress_gz(input_gz_file):
    output_xml_file = input_gz_file.replace('.gz', '')  # Remove .gz from filename
    with gzip.open(input_gz_file, 'rb') as f_in:
        with open(output_xml_file, 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
    print(f"Decompressed: {output_xml_file}")
    return output_xml_file

if __name__ == "__main__":
    dir_path = os.path.dirname(os.path.realpath(__file__))

    fcd_file = "fcd_output.xml"
    collision_file = "collision_output.xml"
    lanechange_file = "lanechange_output.xml"
    net_file = "osm.net.xml.gz"

    fcd_path = os.path.join(dir_path, fcd_file)
    collision_path = os.path.join(dir_path, collision_file)
    lanechange_path = os.path.join(dir_path, lanechange_file)
    net_path = os.path.join(dir_path, net_file)

    # vehicle_data = simulate_and_extract_metrics()

    decompressed_file = decompress_gz("osm.net.xml.gz")  # Automatically saves as "osm.net.xml"
