import { useState, useEffect } from "react";

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
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">How Different Epsilon Values Affect Risk Scores</h1>

      {/* Native Select Dropdown */}
      <label htmlFor="epsilon-select" className="block mb-2">Select Epsilon Value:</label>
      <select
        id="epsilon-select"
        value={selectedEpsilon}
        onChange={(e) => setSelectedEpsilon(parseFloat(e.target.value))}
        className="p-2 border rounded"
      >
        {epsilonValues.map((epsilon) => (
          <option key={epsilon} value={epsilon}>
            {`${epsilon}`}
          </option>
        ))}
      </select>

      {/* Table for Data */}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {/* Render the "Vehicle" and "DP Risk Score" columns */}
              <th className="border px-4 py-2">Vehicle</th>
              <th className="border px-4 py-2">DP Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {/* Show Vehicle_ID in the first column */}
                <td className="border px-4 py-2">{row.Vehicle_ID}</td>
                {/* Show Risk_Score in the second column */}
                <td className="border px-4 py-2">{row.Risk_Score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
