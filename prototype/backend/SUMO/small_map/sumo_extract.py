import xml.etree.ElementTree as ET
import gzip
from pyproj import Proj, Transformer
import os
import xml.etree.ElementTree as ET
import traci
import pandas as pd
import math

import shutil

def decompress_gz(input_gz_file):
    output_xml_file = input_gz_file.replace('.gz', '')  # Remove .gz from filename
    with gzip.open(input_gz_file, 'rb') as f_in:
        with open(output_xml_file, 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
    print(f"Decompressed: {output_xml_file}")
    return output_xml_file

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

def is_red_light_violation(vehicle_id, prev_positions):
    # Get the edge (road) the vehicle is on
    edge_id = traci.vehicle.getRoadID(vehicle_id)

    speed = traci.vehicle.getSpeed(vehicle_id)

    for tls_id in traci.trafficlight.getIDList():
        controlled_lanes = traci.trafficlight.getControlledLanes(tls_id)

        # Check if this traffic light controls the vehicle's current road
        relevant_lanes = [lane for lane in controlled_lanes if edge_id in lane]
        if not relevant_lanes:
            continue
        
        light_state = traci.trafficlight.getRedYellowGreenState(tls_id)

        for lane in relevant_lanes:
            lane_index = controlled_lanes.index(lane)
            if light_state[lane_index] == 'r':
                stop_line_position = traci.lane.getShape(lane)[0]
                veh_x, veh_y = traci.vehicle.getPosition(vehicle_id)

                if vehicle_id in prev_positions:
                    prev_x, prev_y = prev_positions[vehicle_id]
                    crossed_stop_line =  (prev_x < stop_line_position[0] and veh_x > stop_line_position[0]) or \
                                        (prev_x > stop_line_position[0] and veh_x < stop_line_position[0])
                    
                    if crossed_stop_line and speed > 0:
                        print(f"🚨 Vehicle {vehicle_id} violated a red light at {tls_id}!")
                        return True
                
                prev_positions[vehicle_id] = (veh_x, veh_y)
    return False


            # # Determine lane index
            # lane_index = [i for i, lane in enumerate(controlled_lanes) if edge_id in lane]
            # if not lane_index:
            #     return False  # Vehicle is not at this intersection
            
            # lane_index = lane_index[0]

            # # If the light is red for this lane, check position and direction
            # if light_state[lane_index] == 'r':
            #     # Get vehicle position
            #     veh_x, veh_y = traci.vehicle.getPosition(vehicle_id)

            #     # Get the stop line position from the first point of the controlled lane
            #     stop_line_lane = controlled_lanes[0]
            #     stop_line_position = traci.lane.getShape(stop_line_lane)[0]
            #     junction_x, junction_y = stop_line_position

            #     # Get the vehicle's heading direction
            #     angle = traci.vehicle.getAngle(vehicle_id)  # Angle in degrees
                
            #     # Convert angle to a unit vector (dx, dy)
            #     angle_rad = math.radians(angle)
            #     dx = math.cos(angle_rad)
            #     dy = math.sin(angle_rad)

            #     # Compute dot product to determine movement direction
            #     direction_to_light = (junction_x - veh_x, junction_y - veh_y)
            #     dot_product = dx * direction_to_light[0] + dy * direction_to_light[1]

            #     # If the dot product is positive, the vehicle is moving **toward** the stop line
            #     if dot_product > 0:
            #         print(f"🚨 Vehicle {vehicle_id} violated a red light at {tls_id}!")
            #         return True
    # return False

def extract_lane_change_data(lane_change_file):
    tree = ET.parse(lane_change_file)
    root = tree.getroot()

    lane_changes = []
    for lane_change in root.findall("laneChange"):
        time = float(lane_change.get("time"))
        vehicle_id = lane_change.get("id")
        from_lane = lane_change.get("from")
        to_lane = lane_change.get("to")
        reason = lane_change.get("reason", "unknown")

        lane_changes.append({
            'Time': time,
            'Vehicle_ID': vehicle_id,
            'From_Lane': from_lane,
            'To_Lane': to_lane,
            'Lane_Change_Reason': reason
        })

    return pd.DataFrame(lane_changes)

def merge_lane_change_data(vehicle_data, lane_change_file):
    lane_change_data = extract_lane_change_data(lane_change_file)
    merged_data = pd.merge(vehicle_data, lane_change_data, how='left', on=['Time', 'Vehicle_ID'])
    
    merged_data['Lane_Changed'] = merged_data['From_Lane'].notna()
    merged_data['Lane_Change_Reason'] = merged_data['Lane_Change_Reason'].fillna('None')
    
    return merged_data

def simulate_and_extract_metrics():
    columns = [
        'Time', 'Vehicle_ID', 'Speed', 'Acceleration', 'Latitude', 'Longitude', 'Lane', 
        'Headway_Distance', 'Time_Gap', 'Speeding_Violation',
        #'Red_Light_Violation', 'Lane_Change'
    ]
    
    vehicle_data = pd.DataFrame(columns=columns)

    net_offset_x, net_offset_y, min_lon, min_lat, max_lon, max_lat = extract_network_info(net_path)

    sumoBinary = "sumo-gui" #sumo-gui for GUI
    traci.start([sumoBinary, "-c", "osm.sumocfg", "--start", "--delay", "1000"])

    SIMULATION_TIME = 100

    prev_positions = {}

    # while traci.simulation.getMinExpectedNumber() > 0: # until all vehicles have left the network
    for step in range(SIMULATION_TIME): # run for SIMULATION_TIME seconds
        traci.simulationStep()

        data_rows = []

        current_time = float(traci.simulation.getTime())
        print(f"Time: {current_time}")
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

            red_light_violation = is_red_light_violation(vehicle_id, prev_positions)



            vehicle_metrics = {
                'Time': current_time,
                'Vehicle_ID': vehicle_id,
                'Speed': speed,
                'Speed_Limit': speed_limit,
                'Speeding_Violation': speeding_violation,
                'Red_Light_Violation': red_light_violation,
                'Acceleration': acceleration,
                'Lane_Changed': False,
                'Lane_Change_Reason': None,
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
    # decompressed_file = decompress_gz("osm.net.xml.gz")  # Automatically saves as "osm.net.xml"


    vehicle_data = simulate_and_extract_metrics()
    vehicle_data = merge_lane_change_data(vehicle_data, lanechange_path)

    red_light_violations = vehicle_data[vehicle_data['Red_Light_Violation'] == True]