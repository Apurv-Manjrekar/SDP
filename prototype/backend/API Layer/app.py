from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os 
import subprocess
import json

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

CURR_DIR_PATH = os.path.dirname(os.path.realpath(__file__))
SCRIPTS_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "SUMO", "scripts")
RESULTS_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "SUMO", "results")
DYNAMIC_RESULTS_DIR_PATH = os.path.join(RESULTS_DIR_PATH, "dynamic")
DP_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "Differential Privacy Implementation")
PROCESS_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "Data Processing")
RISK_SCORE_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "Risk-Assessment")

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
    dynamic = request.args.get('dynamic')
    if dynamic == True:
        data_file = request.args.get('data_file')
        data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file, '.csv')
    else:
        data_file = request.args.get('data_file')
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file, '.csv')
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

# @app.route('/vehicle-data', methods=['GET'])
# def get_vehicle_data():
#     """
#     Fetches processed vehicle data from the CSV file with pagination.
#     """
#     if not os.path.exists(DATA_FILE_PATH):
#         return jsonify({"error": "No data available. Run the simulation first."}), 404
    
#     # Get pagination parameters
#     page = request.args.get('page', default=1, type=int)
#     per_page = request.args.get('per_page', default=50, type=int)
    
#     # Calculate offsets
#     offset = (page - 1) * per_page
    
#     try:
#         # Get total number of rows first (efficiently for large files)
#         with open(DATA_FILE_PATH, 'r') as f:
#             total_rows = sum(1 for _ in f) - 1  # Subtract header
        
#         # Read the specific chunk with skiprows and nrows
#         df = pd.read_csv(DATA_FILE_PATH, 
#                          skiprows=range(1, offset + 1) if offset > 0 else None,
#                          nrows=per_page)
        
#         # Proper handling of NaN, infinity, and NA values for JSON serialization
#         df = df.replace([float('inf'), float('-inf')], "None")
#         df = df.where(pd.notna(df), "None")  # Convert all NaN to None
        
#         # Convert boolean columns to Python booleans
#         bool_columns = ['Lane_Change', 'Collision']
#         for col in bool_columns:
#             if col in df.columns:
#                 df[col] = df[col].map({1: True, 0: False, 'True': True, 'False': False})
        
#         return jsonify({
#             "data": df.to_dict(orient='records'),
#             "pagination": {
#                 "page": page,
#                 "per_page": per_page,
#                 "total": total_rows,
#                 "total_pages": (total_rows + per_page - 1) // per_page
#             }
#         })
#     except Exception as e:
#         return jsonify({"error": f"Failed to fetch data: {str(e)}"}), 500
    


# @app.route('/vehicle-data/<vehicle_id>', methods=['GET'])
# def get_vehicle_data_by_id(vehicle_id):
#     """
#     Fetches data for a specific vehicle by ID with pagination.
#     """
#     if not os.path.exists(DATA_FILE_PATH):
#         return jsonify({"error": "No data available."}), 404

#     # Get pagination parameters
#     page = request.args.get('page', default=1, type=int)
#     per_page = request.args.get('per_page', default=50, type=int)
    
#     try:
#         # Use dask for efficient processing of large CSV files
#         chunks = []
#         total_matching_rows = 0
        
#         # First pass: count total matching rows (for pagination info)
#         # For very large files, you might want to store this info separately
#         for chunk in pd.read_csv(DATA_FILE_PATH, chunksize=10000):
#             vehicle_chunk = chunk[chunk['Vehicle_ID'].astype(str) == str(vehicle_id)]
#             total_matching_rows += len(vehicle_chunk)
        
#         # If no matching rows found
#         if total_matching_rows == 0:
#             return jsonify({
#                 "data": [],
#                 "pagination": {
#                     "page": page,
#                     "per_page": per_page,
#                     "total": 0,
#                     "total_pages": 0
#                 }
#             })
        
#         # Second pass: get the specific page of data
#         skip_rows = (page - 1) * per_page
#         rows_to_collect = per_page
#         collected_rows = 0
        
#         for chunk in pd.read_csv(DATA_FILE_PATH, chunksize=10000):
#             vehicle_chunk = chunk[chunk['Vehicle_ID'].astype(str) == str(vehicle_id)]
            
#             if skip_rows >= len(vehicle_chunk):
#                 skip_rows -= len(vehicle_chunk)
#                 continue
                
#             relevant_rows = vehicle_chunk.iloc[skip_rows:skip_rows + rows_to_collect]
#             chunks.append(relevant_rows)
            
#             collected_rows += len(relevant_rows)
#             if collected_rows >= per_page:
#                 break
                
#             skip_rows = 0
#             rows_to_collect = per_page - collected_rows
        
#         # Combine all chunks into a single dataframe
#         if chunks:
#             df = pd.concat(chunks) if len(chunks) > 1 else chunks[0]
            
#             # Proper handling of NaN, infinity, and NA values for JSON serialization
#             df = df.replace([float('inf'), float('-inf')], "None")
#             df = df.where(pd.notna(df), "None")  # Convert all NaN to None
            
#             # Convert boolean columns to Python booleans
#             bool_columns = ['Lane_Change', 'Collision']
#             for col in bool_columns:
#                 if col in df.columns:
#                     df[col] = df[col].map({1: True, 0: False, 'True': True, 'False': False})
            
#             return jsonify({
#                 "data": df.to_dict(orient='records'),
#                 "pagination": {
#                     "page": page,
#                     "per_page": per_page,
#                     "total": total_matching_rows,
#                     "total_pages": (total_matching_rows + per_page - 1) // per_page
#                 }
#             })
#         else:
#             return jsonify({
#                 "data": [],
#                 "pagination": {
#                     "page": page,
#                     "per_page": per_page,
#                     "total": total_matching_rows,
#                     "total_pages": (total_matching_rows + per_page - 1) // per_page
#                 }
#             })
#     except Exception as e:
#         return jsonify({"error": f"Failed to fetch vehicle data: {str(e)}"}), 500

# @app.route('/lane-changes', methods=['GET'])
# def get_lane_changes():
#     """
#     Fetches only lane change events.
#     """
#     if not os.path.exists(DATA_FILE_PATH):
#         return jsonify({"error": "No data available."}), 404
    
#     df = pd.read_csv(DATA_FILE_PATH)
#     lane_changes = df[df['Lane_Change'] == True]
#     return jsonify(lane_changes.to_dict(orient='records'))

# @app.route('/collisions', methods=['GET'])
# def get_collisions():
#     """
#     Fetches only collision events.
#     """
#     if not os.path.exists(DATA_FILE_PATH):
#         return jsonify({"error": "No data available."}), 404
    
#     df = pd.read_csv(DATA_FILE_PATH)
#     collisions = df[df['Collision'] == True]
#     return jsonify(collisions.to_dict(orient='records'))

@app.route('/apply-dp', methods=['POST'])
def apply_dp():
    """
    Applies differential privacy to the vehicle data.
    """
    data = request.get_json()
    dynamic = data.get('dynamic')
    data_file = data.get('data_file')

    if dynamic == True:
        data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file)
    else:
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file)
    if not os.path.exists(data_file_path):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    
    try:
        subprocess.run(["python", DP_SCRIPT_PATH, "--dataset", data_file_path], check=True)
        return jsonify({"message": "Differential privacy applied successfully."}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to apply differential privacy: {str(e)}"}), 500

# @app.route('/dp-vehicle-data', methods=['GET'])
# def get_dp_vehicle_data():
#     """
#     Fetches processed dp vehicle data from the CSV file with pagination.
#     """
#     if not os.path.exists(DP_DATA_FILE_PATH):
#         return jsonify({"error": "No data available. Run the simulation first."}), 404
    
#     # Get pagination parameters
#     page = request.args.get('page', default=1, type=int)
#     per_page = request.args.get('per_page', default=50, type=int)
    
#     # Calculate offsets
#     offset = (page - 1) * per_page
    
#     try:
#         # Get total number of rows first (efficiently for large files)
#         with open(DP_DATA_FILE_PATH, 'r') as f:
#             total_rows = sum(1 for _ in f) - 1  # Subtract header
        
#         # Read the specific chunk with skiprows and nrows
#         df = pd.read_csv(DP_DATA_FILE_PATH, skiprows=offset, nrows=per_page)
        
#         # Proper handling of NaN, infinity, and NA values for JSON serialization
#         df = df.replace([float('inf'), float('-inf')], "None")
#         df = df.where(pd.notna(df), "None")  # Convert all NaN to None
        
#         # Convert boolean columns to Python booleans
#         bool_columns = ['Lane_Change', 'Collision']
#         for col in bool_columns:
#             if col in df.columns:
#                 df[col] = df[col].map({1: True, 0: False, 'True': True, 'False': False})
        
#         return jsonify({    
#             "data": df.to_dict(orient='records'),
#             "pagination": {
#                 "page": page,
#                 "per_page": per_page,
#                 "total": total_rows,
#                 "total_pages": (total_rows + per_page - 1) // per_page
#             }
#         })
#     except Exception as e:
#         return jsonify({"error": f"Failed to fetch vehicle data: {str(e)}"}), 500
    
# @app.route('/dp-vehicle-data/<vehicle_id>', methods=['GET'])
# def get_dp_vehicle_data_by_id(vehicle_id):
#     """
#     Fetches data for a specific vehicle by ID with pagination.
#     """
#     if not os.path.exists(DP_DATA_FILE_PATH):
#         return jsonify({"error": "No data available. Run the simulation first."}), 404
    
#     # Get pagination parameters
#     page = request.args.get('page', default=1, type=int)
#     per_page = request.args.get('per_page', default=50, type=int)
    
#     # Calculate offsets
#     offset = (page - 1) * per_page
    
#     try:
#         # Get total number of rows first (efficiently for large files)
#         with open(DP_DATA_FILE_PATH, 'r') as f:
#             total_rows = sum(1 for _ in f) - 1  # Subtract header
        
#         # Read the specific chunk with skiprows and nrows
#         df = pd.read_csv(DP_DATA_FILE_PATH, skiprows=offset, nrows=per_page)
        
#         # Proper handling of NaN, infinity, and NA values for JSON serialization
#         df = df.replace([float('inf'), float('-inf')], "None")
#         df = df.where(pd.notna(df), "None")  # Convert all NaN to None
        
#         # Convert boolean columns to Python booleans
#         bool_columns = ['Lane_Change', 'Collision']
#         for col in bool_columns:
#             if col in df.columns:
#                 df[col] = df[col].map({1: True, 0: False, 'True': True, 'False': False})
        
#         vehicle_df = df[df['Vehicle_ID'].astype(str) == str(vehicle_id)]
        
#         return jsonify({    
#             "data": vehicle_df.to_dict(orient='records'),
#             "pagination": {
#                 "page": page,
#                 "per_page": per_page,
#                 "total": len(vehicle_df),
#                 "total_pages": (len(vehicle_df) + per_page - 1) // per_page
#             }
#         })
#     except Exception as e:
#         return jsonify({"error": f"Failed to fetch vehicle data: {str(e)}"}), 500

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
        result["original"] = original_df.to_dict(orient='records')
    
    if os.path.exists(dp_risk_path):
        dp_df = pd.read_csv(dp_risk_path)
        result["dp"] = dp_df.to_dict(orient='records')
    
    if result["original"] is None and result["dp"] is None:
        return jsonify({"error": "No risk scores available. Calculate risk scores first."}), 404
    
    return jsonify(result)

@app.route('/get-risk-score/<vehicle_id>', methods=['GET'])
def get_risk_score_by_id(vehicle_id):
    """ Fetches risk score for a specific vehicle """
    dynamic = request.args.get('dynamic')
    if dynamic == True:
        data_file = request.args.get('data_file')
        data_file_path = os.path.join(DYNAMIC_RESULTS_DIR_PATH, data_file, '_risk_scores.csv')
    else:
        data_file = request.args.get('data_file')
        data_file_path = os.path.join(RESULTS_DIR_PATH, data_file, '_risk_scores.csv')
    
    if not os.path.exists(data_file_path):
        return jsonify({"error": "No data available. Run the simulation first."}), 404

    df = pd.read_csv(data_file_path)
    risk_data = df[df['Vehicle_ID'].astype(str) == vehicle_id]
    
    if risk_data.empty:
        return jsonify({"error": "Risk score not found."}), 404
    print(risk_data.head())
    return jsonify(risk_data.to_dict(orient='records'))

@app.route('/get-dp-risk-score', methods=['GET'])
def get_dp_risk_score():
    """
    Fetches the dp risk score.
    """
    if not os.path.exists(DP_RISK_SCORE_FILE_PATH):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    
    df = pd.read_csv(DP_RISK_SCORE_FILE_PATH)
    print(df.head())
    return jsonify(df.to_dict(orient='records'))

@app.route('/get-dp-risk-score/<vehicle_id>', methods=['GET'])
def get_dp_risk_score_by_id(vehicle_id):
    """ Fetches dp risk score for a specific vehicle """
    if not os.path.exists(DP_RISK_SCORE_FILE_PATH):
        return jsonify({"error": "No risk data available."}), 404
    
    df = pd.read_csv(DP_RISK_SCORE_FILE_PATH)
    risk_data = df[df['Vehicle_ID'].astype(str) == vehicle_id]
    
    if risk_data.empty:
        return jsonify({"error": "Risk score not found."}), 404
    print(risk_data.head())
    return jsonify(risk_data.to_dict(orient='records'))    

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=8000)