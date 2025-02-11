from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os 
import subprocess

app = Flask(__name__)
CORS(app)

CURR_DIR_PATH = os.path.dirname(os.path.realpath(__file__))
SCRIPTS_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "SUMO", "scripts")
RESULTS_DIR_PATH = os.path.join(CURR_DIR_PATH, "..", "SUMO", "results")
DATA_FILE = "vehicle_data.csv"
SUMO_SCRIPT = "sumo_extract.py"
DATA_FILE_PATH = os.path.join(RESULTS_DIR_PATH, DATA_FILE)
SUMO_SCRIPT_PATH = os.path.join(SCRIPTS_DIR_PATH, SUMO_SCRIPT)

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


if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=8000)