import xml.etree.ElementTree as ET
import gzip
from pyproj import Proj, Transformer
import os
import xml.etree.ElementTree as ET
import traci
import pandas as pd
import math

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

def is_red_light_violation(vehicle_id):
    edge_id = traci.vehicle.getRoadID(vehicle_id)
    
    for tls in traci.trafficlight.getIDList():
        controlled_lanes = traci.trafficlight.getControlledLanes(tls)
        if any(edge_id in lane for lane in controlled_lanes):
            light_state = traci.trafficlight.getRedYellowGreenState(tls)
            lane_index = [i for i, lane in enumerate(controlled_lanes) if edge_id in lane]
            if not lane_index:
                return False
            lane_index = lane_index[0]

            if light_state[lane_index] == 'r':
                veh_x, veh_y = traci.vehicle.getPosition(vehicle_id)
                angle = traci.vehicle.getAngle(vehicle_id)
                angle_rad = math.radians(angle)
                dx = math.cos(angle_rad)
                dy = math.sin(angle_rad)
                junction_x, junction_y = traci.junction.getPosition(tls)

                direction_to_light = (junction_x - veh_x, junction_y - veh_y)
                dot_product = dx * direction_to_light[0] + dy * direction_to_light[1]

                if dot_product > 0:
                    return True


    tls_info = traci.vehicle.getNextTLS(vehicle_id)

    if tls_info:
        tls_id, link_index, state = tls_info[0]
        if state == "r":
            stop_line_position = traci.trafficlight.getControlledLinks(tls_id)[link_index]
            vehicle_position = traci.vehicle.getPosition(vehicle_id)
            if vehicle_position[0] > stop_line_position[0] and state == 'r':
                    return True
    return False

def track_lane_changes(vehicle_id):
    lane_change_data = {
        'total_changes': 0,
        'last_lane': traci.vehicle.getLaneID(vehicle_id),
        'change_timestamps': [],
        'change_directions': [],
        'consecutive_changes': 0,
        'max_consecutive_changes': 0
    }
    def on_lane_change(vehicle_id, current_time):
        current_lane = traci.vehicle.getLaneID(vehicle_id)
            
        if current_lane != lane_change_data['last_lane']:

            current_lane_index = int(current_lane.split('_')[-1])
            previous_lane_index = int(lane_change_data['last_lane'].split('_')[-1])
            
            if current_lane_index > previous_lane_index:
                change_direction = 'right'
            elif current_lane_index < previous_lane_index:
                change_direction = 'left'
            else:
                change_direction = 'unknown'
            
            lane_change_data['total_changes'] += 1
            lane_change_data['change_timestamps'].append(current_time)
            lane_change_data['change_directions'].append(change_direction)
            
            lane_change_data['consecutive_changes'] += 1
            lane_change_data['max_consecutive_changes'] = max(
                lane_change_data['max_consecutive_changes'], 
                lane_change_data['consecutive_changes']
            )
            
            lane_change_data['last_lane'] = current_lane

    return lane_change_data, on_lane_change

def simulate_and_extract_metrics():
    columns = [
        'Time', 'Vehicle_ID', 'Speed', 'Acceleration', 'Latitude', 'Longitude', 'Lane', 
        'Headway_Distance', 'Time_Gap', 'Speeding_Violation',
        #'Red_Light_Violation', 'Lane_Change'
    ]
    
    vehicle_data = pd.DataFrame(columns=columns)

    net_offset_x, net_offset_y, min_lon, min_lat, max_lon, max_lat = extract_network_info(net_path)

    sumoBinary = "sumo" #sumo-gui for GUI
    traci.start([sumoBinary, "-c", "osm.sumocfg", "--start", "--delay", "1000"])

    SIMULATION_TIME = 10

    lane_change_trackers = {}

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

            if vehicle_id not in lane_change_trackers:
                lane_change_tracker, lane_change_handler = track_lane_changes(vehicle_id)
                lane_change_trackers[vehicle_id] = {
                    'tracker': lane_change_tracker,
                    'handler': lane_change_handler
                }
            if lane_change_trackers[vehicle_id['handler']]:
                lane_change_trackers[vehicle_id]['handler'](vehicle_id, current_time)
            lane_change_info = lane_change_trackers[vehicle_id]['tracker']
            right_changes = lane_change_info['change_directions'].count('right')
            left_changes = lane_change_info['change_directions'].count('left')
            total_changes = lane_change_info['total_changes']
            max_consecutive_changes = lane_change_info['max_consecutive_changes']

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

            red_light_violation = is_red_light_violation(vehicle_id)



            vehicle_metrics = {
                'Time': current_time,
                'Vehicle_ID': vehicle_id,
                'Speed': speed,
                'Speed_Limit': speed_limit,
                'Speeding_Violation': speeding_violation,
                'Red_Light_Violation': red_light_violation,
                'Acceleration': acceleration,
                'Lane_Changes_Total': total_changes,
                'Lane_Changes_Right': right_changes,
                'Lane_Changes_Left': left_changes,
                'Max_Consecutive_Changes': max_consecutive_changes,
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

    vehicle_data = simulate_and_extract_metrics()

    red_light_violations = vehicle_data[vehicle_data['Red_Light_Violation'] == True]