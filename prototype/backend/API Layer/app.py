from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_cors import CORS
import pandas as pd
import os 
import subprocess
import json
from ast import literal_eval


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

CURR_DIR_PATH = os.path.dirname(os.path.realpath(__file__))
SCRIPTS_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "SUMO", "scripts")
RESULTS_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "SUMO", "results")
DYNAMIC_RESULTS_DIR_PATH = os.path.join(RESULTS_DIR_PATH, "dynamic")
DP_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "Differential Privacy Implementation")
PROCESS_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "Data Processing")
RISK_SCORE_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "Risk-Assessment")
EPSILON_DATA_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "Epsilon changes")
IMAGE_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "Epsilon changes")

DATA_FILE = "vehicle_data.csv"
DP_DATA_FILE = "dp_vehicle_data.csv"
RISK_SCORE_FILE = "vehicle_data_risk_scores.csv"
DP_RISK_SCORE_FILE = "dp_vehicle_data_risk_scores.csv"
SUMO_SCRIPT = "sumo_extract.py"
DP_SCRIPT = "googledp_driving_data.py"
PROCESS_SCRIPT = "data_preprocess.py"
RISK_SCORE_SCRIPT = "calculate_risk.py"

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
        data = request.get_json()

        start_point = data.get('start_point')
        end_point = data.get('end_point')
        vehicle_type = data.get('vehicle_type')
        vehicle_behavior = data.get('vehicle_behavior')

        if not start_point or not end_point or not vehicle_type or not vehicle_behavior:
            return jsonify({"error": "Missing required parameters"}), 400
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
        print(f"Running command: python {SUMO_SCRIPT_PATH} {json.dumps(data)} --dynamic true --start_point {start_point} --end_point {end_point} --vehicle_type {vehicle_type} --behavior {vehicle_behavior}")
        subprocess.run([
            "python", 
            SUMO_SCRIPT_PATH, 
            "--dynamic", "true", 
            "--start_point", str(start_point),
            "--end_point", str(end_point),
            "--vehicle_type", vehicle_type, 
            "--behavior", vehicle_behavior
        ], check=True)
        return jsonify({"message": "Simulation completed successfully."}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"Simulation failed: {str(e)}"}), 500
    
@app.route('/vehicle-list', methods=['GET'])
def get_vehicle_list():
    """
    Returns a list of unique vehicle IDs from the dataset.
    """
    if not os.path.exists(DATA_FILE_PATH):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    try:
        # Process the file in chunks to extract unique vehicle IDs
        unique_vehicles = set()
        
        # Use chunk processing for large files
        for chunk in pd.read_csv(DATA_FILE_PATH, chunksize=10000, usecols=['Vehicle_ID']):
            unique_in_chunk = chunk['Vehicle_ID'].unique()
            unique_vehicles.update(unique_in_chunk)
        
        # Sort the vehicle IDs for better UX
        vehicle_list = sorted(list(unique_vehicles), key=lambda x: (isinstance(x, str), x))
        
        return jsonify(vehicle_list)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch vehicle list: {str(e)}"}), 500
    
@app.route('/dynamic-vehicle-list', methods=['GET'])
def get_dynamic_vehicle_list():
    """
    Returns a list of unique vehicle IDs from the dataset.
    """
    dynamic_vehicles = os.listdir(DYNAMIC_RESULTS_DIR_PATH)
    dynamic_vehicles = [file for file in dynamic_vehicles if file.endswith(".csv") and not file.startswith("dp_") and not file.endswith("_risk_scores.csv")]
    
    try:
        vehicle_list = sorted(dynamic_vehicles, key=lambda x: (isinstance(x, str), x))        
        return jsonify(vehicle_list)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch vehicle list: {str(e)}"}), 500

@app.route('/vehicle-data', methods=['GET'])
def get_vehicle_data():
    """
    Fetches dynamic vehicle data from the CSV file with pagination.
    """
    dynamic = request.args.get('dynamic', 'false') == 'true'
    data_file = request.args.get('data_file')

    if dynamic:    
        data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file)
    else:
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file)
    if not os.path.exists(data_file_path):
        return jsonify({"error": "No data available. Run the simulation first."}), 404

    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=50, type=int)

    offset = (page - 1) * per_page

    try:
        with open(data_file_path, 'r') as f:
            total_rows = sum(1 for _ in f) - 1
        
        df = pd.read_csv(data_file_path, 
                         skiprows=range(1, offset + 1) if offset > 0 else None,
                         nrows=per_page)
        
        df = df.replace([float('inf'), float('-inf')], "None")
        df = df.where(pd.notna(df), "None")

        bool_columns = ['Lane_Change', 'Collision']
        for col in bool_columns:
            if col in df.columns:
                df[col] = df[col].map({1: True, 0: False, 'True': True, 'False': False})
        
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
        return jsonify({"error": f"Failed to fetch data: {str(e)}"}), 500

@app.route('/vehicle-data/<vehicle_id>', methods=['GET'])
def get_vehicle_data_by_id(vehicle_id):
    """
    Fetches data for a specific vehicle by ID with pagination.
    """
    dynamic = request.args.get('dynamic', 'false') == 'true'
    data_file = request.args.get('data_file')

    if dynamic:    
        data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file)
    else:
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file)
    if not os.path.exists(data_file_path):
        return jsonify({"error": "No data available. Run the simulation first."}), 404

    # Get pagination parameters
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=50, type=int)
    
    try:
        # Use dask for efficient processing of large CSV files
        chunks = []
        total_matching_rows = 0
        
        # First pass: count total matching rows (for pagination info)
        # For very large files, you might want to store this info separately
        for chunk in pd.read_csv(data_file_path, chunksize=10000):
            vehicle_chunk = chunk[chunk['Vehicle_ID'].astype(str) == str(vehicle_id)]
            total_matching_rows += len(vehicle_chunk)
        
        # If no matching rows found
        if total_matching_rows == 0:
            return jsonify({
                "data": [],
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
            chunks.append(relevant_rows)
            
            collected_rows += len(relevant_rows)
            if collected_rows >= per_page:
                break
                
            skip_rows = 0
            rows_to_collect = per_page - collected_rows
        
        # Combine all chunks into a single dataframe
        if chunks:
            df = pd.concat(chunks) if len(chunks) > 1 else chunks[0]
            
            # Proper handling of NaN, infinity, and NA values for JSON serialization
            df = df.replace([float('inf'), float('-inf')], "None")
            df = df.where(pd.notna(df), "None")  # Convert all NaN to None
            
            # Convert boolean columns to Python booleans
            bool_columns = ['Lane_Change', 'Collision']
            for col in bool_columns:
                if col in df.columns:
                    df[col] = df[col].map({1: True, 0: False, 'True': True, 'False': False})
            
            return jsonify({
                "data": df.to_dict(orient='records'),
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
        return jsonify({"error": f"Failed to fetch vehicle data: {str(e)}"}), 500

@app.route('/vehicle-route', methods=['GET'])
def get_vehicle_route():
    """
    Fetches the route [latitude, longitude] for a data file.
    """
    dynamic = request.args.get('dynamic', 'false') == 'true'
    data_file = request.args.get('data_file')

    if dynamic:    
        data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file)
    else:
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file)
    if not os.path.exists(data_file_path):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    
    vehicle_route = []
    columns_to_return = ['Latitude', 'Longitude', 'Speed', 'Acceleration', 'Time_Gap']

    try:
        df = pd.read_csv(data_file_path)
        df = df.replace([float('inf'), float('-inf')], "None")
        df = df.where(pd.notna(df), "None")
        existing_columns = [col for col in columns_to_return if col in df.columns]
        vehicle_route = df[existing_columns].to_dict(orient='records')
        return jsonify({"data": vehicle_route}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch vehicle route: {str(e)}"}), 500

@app.route('/vehicle-route/<vehicle_id>', methods=['GET'])
def get_vehicle_route_by_id(vehicle_id):
    """
    Fetches the route [latitude, longitude] for a specific vehicle ID.
    """
    dynamic = request.args.get('dynamic', 'false') == 'true'
    data_file = request.args.get('data_file')

    if dynamic:    
        data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file)
    else:
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file)
    if not os.path.exists(data_file_path):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    
    vehicle_route = []
    columns_to_return = ['Latitude', 'Longitude', 'Speed', 'Acceleration', 'Time_Gap']
    try:
        chunks = []
        for chunk in pd.read_csv(data_file_path, chunksize=10000):
            vehicle_chunk = chunk[chunk['Vehicle_ID'].astype(str) == str(vehicle_id)][columns_to_return]
            chunks.append(vehicle_chunk)
        if chunks:
            df = pd.concat(chunks) if len(chunks) > 1 else chunks[0]
            df = df.replace([float('inf'), float('-inf')], "None")
            df = df.where(pd.notna(df), "None")

            vehicle_route = df.to_dict(orient='records')
            
        return jsonify({"data": vehicle_route}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch vehicle route: {str(e)}"}), 500

@app.route('/apply-dp', methods=['POST'])
def apply_dp():
    """
    Applies differential privacy to the vehicle data.
    """
    data = request.get_json()
    dynamic = data.get('dynamic')
    data_file = data.get('data_file')
    epsilon = data.get('epsilon')
    # epsilon = literal_eval(data.get('epsilon'))

    if dynamic == True:
        data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file)
    else:
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file)
    if not os.path.exists(data_file_path):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    
    try:
        subprocess.run(["python", DP_SCRIPT_PATH, "--dataset", data_file_path, "--epsilon", epsilon], check=True)
        return jsonify({"message": "Differential privacy applied successfully."}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to apply differential privacy: {str(e)}"}), 500


@app.route('/preprocess-data', methods=['POST'])
def preprocess_data():
    """
    Preprocesses the vehicle data.
    """
    # Get which dataset from request
    data = request.get_json()
    dynamic = data.get('dynamic')
    data_file = data.get('data_file')

    if dynamic == True:
        data_file_path = os.path.join("dynamic", data_file, '.csv')
    else:
        data_file_path = os.path.join(data_file, '.csv')
    
    if not os.path.exists(data_file_path):
        return jsonify({"error": "No data available. Run the simulation first."}), 404

    # Run the data preprocessing script
    try:
        subprocess.run(["python", PROCESS_SCRIPT_PATH, data_file_path], check=True)
        return jsonify({"message": "Data preprocessed successfully."}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to preprocess data: {str(e)}"}), 500

@app.route('/calculate-risk-score', methods=['POST'])
def calculate_risk_score():
    """
    Fetches the risk score for a given vehicle ID.
    """
    # Get the dataset from the request
    data = request.get_json()
    dynamic = data.get('dynamic')
    data_file = data.get('data_file')

    if dynamic == True:
        data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file)
        dp_data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, f"dp_{data_file}")
    else:
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file)
        dp_data_file_path = os.path.join(RESULTS_DIR_PATH, f"dp_{data_file}")
    
    if not os.path.exists(data_file_path):
        return jsonify({"error": "Original data available. Run the simulation first."}), 404
    
    if not os.path.exists(dp_data_file_path):
        return jsonify({"error": "DP data available. Apply differential privacy first."}), 404
    
    # Run the risk score script
    try:
        subprocess.run(["python", RISK_SCORE_SCRIPT_PATH, "--dataset", data_file_path], check=True)
        subprocess.run(["python", RISK_SCORE_SCRIPT_PATH, "--dataset", dp_data_file_path], check=True)
        return jsonify({"message": "Risk scores calculated successfully."}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to calculate risk score: {str(e)}"}), 500
    
@app.route('/get-risk-score', methods=['GET'])
def get_risk_score():
    """
    Fetches both original and DP risk scores.
    """
    dynamic = request.args.get('dynamic', 'false') == 'true'
    data_file = request.args.get('data_file')
    vehicle_id = request.args.get('vehicle_id')

    if dynamic == True:
        original_risk_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file.replace('.csv', '_risk_scores.csv'))
        dp_risk_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, f"dp_{data_file}".replace('.csv', '_risk_scores.csv'))
    else:
        original_risk_path = os.path.join(RESULTS_DIR_PATH, data_file.replace('.csv', '_risk_scores.csv'))
        dp_risk_path = os.path.join(RESULTS_DIR_PATH, f"dp_{data_file}".replace('.csv', '_risk_scores.csv'))
    
    result = {
        "original": None,
        "dp": None
    }

    if os.path.exists(original_risk_path):
        original_df = pd.read_csv(original_risk_path)
        if vehicle_id:
            original_df = original_df[original_df['Vehicle_ID'].astype(str) == str(vehicle_id)]
        result["original"] = original_df.to_dict(orient='records')
    
    if os.path.exists(dp_risk_path):
        dp_df = pd.read_csv(dp_risk_path)
        if vehicle_id:
            dp_df = dp_df[dp_df['Vehicle_ID'].astype(str) == str(vehicle_id)]
        result["dp"] = dp_df.to_dict(orient='records')
    
    if result["original"] is None and result["dp"] is None:
        return jsonify({"error": "No risk scores available. Calculate risk scores first."}), 404
    
    return jsonify(result)

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

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=8000)