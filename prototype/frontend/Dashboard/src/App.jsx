import React, { useState, useEffect } from "react";

const RiskDashboard = () => {
  const [riskScores, setRiskScores] = useState([]);
  const [dpRiskScores, setDpRiskScores] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const API_URL = "http://localhost:8000"; 

  useEffect(() => {
    const fetchRiskScores = async () => {
      try {
        const response = await fetch(`${API_URL}/get-risk-score`);
        const data = await response.json();
        
        if (response.ok) {
          setRiskScores(data); // Store risk scores
        } else {
          setError(data.error || "Failed to fetch risk scores");
        }
      } catch (error) {
        setError("Error fetching risk scores");
        console.error(error);
      }
    };

    const fetchDpRiskScores = async () => {
      try {
        const response = await fetch(`${API_URL}/get-dp-risk-score`);
        const data = await response.json();
        
        if (response.ok) {
          setDpRiskScores(data); // Store DP risk scores
        } else {
          setError(data.error || "Failed to fetch DP risk scores");
        }
      } catch (error) {
        setError("Error fetching DP risk scores");
        console.error(error);
      }
    };

    // Fetch data from the API endpoints
    fetchRiskScores();
    fetchDpRiskScores();
    setLoading(false);
  }, []); 

  // Loading message while fetching data
  if (loading) {
    return <p className="text-center text-gray-600">Loading risk scores...</p>;
  }

  // Error message
  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  // Display risk scores
  const renderTable = (title, data) => (
    <div className="w-full max-w-5xl bg-white p-6 rounded-2xl shadow-lg mb-6">
      <h2 className="text-2xl font-semibold text-center mb-4">{title}</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            {data.length > 0 && Object.keys(data[0]).map((header, index) => (
              <th key={index} className="border border-gray-300 p-2">
                {header.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="text-center">
              {Object.keys(item).map((key, idx) => (
                <td key={idx} className="border border-gray-300 p-2">
                  {item[key] !== null && item[key] !== undefined ? item[key].toString() : "N/A"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5">
      {renderTable("Risk Scores", riskScores)}
      {renderTable("Differential Privacy Risk Scores", dpRiskScores)}
    </div>
  );
};

// Main App component
const App = () => {
  return <RiskDashboard />;
};

export default App;
