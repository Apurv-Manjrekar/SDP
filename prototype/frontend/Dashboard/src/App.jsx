import React, { useState, useEffect } from "react";

const RiskDashboard = () => {
  const [riskScores, setRiskScores] = useState([]);
  const [dpRiskScores, setDpRiskScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isApplyingDp, setIsApplyingDp] = useState(false);
  const [epsilon, setEpsilon] = useState(1.0); // Default privacy budget
  const [showRiskScores, setShowRiskScores] = useState(false);
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

  const handleApplyDp = async () => {
    setIsApplyingDp(true);
    setError(null);
    try {
      // Apply Differential Privacy
      const applyDpResponse = await fetch(`${API_URL}/apply-dp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epsilon }), // Pass privacy budget to backend
      });
      if (!applyDpResponse.ok) {
        const errorData = await applyDpResponse.json();
        throw new Error(errorData.error || 'Failed to apply differential privacy');
      }

      // Preprocess DP Data
      const preprocessResponse = await fetch(`${API_URL}/preprocess-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset: "dp_vehicle_data.csv" }),
      });
      if (!preprocessResponse.ok) {
        const errorData = await preprocessResponse.json();
        throw new Error(errorData.error || 'Failed to preprocess DP data');
      }

      // Calculate DP Risk Scores
      const calculateRiskResponse = await fetch(`${API_URL}/calculate-risk-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset: "dp_vehicle_data.csv" }),
      });
      if (!calculateRiskResponse.ok) {
        const errorData = await calculateRiskResponse.json();
        throw new Error(errorData.error || 'Failed to calculate DP risk scores');
      }

      // Fetch Updated DP Risk Scores
      const dpRiskResponse = await fetch(`${API_URL}/get-dp-risk-score`);
      if (!dpRiskResponse.ok) {
        const errorData = await dpRiskResponse.json();
        throw new Error(errorData.error || 'Failed to fetch DP risk scores');
      }
      const dpData = await dpRiskResponse.json();
      setDpRiskScores(dpData); // Update state

    } catch (error) {
      setError(error.message);
      console.error(error);
    } finally {
      setIsApplyingDp(false);
    }
  };

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
      {/* Main Title */}
      <h1 className="text-4xl font-bold text-center mb-8">
        {showRiskScores ? "Risk Scores" : "Vehicle Data Dashboard"}
      </h1>

      {/* Button to Toggle Risk Scores */}
      <button
        onClick={() => setShowRiskScores(!showRiskScores)}
        className="mb-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {showRiskScores ? "Return to Main Screen" : "Show Risk Scores"}
      </button>

      {/* Display Risk Score Tables when the button is clicked */}
      {showRiskScores ? (
        <>
          {renderTable("Risk Score without Differential Privacy", riskScores)}
          {renderTable("Risk Score with Differential Privacy", dpRiskScores)}
        </>
      ) : (
        <>
          {/* Differential Privacy Implementation Section */}
          <div className="w-full max-w-5xl bg-white p-6 rounded-2xl shadow-lg mb-6">
            <h2 className="text-2xl font-semibold text-center mb-4">Differential Privacy Implementation</h2>
            <p className="text-gray-700 mb-4">
              Data protection using Laplace mechanism with <strong>ε = {epsilon}</strong>. Key characteristics:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4">
              <li><strong>ε value</strong> controls noise magnitude.</li>
              <li><strong>Lower ε</strong> = stronger privacy.</li>
              <li>Numerical data protected.</li>
              <li>Statistical utility preserved.</li>
            </ul>
          </div>

          {/* Privacy Budget Slider and Apply Button */}
          <div className="w-full max-w-5xl bg-white p-6 rounded-2xl shadow-lg mb-6">
            <h2 className="text-2xl font-semibold text-center mb-4">Differential Privacy Settings</h2>
            <div className="flex flex-col items-center space-y-4">
              <label htmlFor="epsilon" className="text-lg font-medium">
                Privacy Budget (ε): {epsilon}
              </label>
              <input
                type="range"
                id="epsilon"
                min="0.1"
                max="10.0"
                step="0.1"
                value={epsilon}
                onChange={(e) => setEpsilon(parseFloat(e.target.value))}
                className="w-full max-w-md"
              />
              <button
                onClick={handleApplyDp}
                disabled={isApplyingDp || loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isApplyingDp ? 'Processing...' : 'Apply Differential Privacy'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Main App component
const App = () => {
  return <RiskDashboard />;
};

export default App;
