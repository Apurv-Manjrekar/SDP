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
DATA_FILE = "vehicle_data.csv"
DP_DATA_FILE = "dp_vehicle_data.csv"
SUMO_SCRIPT = "sumo_extract.py"
DP_SCRIPT = "googledp_driving_data.py"
PROCESS_SCRIPT = "data_preprocess.py"
DATA_FILE_PATH = os.path.join(RESULTS_DIR_PATH, DATA_FILE)
DP_DATA_FILE_PATH = os.path.join(RESULTS_DIR_PATH, DP_DATA_FILE)
SUMO_SCRIPT_PATH = os.path.join(SCRIPTS_DIR_PATH, SUMO_SCRIPT)
DP_SCRIPT_PATH = os.path.join(DP_DIR_PATH, DP_SCRIPT)
PROCESS_SCRIPT_PATH = os.path.join(PROCESS_DIR_PATH, PROCESS_SCRIPT)

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
    
@app.route('/vehicle-data', methods=['GET'])
def get_vehicle_data():
    """
    Fetches processed vehicle data from the CSV file.
    """
    if not os.path.exists(DATA_FILE_PATH):
        return jsonify({"error": "No data available. Run the simulation first."}), 404
    
    df = pd.read_csv(DATA_FILE_PATH)
    df.replace([float('inf'), float('-inf')], None, inplace=True)
    df.replace(pd.NA, None, inplace=True)
    return jsonify(df.to_dict(orient='records'))

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
    

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=8000)