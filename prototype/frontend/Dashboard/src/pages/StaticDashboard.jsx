import React, { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

const StaticDashboard = () => {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleList, setVehicleList] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [riskScores, setRiskScores] = useState([]);
  const [dpRiskScores, setDpRiskScores] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const perPage = 50;

  useEffect(() => {
    // Load the list of unique vehicle IDs for the dropdown
    fetchVehicleList();
    
    // Initial data load
    if (selectedVehicle === "all") {
      fetchVehicleData(currentPage);
    } else {
      fetchVehicleDataById(selectedVehicle, currentPage);
    }
    
    // Fetch risk scores based on selected vehicle
    if (selectedVehicle === "all") {
      fetchAllRiskScores();
    } else {
      fetchRiskScoreById(selectedVehicle);
    }
  }, [currentPage, selectedVehicle]);

  // Get list of all unique vehicle IDs for dropdown
  const fetchVehicleList = async () => {
    try {
      const response = await fetch(`${API_URL}/vehicle-list`);
      if (response.ok) {
        const data = await response.json();
        setVehicleList(data);
      }
    } catch (error) {
      console.error("Failed to fetch vehicle list:", error);
    }
  };

  const fetchVehicleData = async (page) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/vehicle-data?page=${page}&per_page=${perPage}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        setVehicles(result.data);
        setTotalPages(result.pagination.total_pages);
      } else {
        setError("No vehicle data available.");
        setVehicles([]);
      }
    } catch (error) {
      setError(`Failed to fetch vehicle data: ${error.message}`);
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehicleDataById = async (vehicleId, page) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/vehicle-data/${vehicleId}?page=${page}&per_page=${perPage}`
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        setVehicles(result.data);
        setTotalPages(result.pagination.total_pages);
      } else {
        setError(`No data found for Vehicle ${vehicleId}.`);
        setVehicles([]);
      }
    } catch (error) {
      setError(`Failed to fetch data for Vehicle ${vehicleId}: ${error.message}`);
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllRiskScores = async () => {
    try {
      // Fetch regular risk scores
      const riskResponse = await fetch(`${API_URL}/get-risk-score`);
      if (!riskResponse.ok) {
        throw new Error(`API error: ${riskResponse.status}`);
      }
      const riskData = await riskResponse.json();
      setRiskScores(riskData);
      console.log("Risk scores fetched:", riskData); // Debug log
      
      // Fetch DP risk scores
      const dpRiskResponse = await fetch(`${API_URL}/get-dp-risk-score`);
      if (!dpRiskResponse.ok) {
        throw new Error(`API error: ${dpRiskResponse.status}`);
      }
      const dpRiskData = await dpRiskResponse.json();
      setDpRiskScores(dpRiskData);
      console.log("DP Risk scores fetched:", dpRiskData); // Debug log
    } catch (error) {
      console.error("Failed to fetch risk scores:", error);
      setError(`Failed to fetch risk scores: ${error.message}`);
    }
  };

  const fetchRiskScoreById = async (vehicleId) => {
    try {
      // Fetch regular risk score for specific vehicle
      const riskResponse = await fetch(`${API_URL}/get-risk-score/${vehicleId}`);
      if (riskResponse.ok) {
        const riskData = await riskResponse.json();
        setRiskScores(riskData);
        console.log(`Risk scores for vehicle ${vehicleId}:`, riskData); // Debug log
      } else {
        // If no specific risk score is found, set empty array
        setRiskScores([]);
      }
      
      // For DP risk scores
      const dpRiskResponse = await fetch(`${API_URL}/get-dp-risk-score/${vehicleId}`);
      if (dpRiskResponse.ok) {
        const dpRiskData = await dpRiskResponse.json();
        setDpRiskScores(dpRiskData);
        console.log(`DP Risk scores for vehicle ${vehicleId}:`, dpRiskData); // Debug log
      } else {
        setDpRiskScores([]);
      }
    } catch (error) {
      console.error(`Failed to fetch risk scores for Vehicle ${vehicleId}:`, error);
      setError(`Failed to fetch risk scores: ${error.message}`);
    }
  };

  const handleVehicleChange = (e) => {
    const newValue = e.target.value;
    setSelectedVehicle(newValue);
    setCurrentPage(1); // Reset to page 1 when changing vehicles
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Format boolean values for display
  const formatValue = (value) => {
    if (value === true) return "Yes";
    if (value === false) return "No";
    if (value === null || value === undefined) return "N/A";
    return value;
  };

  // Find the matching DP risk score for a given vehicle
  const getMatchingDpRiskScore = (vehicleId) => {
    const match = dpRiskScores.find(
      item => String(item.Vehicle_ID) === String(vehicleId)
    );
    return match ? match.Risk_Score : "N/A";
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Vehicle Data Dashboard</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>}

      {/* Vehicle Selection */}
      <div className="mb-6">
        <label htmlFor="vehicle-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Vehicle
        </label>
        <select
          id="vehicle-select"
          className="block w-full p-2 border border-gray-300 rounded"
          value={selectedVehicle}
          onChange={handleVehicleChange}
        >
          <option value="all">All Vehicles</option>
          {vehicleList.map((vehicle) => (
            <option key={vehicle} value={vehicle}>
              Vehicle {vehicle}
            </option>
          ))}
        </select>
      </div>

      {/* Risk Score Table */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Risk Scores</h2>
        {riskScores.length > 0 ? (
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b border-gray-300 text-left">Vehicle</th>
                <th className="px-4 py-2 border-b border-gray-300 text-left">Risk Score</th>
                <th className="px-4 py-2 border-b border-gray-300 text-left">DP Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {riskScores.map((item, index) => {
                const vehicleId = item.Vehicle_ID;
                return (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-4 py-2 border-b border-gray-300">{vehicleId}</td>
                    <td className="px-4 py-2 border-b border-gray-300">{item.Risk_Score}</td>
                    <td className="px-4 py-2 border-b border-gray-300">
                      {getMatchingDpRiskScore(vehicleId)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center p-4 border rounded">
            {isLoading ? "Loading..." : "No risk score data available"}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mb-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages || 1}</span>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading || totalPages === 0}
        >
          Next
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Vehicle Data Table */}
      <div className="mb-6 overflow-x-auto">
        <h2 className="text-xl font-bold mb-2">Vehicle Data</h2>
        {vehicles.length > 0 ? (
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">Time</th>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">Vehicle ID</th>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">Speed</th>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">Acceleration</th>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">Latitude</th>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">Longitude</th>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">Lane</th>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">Headway Distance</th>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">Time Gap</th>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">Speed Limit</th>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">Lane Change</th>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">From Lane</th>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">To Lane</th>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">Lane Change Reason</th>
                <th className="sticky top-0 px-4 py-2 border-b border-gray-300 text-left">Collision</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="px-4 py-2 border-b border-gray-300">{vehicle.Time}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{vehicle.Vehicle_ID}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{vehicle.Speed}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{vehicle.Acceleration}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{vehicle.Latitude}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{vehicle.Longitude}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{vehicle.Lane}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{vehicle.Headway_Distance}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{vehicle.Time_Gap}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{vehicle.Speed_Limit}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{formatValue(vehicle.Lane_Change)}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{formatValue(vehicle.From_Lane)}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{formatValue(vehicle.To_Lane)}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{formatValue(vehicle.Lane_Change_Reason)}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{formatValue(vehicle.Collision)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center p-4 border rounded">
            {isLoading ? "Loading..." : "No vehicle data available"}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaticDashboard;