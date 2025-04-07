import pandas as pd
import matplotlib.pyplot as plt
import os
import argparse

#Compute average risk scores for different epsilon values
def compute_average_risk(epsilon_values, input_dir):
    avg_risk_scores = {}
    
    for epsilon in epsilon_values:
        risk_file = os.path.join(input_dir, f"dp_vehicle_data_epsilon_{epsilon}_risk_scores.csv")
        if os.path.exists(risk_file):
            df = pd.read_csv(risk_file)
            avg_risk_scores[epsilon] = df["Risk_Score"].mean()
        else:
            print(f"Warning: File {risk_file} not found.")
    
    return avg_risk_scores

#Plot the average risk scores against epsilon values
def plot_risk_scores(avg_risk_scores, output_dir):
    epsilons = sorted([float(e) for e in avg_risk_scores.keys()])
    avg_scores = list(avg_risk_scores.values())
    
    plt.figure(figsize=(8, 5))
    plt.plot(epsilons, avg_scores, marker='o', linestyle='-', color='b', label='Average Risk Score')
    plt.xlabel("Epsilon Value")
    plt.ylabel("Average Risk Score")
    plt.title("Impact of Epsilon on Risk Scores")
    plt.legend()
    plt.grid(True)
    
    output_path = os.path.join(output_dir, "risk_vs_epsilon.png")
    plt.savefig(output_path)
    print(f"Graph saved at {output_path}")
    plt.show()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot risk scores for different epsilon values.")
    parser.add_argument("--epsilon_values", type=str, required=True, help="Comma-separated list of epsilon values used (e.g., 0.01,0.1,0.5,1.0,2.0,5.0)")
    parser.add_argument("--input_dir", type=str, required=True, help="Directory containing risk score CSV files")
    parser.add_argument("--output_dir", type=str, required=True, help="Directory to save the output graph")
    
    args = parser.parse_args()
    epsilon_values = [str(e) for e in args.epsilon_values.split(",")]
    input_dir = os.path.abspath(args.input_dir)
    output_dir = os.path.abspath(args.output_dir)
    
    avg_risk_scores = compute_average_risk(epsilon_values, input_dir)
    plot_risk_scores(avg_risk_scores, output_dir)
