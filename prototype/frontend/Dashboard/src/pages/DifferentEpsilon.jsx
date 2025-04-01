import { useState, useEffect } from "react";
import "./DashboardStyles.css";
import "./DifferentEpsilon.css";

const epsilonValues = [0.01, 0.1, 0.5, 1, 2, 5, 7, 10];

export default function DataViewer() {
  const [selectedEpsilon, setSelectedEpsilon] = useState(epsilonValues[0]);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData(selectedEpsilon);
  }, [selectedEpsilon]);

  const fetchData = async (epsilon) => {
    try {
      const response = await fetch(`http://localhost:8000/data/dp_vehicle_data_epsilon_${epsilon}_risk_scores.csv`);
      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="dashboard-container">
      {/* <h1 className="text-xl font-bold mb-4">The Impact of Epsilon on Risk Scores</h1> */}

      {/* Image Section */}
      <div className="graph-container">  {/* Increased margin-bottom for more space */}
          <img
            src="http://localhost:8000/images/risk_vs_epsilon.png"
            alt="Risk vs Epsilon Graph"
            // style={{ width: '80%' }}
            // className="mx-auto border rounded-lg shadow-md"
          />
      </div>

      {/* Subheader for Dropdown */}
      {/* <h2>
        Select an epsilon value to see the risk scores change
      </h2> */}

      <div className="selection-container">
        <div className="selector">
          <label>
            Select an Epsilon Value:
          </label>
          <select
            id="epsilon-select"
            value={selectedEpsilon}
            onChange={(e) => setSelectedEpsilon(parseFloat(e.target.value))}
          >
            {epsilonValues.map((epsilon) => (
              <option key={epsilon} value={epsilon}>
                {`${epsilon}`}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Table for Data */}
      <div className="data-container">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {/* Render the "Vehicle" and "DP Risk Score" columns */}
                <th>Vehicle</th>
                <th>DP Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  {/* Show Vehicle_ID in the first column */}
                  <td>{row.Vehicle_ID}</td>
                  {/* Show Risk_Score in the second column */}
                  <td>{row.Risk_Score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
