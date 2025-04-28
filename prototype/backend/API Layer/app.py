from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_cors import CORS
import pandas as pd
import os 
import subprocess
import json
import re
import sys
import io
import requests
import contextlib
import logging



app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

class LogFilter(logging.Filter):
    def filter(self, record):
        # Only capture logs that contain "LOG: "
        return "LOG: " in record.getMessage()

# Setup logging to capture logs into a StringIO buffer
log_stream = io.StringIO()
log_handler = logging.StreamHandler(log_stream)
log_handler.setLevel(logging.DEBUG)
log_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

# Create another handler to print logs to stdout (console)
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.DEBUG)
console_handler.setFormatter(logging.Formatter('%(message)s'))

logging.basicConfig(level=logging.DEBUG, handlers=[log_handler, console_handler])

log_handler.addFilter(LogFilter())

# Get relevant paths
CURR_DIR_PATH = os.path.dirname(os.path.realpath(__file__))
SCRIPTS_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "SUMO", "scripts")
RESULTS_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "SUMO", "results")
DYNAMIC_RESULTS_DIR_PATH = os.path.join(RESULTS_DIR_PATH, "dynamic")
DP_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "Differential Privacy Implementation")
PROCESS_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "Data Processing")
RISK_SCORE_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "Risk-Assessment")
EPSILON_DATA_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "Epsilon changes")
IMAGE_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "Epsilon changes")

# Relevant file names
DATA_FILE = "vehicle_data.csv"
DP_DATA_FILE = "dp_vehicle_data.csv"
RISK_SCORE_FILE = "vehicle_data_risk_scores.csv"
DP_RISK_SCORE_FILE = "dp_vehicle_data_risk_scores.csv"
SUMO_SCRIPT = "sumo_extract.py"
DP_SCRIPT = "googledp_driving_data.py"
PROCESS_SCRIPT = "data_preprocess.py"
RISK_SCORE_SCRIPT = "calculate_risk.py"

# Full paths
DATA_FILE_PATH = os.path.join(RESULTS_DIR_PATH, DATA_FILE)
DP_DATA_FILE_PATH = os.path.join(RESULTS_DIR_PATH, DP_DATA_FILE)
RISK_SCORE_FILE_PATH = os.path.join(RESULTS_DIR_PATH, RISK_SCORE_FILE)
DP_RISK_SCORE_FILE_PATH = os.path.join(RESULTS_DIR_PATH, DP_RISK_SCORE_FILE)
SUMO_SCRIPT_PATH = os.path.join(SCRIPTS_DIR_PATH, SUMO_SCRIPT)
DP_SCRIPT_PATH = os.path.join(DP_DIR_PATH, DP_SCRIPT)
PROCESS_SCRIPT_PATH = os.path.join(PROCESS_DIR_PATH, PROCESS_SCRIPT)
RISK_SCORE_SCRIPT_PATH = os.path.join(RISK_SCORE_DIR_PATH, RISK_SCORE_SCRIPT)

@app.route('/run-simulation', methods=['POST'])
def run_simulation():
    """
    Runs the SUMO simulation by executing the SUMO script.
    """
    try:
        logging.info(f"LOG: Running SUMO simulation...")
        data = request.get_json()

        # Get the start point, end point, vehicle type, and vehicle behavior
        start_point = data.get('start_point')
        end_point = data.get('end_point')
        vehicle_type = data.get('vehicle_type')
        vehicle_behavior = data.get('vehicle_behavior')

        # Check if all required parameters are present
        if not start_point or not end_point or not vehicle_type or not vehicle_behavior:
            logging.error("LOG: !ERROR! Missing required parameters")
            return jsonify({"error": "Missing required parameters"}), 400
        
        # Map vehicle type and vehicle behavior to SUMO parameters
        vehicle_types = {
            "car": "veh_passenger",
            "motorcycle": "motorcycle_motorcycle",
            "truck": "truck_truck",
        }
        vehicle_type = vehicle_types[vehicle_type]
        vehicle_behaviors = {
            "normal": "",
            "aggressive": "aggressive",
            "cautious": "cautious",
        }
        vehicle_behavior = vehicle_behaviors[vehicle_behavior]
        
        # Run the SUMO simulation
        logging.info(f"LOG: Running command: python {SUMO_SCRIPT_PATH} {json.dumps(data)} --dynamic true --start_point {start_point} --end_point {end_point} --vehicle_type {vehicle_type} --behavior {vehicle_behavior}...")
        result = subprocess.run([
            "python", 
            SUMO_SCRIPT_PATH, 
            "--dynamic", "true", 
            "--start_point", str(start_point),
            "--end_point", str(end_point),
            "--vehicle_type", vehicle_type, 
            "--behavior", vehicle_behavior
        ], capture_output=True, text=True, check=True)
        if result.stdout:
            # Split the stdout into lines and iterate over each line
            for line in result.stdout.splitlines():
                # If the line doesn't already start with "LOG: ", prepend it
                if not line.startswith("LOG: "):
                    line = f"LOG: {line}"
                logging.info(line)
        if result.stderr:
            logging.error(f"LOG: !ERROR! Simulation failed.\n{result.stderr}")
        logging.info("LOG: Simulation completed successfully.")
        return jsonify({"message": "Simulation completed successfully."}), 200
    except subprocess.CalledProcessError as e:
        logging.error(f"LOG: !ERROR! Simulation failed.")
        return jsonify({"error": f"Simulation failed: {str(e)}"}), 500
    
@app.route('/vehicle-list', methods=['GET'])
def get_vehicle_list():
    """
    Returns a list of unique vehicle IDs from the dataset.
    """
    vehicle_type = request.args.get('vehicle_type')
    logging.info("LOG: Fetching vehicle list...")
    if not os.path.exists(DATA_FILE_PATH):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    try:
        # Process the file in chunks to extract unique vehicle IDs
        unique_vehicles = set()
        
        # Use chunk processing for large files
        for chunk in pd.read_csv(DATA_FILE_PATH, chunksize=10000, usecols=['Vehicle_ID']):
            if vehicle_type:
                filtered_chunk = chunk[chunk['Vehicle_ID'].astype(str).str.contains(vehicle_type)]
                unique_in_chunk = filtered_chunk['Vehicle_ID'].unique()
            else:
                unique_in_chunk = chunk['Vehicle_ID'].unique()

            unique_vehicles.update(unique_in_chunk)
        
        # Sort the vehicle IDs for better UX
        vehicle_list = sorted(list(unique_vehicles), key=lambda x: (isinstance(x, str), x))

        logging.info("LOG: Vehicle list fetched successfully.")
        
        return jsonify(vehicle_list)
    except Exception as e:
        logging.error(f"LOG: !ERROR! Failed to fetch vehicle list.")
        print(e)
        return jsonify({"error": f"Failed to fetch vehicle list: {str(e)}"}), 500
    
@app.route('/dynamic-vehicle-list', methods=['GET'])
def get_dynamic_vehicle_list():
    """
    Returns a list of unique vehicle IDs from the dataset.
    """
    logging.info("LOG: Fetching vehicle list...")
    dynamic_vehicles = os.listdir(DYNAMIC_RESULTS_DIR_PATH)
    # Filter dynamic raw data files
    dynamic_vehicles = [file for file in dynamic_vehicles if file.endswith(".csv") and not file.startswith("dp_") and not file.endswith("_risk_scores.csv")]
    
    try:
        # Sort the vehicle IDs for better UX
        vehicle_list = sorted(dynamic_vehicles, key=lambda x: (isinstance(x, str), x))

        logging.info("LOG: Vehicle list fetched successfully.")
        return jsonify(vehicle_list)
    except Exception as e:
        logging.error(f"LOG: !ERROR! Failed to fetch vehicle list.")
        return jsonify({"error": f"Failed to fetch vehicle list: {str(e)}"}), 500

@app.route('/vehicle-data', methods=['GET'])
def get_vehicle_data():
    """
    Fetches dynamic vehicle data from the CSV file with pagination.
    """
    # Get query parameters
    dynamic = request.args.get('dynamic', 'false') == 'true'
    data_file = request.args.get('data_file')

    epsilon = None

    logging.info(f"LOG: Fetching vehicle data from data file: {data_file}")

    # Check if the data file exists
    if dynamic:
        if data_file.startswith("dp_"):
            all_files = os.listdir(DYNAMIC_RESULTS_DIR_PATH)
            matching_files = [
                f for f in all_files
                if f.startswith(data_file.replace('.csv', '_epsilon_')) and f.endswith('.csv') and not f.endswith("_risk_scores.csv") and re.search(r'_epsilon_([\d\.]+)', f)
            ]
            file = data_file
            if matching_files:
                file = matching_files[0]
                match = re.search(r'_epsilon_([\d\.]+)', file)
                if match:
                    epsilon = float(match.group(1)[:-1])  # Extract the epsilon value (digit)
                    logging.info(f"Found file: {file}, epsilon set to: {epsilon}")
                else:
                    logging.info("No valid epsilon value found in the filename.")
            data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, file)
        else:
            data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file)
    else:
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file)
    if not os.path.exists(data_file_path):
        logging.error(f"LOG: !ERROR! Vehicle data not found for data file: {data_file_path}.")
        return jsonify({"error": "No data available. Run the simulation first."}), 404

    # Get pagination parameters
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=50, type=int)

    offset = (page - 1) * per_page

    try:
        # Read the CSV file
        with open(data_file_path, 'r') as f:
            total_rows = sum(1 for _ in f) - 1

        df = pd.read_csv(data_file_path, 
                         skiprows=range(1, offset + 1) if offset > 0 else None,
                         nrows=per_page)
        
        # Process the DataFrame
        df = df.replace([float('inf'), float('-inf')], "None")
        df = df.where(pd.notna(df), "None")

        bool_columns = ['Lane_Change', 'Collision']
        for col in bool_columns:
            if col in df.columns:
                df[col] = df[col].map({1: True, 0: False, 'True': True, 'False': False})
        
        logging.info(f"LOG: Vehicle data fetched successfully for data file: {data_file}.")
        
        # Return the data
        if epsilon:
            return jsonify({
                "data": df.to_dict(orient='records'),
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total_rows,
                    "total_pages": (total_rows + per_page - 1) // per_page
                },
                "epsilon": epsilon
            })
        else:
            return jsonify({
                "data": df.to_dict(orient='records'),
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total_rows,
                    "total_pages": (total_rows + per_page - 1) // per_page
                }
            })
    except Exception as e:
        logging.error(f"LOG: !ERROR! Failed to fetch vehicle data for data file: {data_file_path}.")
        return jsonify({"error": f"Failed to fetch data: {str(e)}"}), 500

@app.route('/vehicle-data-by-id/<vehicle_id>', methods=['GET'])
def get_vehicle_data_by_id(vehicle_id):
    """
    Fetches data for a specific vehicle by ID with pagination.
    """
    # Get query parameters
    dynamic = request.args.get('dynamic', 'false') == 'true'
    data_file = request.args.get('data_file')
    get_route = request.args.get('get_route')
    if get_route is None:
        get_route = False
    get_route = get_route == 'true'

    logging.info(f"LOG: Fetching vehicle data for vehicle ID: {vehicle_id}")

    # Check if the data file exists
    if dynamic:    
        data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file)
    else:
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file)
    if not os.path.exists(data_file_path):
        logging.error("LOG: !ERROR! Vehicle data not found for data file:", data_file_path)
        return jsonify({"error": "No data available. Run the simulation first."}), 404

    # Get pagination parameters
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=50, type=int)
    
    try:
        if get_route:
            logging.info(f"LOG: Fetching vehicle route for vehicle ID: {vehicle_id}")
            route_columns = ['Latitude', 'Longitude', 'Speed', 'Acceleration', 'Time_Gap']
            vehicle_route_chunks = []

        vehicle_data_chunks = []
        total_matching_rows = 0
        
        # First pass: count total matching rows (for pagination info)
        for chunk in pd.read_csv(data_file_path, chunksize=10000):
            vehicle_chunk = chunk[chunk['Vehicle_ID'].astype(str) == str(vehicle_id)][route_columns]
            total_matching_rows += len(vehicle_chunk)
            
            if get_route:
                vehicle_route_chunks.append(vehicle_chunk)
        
        if get_route and vehicle_route_chunks:
            vehicle_route_df = pd.concat(vehicle_route_chunks) if len(vehicle_route_chunks) > 1 else vehicle_route_chunks[0]
            vehicle_route_df = vehicle_route_df.replace([float('inf'), float('-inf')], "None")
            vehicle_route_df = vehicle_route_df.where(pd.notna(vehicle_route_df), "None")

            vehicle_route = vehicle_route_df.to_dict(orient='records')
            logging.info(f"LOG: Vehicle route fetched successfully for vehicle ID: {vehicle_id}.")
        
        # If no matching rows found
        if total_matching_rows == 0:
            logging.info(f"LOG: No data found for vehicle ID: {vehicle_id}")
            return jsonify({
                "data": [],
                "route": [],
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": 0,
                    "total_pages": 0
                }
            })
        
        # Second pass: get the specific page of data
        skip_rows = (page - 1) * per_page
        rows_to_collect = per_page
        collected_rows = 0
        
        for chunk in pd.read_csv(data_file_path, chunksize=10000):
            vehicle_chunk = chunk[chunk['Vehicle_ID'].astype(str) == str(vehicle_id)]
            
            if skip_rows >= len(vehicle_chunk):
                skip_rows -= len(vehicle_chunk)
                continue
                
            relevant_rows = vehicle_chunk.iloc[skip_rows:skip_rows + rows_to_collect]
            vehicle_data_chunks.append(relevant_rows)
            
            collected_rows += len(relevant_rows)
            if collected_rows >= per_page:
                break
                
            skip_rows = 0
            rows_to_collect = per_page - collected_rows
        
        # Combine all chunks into a single dataframe
        if vehicle_data_chunks:
            df = pd.concat(vehicle_data_chunks) if len(vehicle_data_chunks) > 1 else vehicle_data_chunks[0]
            
            # Proper handling of NaN, infinity, and NA values for JSON serialization
            df = df.replace([float('inf'), float('-inf')], "None")
            df = df.where(pd.notna(df), "None")  # Convert all NaN to None
            
            # Convert boolean columns to Python booleans
            bool_columns = ['Lane_Change', 'Collision']
            for col in bool_columns:
                if col in df.columns:
                    df[col] = df[col].map({1: True, 0: False, 'True': True, 'False': False})
            
            logging.info(f"LOG: Vehicle data fetched successfully for vehicle ID: {vehicle_id}.")
            if get_route:
                return jsonify({
                    "data": df.to_dict(orient='records'),
                    "route": vehicle_route,
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": total_matching_rows,
                        "total_pages": (total_matching_rows + per_page - 1) // per_page
                    }
                })
            else:
                return jsonify({
                    "data": df.to_dict(orient='records'),
                    "route": [],
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": total_matching_rows,
                        "total_pages": (total_matching_rows + per_page - 1) // per_page
                    }
                })
        else:
            return jsonify({
                "data": [],
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total_matching_rows,
                    "total_pages": (total_matching_rows + per_page - 1) // per_page
                }
            })
    except Exception as e:
        logging.error(f"LOG: !ERROR! Failed to fetch vehicle data for vehicle ID: {vehicle_id}.")
        return jsonify({"error": f"Failed to fetch vehicle data: {str(e)}"}), 500

@app.route('/vehicle-data-by-type/<vehicle_type>', methods=['GET'])
def get_vehicle_data_by_type(vehicle_type):
    """
    Fetches data for a specific vehicle by ID with pagination.
    """
    dynamic = request.args.get('dynamic', 'false') == 'true'
    data_file = request.args.get('data_file')

    logging.info(f"LOG: Fetching vehicle data for vehicle type: {vehicle_type}")

    if dynamic:    
        data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file)
    else:
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file)
    if not os.path.exists(data_file_path):
        logging.error("LOG: !ERROR! Vehicle data not found for data file:", data_file_path)
        return jsonify({"error": "No data available. Run the simulation first."}), 404

    # Get pagination parameters
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=50, type=int)
    
    try:
        vehicle_data_chunks = []
        total_matching_rows = 0
        
        # First pass: count total matching rows (for pagination info)
        for chunk in pd.read_csv(data_file_path, chunksize=10000):
            vehicle_chunk = chunk[chunk['Vehicle_ID'].astype(str).str.contains(str(vehicle_type))]
            total_matching_rows += len(vehicle_chunk)
        
        
        # If no matching rows found
        if total_matching_rows == 0:
            logging.info(f"LOG: No data found for vehicle type: {vehicle_type}")
            return jsonify({
                "data": [],
                "route": [],
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": 0,
                    "total_pages": 0
                }
            })
        
        # Second pass: get the specific page of data
        skip_rows = (page - 1) * per_page
        rows_to_collect = per_page
        collected_rows = 0
        
        for chunk in pd.read_csv(data_file_path, chunksize=10000):
            vehicle_chunk = chunk[chunk['Vehicle_ID'].astype(str).str.contains(str(vehicle_type))]
            
            if skip_rows >= len(vehicle_chunk):
                skip_rows -= len(vehicle_chunk)
                continue
                
            relevant_rows = vehicle_chunk.iloc[skip_rows:skip_rows + rows_to_collect]
            vehicle_data_chunks.append(relevant_rows)
            
            collected_rows += len(relevant_rows)
            if collected_rows >= per_page:
                break
                
            skip_rows = 0
            rows_to_collect = per_page - collected_rows
        
        # Combine all chunks into a single dataframe
        if vehicle_data_chunks:
            df = pd.concat(vehicle_data_chunks) if len(vehicle_data_chunks) > 1 else vehicle_data_chunks[0]
            
            # Proper handling of NaN, infinity, and NA values for JSON serialization
            df = df.replace([float('inf'), float('-inf')], "None")
            df = df.where(pd.notna(df), "None")  # Convert all NaN to None
            
            # Convert boolean columns to Python booleans
            bool_columns = ['Lane_Change', 'Collision']
            for col in bool_columns:
                if col in df.columns:
                    df[col] = df[col].map({1: True, 0: False, 'True': True, 'False': False})
            
            logging.info(f"LOG: Vehicle data fetched successfully for vehicle type: {vehicle_type}.")

            return jsonify({
                "data": df.to_dict(orient='records'),
                "route": [],
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total_matching_rows,
                    "total_pages": (total_matching_rows + per_page - 1) // per_page
                }
            })
        else:
            return jsonify({
                "data": [],
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total_matching_rows,
                    "total_pages": (total_matching_rows + per_page - 1) // per_page
                }
            })
    except Exception as e:
        logging.error(f"LOG: !ERROR! Failed to fetch vehicle data for vehicle type: {vehicle_type}.")
        return jsonify({"error": f"Failed to fetch vehicle data: {str(e)}"}), 500

@app.route('/vehicle-route', methods=['GET'])
def get_vehicle_route():
    """
    Fetches the route [latitude, longitude] for a data file.
    """
    # Get query parameters
    dynamic = request.args.get('dynamic', 'false') == 'true'
    data_file = request.args.get('data_file')

    logging.info(f"LOG: Fetching vehicle route from data file: {data_file}")

    # Check if the data file exists
    if dynamic:
        if data_file.startswith("dp_"):
            all_files = os.listdir(DYNAMIC_RESULTS_DIR_PATH)
            matching_files = [
                f for f in all_files
                if f.startswith(data_file.replace('.csv', '')) and f.endswith('.csv') and re.search(r'_epsilon_([\d\.]+)', f)
            ]
            file = data_file
            if matching_files:
                file = matching_files[0]

            data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, file)
        else:
            data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file)
    else:
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file)
    if not os.path.exists(data_file_path):
        logging.error(f"LOG: !ERROR! Vehicle route not found for data file: {data_file}")
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    
    vehicle_route = []
    columns_to_return = ['Latitude', 'Longitude', 'Speed', 'Acceleration', 'Time_Gap']

    try:
        # Proper handling of NaN, infinity, and NA values for JSON serialization
        df = pd.read_csv(data_file_path)
        df = df.replace([float('inf'), float('-inf')], "None")
        df = df.where(pd.notna(df), "None")

        # filter columns
        existing_columns = [col for col in columns_to_return if col in df.columns]

        vehicle_route = df[existing_columns].to_dict(orient='records')
        logging.info(f"LOG: Vehicle route fetched successfully for data file: {data_file}")
        return jsonify({"data": vehicle_route}), 200
    except Exception as e:
        logging.error(f"LOG: !ERROR! Failed to fetch vehicle route for data file: {data_file}")
        return jsonify({"error": f"Failed to fetch vehicle route: {str(e)}"}), 500

@app.route('/apply-dp', methods=['POST'])
def apply_dp():
    """
    Applies differential privacy to the vehicle data.
    """
    # Query parameters
    data = request.get_json()
    dynamic = data.get('dynamic')
    data_file = data.get('data_file')
    epsilon = data.get('epsilon')

    result = None

    logging.info(f"LOG: Applying differential privacy to data file: {data_file} with epsilon: {epsilon}")

    # Check if the data file exists
    if dynamic == True:
        data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file)
    else:
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file)
    if not os.path.exists(data_file_path):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    
    try:
        logging.info(f"LOG: Running command: python {DP_SCRIPT_PATH} --dataset {data_file_path} --epsilon {epsilon}")
        # Run the differential privacy script
        result = subprocess.run(["python", DP_SCRIPT_PATH, "--dataset", data_file_path, "--epsilon", epsilon], capture_output=True, text=True, check=True)
        if result.stdout:
            # Split the stdout into lines and iterate over each line
            for line in result.stdout.splitlines():
                # If the line doesn't already start with "LOG: ", prepend it
                if not line.startswith("LOG: "):
                    line = f"LOG: {line}"
                logging.info(line)
        if result.stderr:
            logging.error(f"LOG: !ERROR! Failed to apply differential privacy.\n{result.stderr}")

        logging.info("LOG: Differential privacy applied successfully.")
        return jsonify({"message": "Differential privacy applied successfully.", "log_output": result.stdout}), 200
    except Exception as e:
        logging.error(f"LOG: !ERROR! Failed to apply differential privacy to data file: {data_file}")
        return jsonify({"error": f"Failed to apply differential privacy: {str(e)}", "log_output": result.stdout if result else ""}), 500

@app.route('/calculate-risk-score', methods=['POST'])
def calculate_risk_score():
    """
    Calculates the risk scores for the vehicle data.
    """
    # Get the dataset from the request
    data = request.get_json()
    dynamic = data.get('dynamic')
    data_file = data.get('data_file')

    logging.info(f"LOG: Calculating risk score for data file: {data_file}")

    # Check if the data file exists
    if dynamic == True:
        data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file)
        all_files = os.listdir(DYNAMIC_RESULTS_DIR_PATH)
        matching_files = [
            f for f in all_files
            if f.startswith(f"dp_{data_file}".replace('.csv', '')) and f.endswith('.csv') and re.search(r'_epsilon_([\d\.]+)', f)
        ]
        file = data_file
        if matching_files:
            file = matching_files[0]
        dp_data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, file)
    else:
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file)
        dp_data_file_path = os.path.join(RESULTS_DIR_PATH, f"dp_{data_file}")
    
    if not os.path.exists(data_file_path):
        logging.error(f"LOG: !ERROR! Original data not found for data file: {data_file}")
        return jsonify({"error": "Original data available. Run the simulation first."}), 404
    
    if not os.path.exists(dp_data_file_path):
        logging.error(f"LOG: !ERROR! DP data not found for data file: {data_file}")
        return jsonify({"error": "DP data available. Apply differential privacy first."}), 404
    
    # Run the risk score script
    try:
        logging.info(f"LOG: Running command: python {RISK_SCORE_SCRIPT_PATH} --dataset {data_file_path}")
        logging.info(f"LOG: Running command: python {RISK_SCORE_SCRIPT_PATH} --dataset {dp_data_file_path}")
        # Run the risk score script for the original data
        result = subprocess.run(["python", RISK_SCORE_SCRIPT_PATH, "--dataset", data_file_path], capture_output=True, text=True, check=True)
        # Run the risk score script for the DP data
        result_dp = subprocess.run(["python", RISK_SCORE_SCRIPT_PATH, "--dataset", dp_data_file_path], capture_output=True, text=True, check=True)
        if result.stdout:
            # Split the stdout into lines and iterate over each line
            for line in result.stdout.splitlines():
                # If the line doesn't already start with "LOG: ", prepend it
                if not line.startswith("LOG: "):
                    line = f"LOG: {line}"
                logging.info(line)
        if result_dp.stdout:
            # Split the stdout into lines and iterate over each line
            for line in result_dp.stdout.splitlines():
                # If the line doesn't already start with "LOG: ", prepend it
                if not line.startswith("LOG: "):
                    line = f"LOG: {line}"
                logging.info(line)
        if result.stderr:
            logging.error(f"LOG: !ERROR! Failed to calculate risk score.\n{result.stderr}")
        if result_dp.stderr:
            logging.error(f"LOG: !ERROR! Failed to calculate risk score.\n{result_dp.stderr}")
        logging.info("LOG: Risk scores calculated successfully.")
        return jsonify({"message": "Risk scores calculated successfully.", "log_output": result.stdout + result_dp.stdout}), 200
    except Exception as e:
        logging.error(f"LOG: !ERROR! Failed to calculate risk score for data file: {data_file}")
        return jsonify({"error": f"Failed to calculate risk score: {str(e)}", "log_output": result.stdout + result_dp.stdout}), 500
    
@app.route('/get-risk-score', methods=['GET'])
def get_risk_score():
    """
    Fetches both original and DP risk scores.
    """
    # Get query parameters
    dynamic = request.args.get('dynamic', 'false') == 'true'
    data_file = request.args.get('data_file')
    vehicle_id = request.args.get('vehicle_id')
    vehicle_type = request.args.get('vehicle_type')

    logging.info(f"LOG: Fetching risk score for data file: {data_file}")

    epsilon = None

    # Get data file paths
    if dynamic == True:
        original_risk_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file.replace('.csv', '_risk_scores.csv'))
        all_files = os.listdir(DYNAMIC_RESULTS_DIR_PATH)
        matching_files = [
            f for f in all_files
            if f.startswith(f"dp_{data_file}".replace('.csv', '')) and f.endswith('_risk_scores.csv') and re.search(r'_epsilon_([\d\.]+)', f)
        ]
        file = f"dp_{data_file}"
        if matching_files:
            file = matching_files[0]
            match = re.search(r'_epsilon_([\d\.]+)', file)
            if match:
                epsilon = float(match.group(1))   # Extract the epsilon value (digit)
                logging.info(f"Found file: {file}, epsilon set to: {epsilon}")
            else:
                logging.info("No valid epsilon value found in the filename.")
        dp_risk_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, file)
    else:
        original_risk_path = os.path.join(RESULTS_DIR_PATH, data_file.replace('.csv', '_risk_scores.csv'))
        dp_risk_path = os.path.join(RESULTS_DIR_PATH, f"dp_{data_file}".replace('.csv', '_risk_scores.csv'))
    
    # Create the response
    result = {
        "original": None,
        "dp": None
    }

    # Read the CSV files and get original risk scores
    if os.path.exists(original_risk_path):
        original_df = pd.read_csv(original_risk_path)
        if vehicle_id:
            original_df = original_df[original_df['Vehicle_ID'].astype(str) == str(vehicle_id)]
        elif vehicle_type:
            print("VEHICLE TYPE: ", vehicle_type)
            original_df = original_df[original_df['Vehicle_ID'].astype(str).str.contains(str(vehicle_type))]
        result["original"] = original_df.to_dict(orient='records')
    
    # Read the CSV files and get DP risk scores
    if os.path.exists(dp_risk_path):
        dp_df = pd.read_csv(dp_risk_path)
        if vehicle_id:
            dp_df = dp_df[dp_df['Vehicle_ID'].astype(str) == str(vehicle_id)]
        elif vehicle_type:
            original_df = original_df[original_df['Vehicle_ID'].astype(str).str.contains(str(vehicle_type))]
        result["dp"] = dp_df.to_dict(orient='records')
    
    # Check if both original and DP risk scores are available
    if result["original"] is None and result["dp"] is None:
        logging.error(f"LOG: !ERROR! No risk scores found for data file: {data_file}")
        return jsonify({"error": "No risk scores available. Calculate risk scores first."}), 404
    
    logging.info(f"LOG: Risk scores fetched successfully for data file: {data_file}")
    if epsilon:
        return jsonify({"data": result, "epsilon": epsilon}), 200
    else:
        return jsonify({"data": result}), 200

@app.route('/data/<filename>', methods=['GET'])
def get_csv_data(filename):
    """
    Serves the CSV file contents as JSON for the frontend.
    """
    file_path = os.path.join(EPSILON_DATA_DIR_PATH, filename)
    
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        # Read CSV and return as JSON
        df = pd.read_csv(file_path)
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": f"Failed to read file: {str(e)}"}), 500

@app.route("/images/risk_vs_epsilon.png")
def get_image():
    """
    Serves the risk_vs_epsilon.png file from the 'Epsilon changes' directory.
    """
    return send_from_directory(IMAGE_DIR_PATH, "risk_vs_epsilon.png")

@app.route('/call-function', methods=['GET', 'POST'])
def call_function():
    """
    Calls a function and returns the response.
    """
    # Get the function route
    function_route = request.args.get('function_route') if request.method == 'GET' else request.json.get('function_route')

    if not function_route:
        return jsonify({"error": "No function_route provided"}), 400

    # Create a log stream
    log_output = ""
    success = True
    try:
        # Call the function
        if request.method == 'POST':
            payload = request.json.get("payload")
            result = requests.post(function_route, json=payload)
        else:
            result = requests.get(function_route)
        # Check if the response is JSON
        if result.status_code == 200:
            response_data = result.json()
        else:
            response_data = result.text
            status_code = result.status_code
            success = False

    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500
    
    # Get the log output from the stream
    log_output += log_stream.getvalue()
    log_stream.truncate(0)
    log_stream.seek(0)

    # Return the response
    if not success:
        return jsonify({"error": response_data, "log_output": log_output}), status_code
    return jsonify({"function_response": response_data, "log_output": log_output}), 200

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=8000)