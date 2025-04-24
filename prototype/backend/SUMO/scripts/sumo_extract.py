import xml.etree.ElementTree as ET
import gzip
import os
import traci
import pandas as pd
import math
import shutil
import argparse
import ast
from sumolib import net
import time
import glob
import pyproj
import datetime

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
    # Check if the file is compressed
    if is_gz:
        with gzip.open(net_file, 'rt', encoding='utf-8') as f:
            tree = ET.parse(f)
            root = tree.getroot()
    else:
        tree = ET.parse(net_file)
        root = tree.getroot()

    # Check if the file contains a <location> tag
    location = root.find("location")
    if location is None:
        raise ValueError("No <location> tag found in the network file.")

    # Extract network offsets and projection
    net_offset_x, net_offset_y = map(float, location.get("netOffset").split(','))
    proj_parameter = location.get("projParameter")
    
    return net_offset_x, net_offset_y, proj_parameter


def sumo_to_latlon(x, y, net_offset_x, net_offset_y, proj_string):
    """
    Converts SUMO coordinates to real-world latitude and longitude.
    """
    proj = pyproj.Proj(proj_string)
    
    x_proj = x - net_offset_x
    y_proj = y - net_offset_y
    
    lon, lat = proj(x_proj, y_proj, inverse=True)
    
    return lat, lon


def latlon_to_sumo(lat, lon, net_offset_x, net_offset_y, proj_string):
    """
    Converts real-world latitude and longitude to SUMO coordinates.
    """
    proj = pyproj.Proj(proj_string)

    x_proj, y_proj = proj(lon, lat)
    
    x_sumo = x_proj + net_offset_x
    y_sumo = y_proj + net_offset_y
    
    return x_sumo, y_sumo


def get_nearest_edge(lat, lon, net_file, net_offset_x, net_offset_y, proj_string):
    """
    Finds the nearest edge to a given latitude and longitude.
    """
    # Read the SUMO network
    net_data = net.readNet(net_file)
    # Convert latitude and longitude to SUMO coordinates
    x, y = latlon_to_sumo(lat, lon, net_offset_x, net_offset_y, proj_string)

    print(f"Converted ({lat}, {lon}) -> SUMO ({x}, {y})")
    
    # Find the nearest edge
    edges = net_data.getNeighboringEdges(x, y, 1609)
    if not edges:
        print("No edges found nearby.")
        return None
    
    # Get the ID of the nearest edge
    nearest_edge = min(edges, key=lambda edge: edge[1])[0]

    print(f"Nearest edge: {nearest_edge.getID()}")

    return nearest_edge.getID()

### ------------------------------ METRIC EXTRACTION ------------------------------ ###
def extract_lane_change_data(lane_change_file):
    """
    Extracts lane change data from a SUMO lane change output file.
    """
    # Parse the XML file
    tree = ET.parse(lane_change_file)
    root = tree.getroot()

    # Extract the lane change data
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
    # Parse the XML file
    tree = ET.parse(collision_file)
    root = tree.getroot()

    # Extract the collision data
    collisions = []
    for collision in root.findall("collision"):
        time = float(collision.get("time"))
        vehicle_1 = collision.get("vehicle1")
        vehicle_2 = collision.get("vehicle2")

        collisions.append({'Time': time, 'Vehicle_ID': vehicle_1, 'Collision': True})
        collisions.append({'Time': time, 'Vehicle_ID': vehicle_2, 'Collision': True})

    return pd.DataFrame(collisions)


### ------------------------------ SIMULATION ------------------------------ ###
def simulate_and_extract_metrics(sumo_cfg, net_path, output_path, simulation_time=100, vehicles=None, 
                                 dynamic=False, start_point=None, end_point=None, vehicle_type=None, 
                                 vehicle_behavior=None, chunk_size=100000, save_interval=200, state_file=None):
    """
    Runs the SUMO simulation and extracts vehicle metrics.
    """
    # Extract network info
    net_offset_x, net_offset_y, proj_string = extract_network_info(net_path)
    
    # Start the SUMO simulation
    traci.start(["sumo", "-c", sumo_cfg, "--start", "--delay", "10", 
                 "--threads", "16",
                # "--device.rerouting.probability", "0", "--device.emissions.probability", "0", 
                # "--no-internal-links", "1", "--ignore-junction-blocker", "5",
                # "--collision.mingap-factor", "0", "--collision.action", "remove", "--collision.check-junctions", "0",
                # "--step-method.ballistic", "1",
                # "--sloppy-insert", "1", "--eager-insert", "0", "--emergency-insert", "1",
                # "--time-to-teleport", "60", "--time-to-teleport.highways", "30",
                # "--route-steps", "500",
                # "--default.action-step-length", "1", "--lateral-resolution", "1",
                # "--log", "LOGFILE",
                # "--ignore-route-errors", "--no-warnings", "--no-step-log"
                ],
                # traceFile="trace.xml",
                )

    # Load the saved state if provided
    if state_file != "None" and os.path.exists(state_file):
        print(f"Loading saved state from {state_file}")
        traci.simulation.loadState(state_file)

    # Add dynamic vehicle if requested
    if dynamic:
        print(f"LOG: Adding dynamic vehicle {vehicle_type} from {start_point} to {end_point} with behvaior {vehicle_behavior}.")
        nearest_start_edge = get_nearest_edge(start_point[0], start_point[1], net_path, net_offset_x, net_offset_y, proj_string)
        nearest_end_edge = get_nearest_edge(end_point[0], end_point[1], net_path, net_offset_x, net_offset_y, proj_string)
        dynamic_vehicle_id = add_vehicle(nearest_start_edge, nearest_end_edge, vehicle_type, vehicle_behavior)
        vehicles = [dynamic_vehicle_id]
        print(f"LOG: Dynamic vehicle ID: {dynamic_vehicle_id}")

    # Create variables to keep track of progress
    data_rows = []
    chunk_counter = 0
    if vehicles != None:
        vehicles_remaining = set(vehicles)
        vehicles_in_progress = set()

    # Run the simulation, iterating over each step
    # while traci.simulation.getMinExpectedNumber() > 0: # until all vehicles have left the network
    for step in range(simulation_time): # run for SIMULATION_TIME seconds
        traci.simulationStep()
        current_time = float(traci.simulation.getTime())
        if step % save_interval == 0:
            print(f"LOG: Simulated {current_time} seconds...")
        vehicle_ids = traci.vehicle.getIDList()

        if vehicles != None:
            vehicle_ids = [v for v in vehicle_ids if v in vehicles_remaining]

        # Extract vehicle metrics
        for vehicle_id in vehicle_ids:
            try:
                speed = traci.vehicle.getSpeed(vehicle_id)
                acceleration = traci.vehicle.getAcceleration(vehicle_id)
                x, y = traci.vehicle.getPosition(vehicle_id)
                lat, lon = sumo_to_latlon(x, y, net_offset_x, net_offset_y, proj_string)
                lane_id = traci.vehicle.getLaneID(vehicle_id)
                speed_limit = traci.lane.getMaxSpeed(lane_id)
                
                leader_info = traci.vehicle.getLeader(vehicle_id)
                if leader_info:
                    _, headway_distance = leader_info
                    time_gap = headway_distance / speed if speed > 0 else None
                else:
                    headway_distance, time_gap = None, None
            except Exception as e:
                print(f"Error processing vehicle {vehicle_id}: {e} at time {current_time}!")
                speed = acceleration = lat = lon = lane_id = headway_distance = time_gap = speed_limit = None

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

        # Save state and chunk data
        if vehicles == None and step % save_interval == 0 and step != 0:
            traci.simulation.saveState(output_path.replace('.csv', '_state_file.xml'))
            print(f"Simulation state saved at step {step}")
            chunk_counter += 1
            df_chunk = pd.DataFrame(data_rows)
            output_chunk_path = f"{output_path.replace('.csv', '')}_chunk_{chunk_counter}.csv"
            df_chunk.to_csv(output_chunk_path, index=False, mode='w', header=chunk_counter == 1)
            data_rows.clear()      

        # Check if all vehicles have left the network
        if vehicles != None:
            for vehicle_id in vehicles_in_progress.copy():
                if vehicle_id not in vehicle_ids:
                    vehicles_remaining.discard(vehicle_id)
                    vehicles_in_progress.discard(vehicle_id)
                    print(f"LOG: Vehicle {vehicle_id} has left the network.")

            for vehicle_id in vehicles_remaining.copy():
                if vehicle_id not in vehicles_in_progress and vehicle_id in vehicle_ids:
                    vehicles_in_progress.add(vehicle_id)
                    print(f"LOG: Vehicle {vehicle_id} has entered the network.")
            
            if len(vehicles_remaining) == 0:
                print("LOG: All vehicles have left the network.")
                break

    traci.close()

    # Save last chunk
    if vehicles == None and data_rows:
        df_chunk = pd.DataFrame(data_rows)
        output_chunk_path = f"{output_path.replace('.csv', '')}_chunk_{chunk_counter + 1}.csv"
        df_chunk.to_csv(output_chunk_path, index=False, mode='w', header=chunk_counter == 0)
    else:
        pd.DataFrame(data_rows).to_csv(output_path, index=False)

    return pd.DataFrame(data_rows)


### ------------------------------ DATA MERGING ------------------------------ ###
def merge_additional_data(vehicle_data, lane_change_data, collision_data):
    """
    Merges lane change and collision data with real-time vehicle data.
    """
    # Merge lane change data
    if lane_change_data.empty:
        print("No lane change data found!")
        merged_data = vehicle_data
        merged_data['Lane_Change'] = False
        merged_data['Lane_Change_Reason'] = 'None'
    else:
        print("Merging Lane Change Data!")
        merged_data = pd.merge(vehicle_data, lane_change_data, how='left', on=['Time', 'Vehicle_ID'])
        merged_data['Lane_Change_Reason'] = merged_data['Lane_Change_Reason'].fillna('None')
        merged_data['Lane_Change'] = merged_data['From_Lane'].notna()
        merged_data = merged_data.drop(['From_Lane', 'To_Lane'], axis=1)
    
    # Merge collision data
    if collision_data.empty:
        print("No collision data found!")
        merged_data['Collision'] = False
    else:
        print("Merging collision data!")
        merged_data = pd.merge(merged_data, collision_data, how='left', on=['Time', 'Vehicle_ID'])
        merged_data['Collision'] = merged_data['Collision'].fillna(False)
    
    return merged_data

def add_vehicle(start, end, vehicle_type, vehicle_behavior):
    """
    Adds a vehicle to the simulation.
    """
    # Get the route ID
    route_id = f"route_{start}_{end}"
    if route_id not in traci.route.getIDList():
        traci.route.add(route_id, [start, end])
    
    # Get the vehicle ID and type
    vehicle_id = f"{vehicle_type}_{time.time()}"
    typeID = f"{vehicle_type}_{vehicle_behavior}" if vehicle_behavior != "" else vehicle_type
    # Add the vehicle
    traci.vehicle.add(vehicle_id, route_id, typeID=typeID, departLane="best", departSpeed="avg", departPos="last")
    
    return vehicle_id

def merge_output_chunks_and_save(output_path):
    """
    Merges multiple CSV chunk files into a single CSV file.
    """
    output_dir = os.path.dirname(output_path)
    base_filename = os.path.basename(output_path).replace(".csv", "")

    # Find all chunk files that match the pattern: vehicle_data_chunk_*.csv
    chunk_files = sorted(glob.glob(os.path.join(output_dir, f"processed_{base_filename}_chunk_*.csv")), key=lambda x: int(x.rsplit("_", 1)[-1].split(".")[0]))

    if not chunk_files:
        print("No chunk files found. Returning empty DataFrame.")
        return pd.DataFrame()

    print(f"Merging {len(chunk_files)} chunk files...")

    # Read and concatenate all chunk files
    dataframes = [pd.read_csv(chunk) for chunk in chunk_files]
    print(f"Chunks loaded, concatenating chunks!")
    merged_df = pd.concat(dataframes, ignore_index=True)

    # Save merged file
    merged_df.to_csv(output_path, index=False)
    print(f"Merged output saved to {output_path}")

    return merged_df


### ------------------------------ MAIN ------------------------------ ###
if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run SUMO simulation and extract vehicle data.")
    parser.add_argument("--dynamic", type=bool, default=False, help="Whether to use user-defined vehicle data.")
    parser.add_argument("--start_point", type=str, default="None", help="Starting point of the route.")
    parser.add_argument("--end_point", type=str, default="None", help="Ending point of the route.")
    parser.add_argument("--vehicle_type", type=str, default="veh_passenger", help="Type of vehicle to add to the simulation.")
    parser.add_argument("--behavior", type=str, default="", help="Behavior of the vehicle.")
    parser.add_argument("--state_file", type=str, default="None", help="Path to previous save state file.")

    args = parser.parse_args()
    dynamic = args.dynamic
    state_file = args.state_file

    # Set default values
    if dynamic:
        start_point = ast.literal_eval(args.start_point)
        end_point = ast.literal_eval(args.end_point)

        vehicle_type = args.vehicle_type
        vehicle_behavior = args.behavior
    else:
        start_point = "None"
        end_point = "None"

        vehicle_type = "veh_passenger"
        vehicle_behavior = ""

    # Get relevant paths
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

    # Set output path
    vehicles = None
    if dynamic:
        if vehicle_behavior == "":
            behavior_name = "normal"
        else:
            behavior_name = vehicle_behavior
        output_path = os.path.join(results_dir_path, "dynamic", "vehicle_data_" +  vehicle_type + "_" + behavior_name + "_" + datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S") + ".csv")
    elif vehicles == None:
        output_path = os.path.join(results_dir_path, "vehicle_data.csv")
    else:
        output_path = os.path.join(results_dir_path, "vehicle_data_" + str(vehicles) + ".csv")
    
    # Run simulation
    vehicle_data = simulate_and_extract_metrics(sumocfg_path, net_path, output_path, simulation_time=2100, vehicles=vehicles, 
                                                dynamic=dynamic, start_point=start_point, end_point=end_point, vehicle_type=vehicle_type, 
                                                vehicle_behavior=vehicle_behavior, state_file=state_file)

    # Extract lane change and collision data
    lanechange_data = extract_lane_change_data(lanechange_path)
    collision_data = extract_collision_data(collision_path)

    # Merge lane change and collision data
    if not dynamic and vehicles == None:
        output_dir = os.path.dirname(output_path)
        base_filename = os.path.basename(output_path).replace(".csv", "")

        # Find all chunk files that match the pattern: vehicle_data_chunk_*.csv
        print("Getting Chunk Files!")
        chunk_files = sorted(glob.glob(os.path.join(output_dir, f"{base_filename}_chunk_*.csv")), key=lambda x: int(x.rsplit("_", 1)[-1].split(".")[0]))
        print(f"Adding Lane Change and Collision Data to {len(chunk_files)} Chunks!")
        for chunk_file in chunk_files:
            print(f"Chunk: {chunk_file}")
            df_chunk = pd.read_csv(chunk_file)
            df_chunk.columns = ['Time', 'Vehicle_ID', 'Speed', 'Acceleration', 'Latitude', 'Longitude',
                                'Lane', 'Headway_Distance', 'Time_Gap', 'Speed_Limit']
            df_chunk = merge_additional_data(df_chunk, lanechange_data, collision_data)
            df_chunk.to_csv(os.path.join(output_dir, f"processed_{os.path.basename(chunk_file)}"), index=False)
        print('Merging processed chunks!')
        vehicle_data = merge_output_chunks_and_save(output_path)
    else:
        vehicle_data = merge_additional_data(vehicle_data, lanechange_data, collision_data)
        vehicle_data.to_csv(output_path, index=False)

    print(f"Vehicle data saved to {output_path}!")