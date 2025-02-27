from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os 
import subprocess

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

CURR_DIR_PATH = os.path.dirname(os.path.realpath(__file__))
SCRIPTS_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "SUMO", "scripts")
RESULTS_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "SUMO", "results")
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
        subprocess.run(["python", SUMO_SCRIPT_PATH], check=True)
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
    
@app.route('/vehicle-data', methods=['GET'])
def get_vehicle_data():
    """
    Fetches processed vehicle data from the CSV file with pagination.
    """
    if not os.path.exists(DATA_FILE_PATH):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    
    # Get pagination parameters
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=50, type=int)
    
    # Calculate offsets
    offset = (page - 1) * per_page
    
    try:
        # Get total number of rows first (efficiently for large files)
        with open(DATA_FILE_PATH, 'r') as f:
            total_rows = sum(1 for _ in f) - 1  # Subtract header
        
        # Read the specific chunk with skiprows and nrows
        df = pd.read_csv(DATA_FILE_PATH, 
                         skiprows=range(1, offset + 1) if offset > 0 else None,
                         nrows=per_page)
        
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
    if not os.path.exists(DATA_FILE_PATH):
        return jsonify({"error": "No data available."}), 404

    # Get pagination parameters
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=50, type=int)
    
    try:
        # Use dask for efficient processing of large CSV files
        chunks = []
        total_matching_rows = 0
        
        # First pass: count total matching rows (for pagination info)
        # For very large files, you might want to store this info separately
        for chunk in pd.read_csv(DATA_FILE_PATH, chunksize=10000):
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
        
        for chunk in pd.read_csv(DATA_FILE_PATH, chunksize=10000):
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

@app.route('/lane-changes', methods=['GET'])
def get_lane_changes():
    """
    Fetches only lane change events.
    """
    if not os.path.exists(DATA_FILE_PATH):
        return jsonify({"error": "No data available."}), 404
    
    df = pd.read_csv(DATA_FILE_PATH)
    lane_changes = df[df['Lane_Change'] == True]
    return jsonify(lane_changes.to_dict(orient='records'))

@app.route('/collisions', methods=['GET'])
def get_collisions():
    """
    Fetches only collision events.
    """
    if not os.path.exists(DATA_FILE_PATH):
        return jsonify({"error": "No data available."}), 404
    
    df = pd.read_csv(DATA_FILE_PATH)
    collisions = df[df['Collision'] == True]
    return jsonify(collisions.to_dict(orient='records'))

@app.route('/apply-dp', methods=['POST'])
def apply_dp():
    """
    Applies differential privacy to the vehicle data.
    """
    if not os.path.exists(DATA_FILE_PATH):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    
    try:
        df = pd.read_csv(DATA_FILE_PATH)
        df.to_csv(DATA_FILE_PATH, index=False)
        subprocess.run(["python", DP_SCRIPT_PATH], check=True)
        return jsonify({"message": "Differential privacy applied successfully."}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to apply differential privacy: {str(e)}"}), 500

@app.route('/dp-vehicle-data', methods=['GET'])
def get_dp_vehicle_data():
    """
    Fetches processed vehicle data from the CSV file.
    """
    if not os.path.exists(DP_DATA_FILE_PATH):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    
    df = pd.read_csv(DP_DATA_FILE_PATH)
    df.replace([float('inf'), float('-inf')], None, inplace=True)
    df.replace(pd.NA, None, inplace=True)
    print(df.head())
    return jsonify(df.to_dict(orient='records'))

@app.route('/preprocess-data', methods=['POST'])
def preprocess_data():
    """
    Preprocesses the vehicle data.
    """
    # Get which dataset from request
    dataset = request.json['dataset']
    if dataset == "vehicle_data.csv" and not os.path.exists(DATA_FILE_PATH):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    elif dataset == "dp_vehicle_data.csv" and not os.path.exists(DP_DATA_FILE_PATH):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    elif dataset != "vehicle_data.csv" and dataset != "dp_vehicle_data.csv":
        return jsonify({"error": "Invalid dataset specified."}), 400

    # Run the data preprocessing script
    try:
        subprocess.run(["python", PROCESS_SCRIPT_PATH, dataset], check=True)
        return jsonify({"message": "Data preprocessed successfully."}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to preprocess data: {str(e)}"}), 500

@app.route('/calculate-risk-score', methods=['POST'])
def calculate_risk_score():
    """
    Fetches the risk score for a given vehicle ID.
    """
    # Get the dataset from the request
    dataset = request.json['dataset']
    if dataset == "vehicle_data.csv" and not os.path.exists(DATA_FILE_PATH):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    elif dataset == "dp_vehicle_data.csv" and not os.path.exists(DP_DATA_FILE_PATH):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    elif dataset != "vehicle_data.csv" and dataset != "dp_vehicle_data.csv":
        return jsonify({"error": "Invalid dataset specified."}), 400
    
    # Run the risk score script
    try:
        subprocess.run(["python", RISK_SCORE_SCRIPT_PATH, dataset], check=True)
        return jsonify({"message": "Risk score calculated successfully."}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to calculate risk score: {str(e)}"}), 500
    
@app.route('/get-risk-score', methods=['GET'])
def get_risk_score():
    """
    Fetches the risk score.
    """
    if not os.path.exists(RISK_SCORE_FILE_PATH):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    
    df = pd.read_csv(RISK_SCORE_FILE_PATH)
    print(df.head())
    return jsonify(df.to_dict(orient='records'))

@app.route('/get-risk-score/<vehicle_id>', methods=['GET'])
def get_risk_score_by_id(vehicle_id):
    """ Fetches risk score for a specific vehicle """
    if not os.path.exists(RISK_SCORE_FILE_PATH):
        return jsonify({"error": "No risk data available."}), 404
    
    df = pd.read_csv(RISK_SCORE_FILE_PATH)
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