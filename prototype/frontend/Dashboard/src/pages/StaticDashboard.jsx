import React, { useState, useEffect, useCallback } from "react";

const API_URL = "http://localhost:8000";

const StaticDashboard = () => {
  const [vehicles, setVehicles] = useState([]);
  const [dpVehicles, setDpVehicles] = useState([]);
  const [vehicleList, setVehicleList] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [riskScores, setRiskScores] = useState([]);
  const [dpRiskScores, setDpRiskScores] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dpCurrentPage, setDpCurrentPage] = useState(1);
  const [dpTotalPages, setDpTotalPages] = useState(1);
  const [riskCurrentPage, setRiskCurrentPage] = useState(1);
  const [riskTotalPages, setRiskTotalPages] = useState(1);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDpLoading, setIsDpLoading] = useState(false);
  const [isRiskLoading, setIsRiskLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Cache to store previously fetched data
  const [dataCache, setDataCache] = useState({
    vehicleData: {},     // Structure: { vehicleId_page: data }
    dpVehicleData: {},   // Structure: { vehicleId_page: data }
    riskScores: {},      // Structure: { vehicleId_page: data }
  });
  
  const perPage = 50;

  // Fetch vehicle list only once on component mount
  useEffect(() => {
    fetchVehicleList();
  }, []);

  // Memoized data fetching function to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    try {
      // Create cache keys
      const vehicleDataKey = `${selectedVehicle}_${currentPage}`;
      const dpVehicleDataKey = `${selectedVehicle}_${dpCurrentPage}`;
      const riskScoreKey = `${selectedVehicle}_${riskCurrentPage}`;
      
      // Fetch vehicle data if not in cache
      if (!dataCache.vehicleData[vehicleDataKey]) {
        await fetchVehicleData();
      } else {
        setVehicles(dataCache.vehicleData[vehicleDataKey].data);
        setTotalPages(dataCache.vehicleData[vehicleDataKey].totalPages);
      }
      
      // Fetch DP vehicle data if not in cache
      if (!dataCache.dpVehicleData[dpVehicleDataKey]) {
        await fetchDpVehicleData();
      } else {
        setDpVehicles(dataCache.dpVehicleData[dpVehicleDataKey].data);
        setDpTotalPages(dataCache.dpVehicleData[dpVehicleDataKey].totalPages);
      }
      
      // Fetch risk scores if not in cache
      if (!dataCache.riskScores[riskScoreKey]) {
        await fetchRiskScores();
      } else {
        const cachedData = dataCache.riskScores[riskScoreKey]
        setRiskScores(cachedData.originalData);
        setDpRiskScores(cachedData.dpData)
        setRiskTotalPages(cachedData.totalPages);
      }
      
      
    } catch (error) {
      setError(`Failed to fetch data: ${error.message}`);
    }
  }, [selectedVehicle, currentPage, dpCurrentPage, riskCurrentPage, dataCache]);

  // Trigger data fetching when vehicle or page changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      setError("Failed to fetch vehicle list. Please refresh the page.");
    }
  };

  const fetchVehicleData = async () => {
    setIsLoading(true);
    try {
      const endpoint = selectedVehicle === "all" 
        ? `${API_URL}/vehicle-data?dynamic=false&data_file=vehicle_data.csv&page=${currentPage}&per_page=${perPage}`
        : `${API_URL}/vehicle-data/${selectedVehicle}?dynamic=false&data_file=vehicle_data.csv&page=${currentPage}&per_page=${perPage}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        // Update state
        setVehicles(result.data);
        setTotalPages(result.pagination.total_pages);
        
        // Update cache
        const cacheKey = `${selectedVehicle}_${currentPage}`;
        setDataCache(prevCache => ({
          ...prevCache,
          vehicleData: {
            ...prevCache.vehicleData,
            [cacheKey]: {
              data: result.data,
              totalPages: result.pagination.total_pages
            }
          }
        }));
      } else {
        setError(`No data found for ${selectedVehicle === "all" ? "any vehicles" : `Vehicle ${selectedVehicle}`}.`);
        setVehicles([]);
      }
    } catch (error) {
      setError(`Failed to fetch vehicle data: ${error.message}`);
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDpVehicleData = async () => {
    setIsDpLoading(true);
    try {
      const endpoint = selectedVehicle === "all" 
      ? `${API_URL}/vehicle-data?dynamic=false&data_file=dp_vehicle_data.csv&page=${dpCurrentPage}&per_page=${perPage}`
      : `${API_URL}/vehicle-data/${selectedVehicle}?dynamic=false&data_file=dp_vehicle_data.csv&page=${dpCurrentPage}&per_page=${perPage}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        // Update state
        setDpVehicles(result.data);
        setDpTotalPages(result.pagination.total_pages);
        
        // Update cache
        const cacheKey = `${selectedVehicle}_${dpCurrentPage}`;
        setDataCache(prevCache => ({
          ...prevCache,
          dpVehicleData: {
            ...prevCache.dpVehicleData,
            [cacheKey]: {
              data: result.data,
              totalPages: result.pagination.total_pages
            }
          }
        }));
      } else {
        setDpVehicles([]);
      }
    } catch (error) {
      console.error("Failed to fetch DP vehicle data:", error);
      setDpVehicles([]);
    } finally {
      setIsDpLoading(false);
    }
  };

  const fetchRiskScores = async () => {
    setIsRiskLoading(true);
    try {
      // Use the new combined endpoint with data_file parameter
      const endpoint = selectedVehicle === "all"
        ? `${API_URL}/get-risk-score?dynamic=false&data_file=vehicle_data.csv`
        : `${API_URL}/get-risk-score?dynamic=false&data_file=vehicle_data.csv&vehicle_id=${selectedVehicle}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Extract original and DP risk scores
      const originalData = result.original || [];
      const dpData = result.dp || [];
      
      // Filter by vehicle ID if needed
      const filteredOriginalData = selectedVehicle === "all" 
        ? originalData 
        : originalData.filter(item => String(item.Vehicle_ID) === String(selectedVehicle));
      
      const filteredDpData = selectedVehicle === "all"
        ? dpData
        : dpData.filter(item => String(item.Vehicle_ID) === String(selectedVehicle));
      
      // Calculate total pages for original risk scores (which we'll paginate)
      const totalRiskPages = Math.ceil(filteredOriginalData.length / perPage);
      
      // Paginate the original data on the client side
      const startIndex = (riskCurrentPage - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedOriginalData = filteredOriginalData.slice(startIndex, endIndex);
      
      // Update state
      setRiskScores(paginatedOriginalData);
      setDpRiskScores(filteredDpData);
      setRiskTotalPages(totalRiskPages || 1);
      
      // Update cache
      const cacheKey = `${selectedVehicle}_${riskCurrentPage}`;
      setDataCache(prevCache => ({
        ...prevCache,
        riskScores: {
          ...prevCache.riskScores,
          [cacheKey]: {
            originalData: paginatedOriginalData,
            dpData: filteredDpData,
            totalPages: totalRiskPages || 1,
            allOriginalData: filteredOriginalData // Store all data for client-side pagination
          }
        }
      }));
    } catch (error) {
      console.error("Failed to fetch risk scores:", error);
      setRiskScores([]);
      setDpRiskScores([]);
      setRiskTotalPages(1);
    } finally {
      setIsRiskLoading(false);
    }
  };

  const handleVehicleChange = (e) => {
    const newValue = e.target.value;
    setSelectedVehicle(newValue);
    setCurrentPage(1); // Reset to page 1 when changing vehicles
    setDpCurrentPage(1);
    setRiskCurrentPage(1);
  };

  const handlePageChange = (newPage, type) => {
    if (type === 'vehicle' && newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    } else if (type === 'dp' && newPage >= 1 && newPage <= dpTotalPages) {
      setDpCurrentPage(newPage);
    } else if (type === 'risk' && newPage >= 1 && newPage <= riskTotalPages) {
      setRiskCurrentPage(newPage);
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
          disabled={isLoading || isDpLoading || isRiskLoading}
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
        <h2 className="text-xl font-bold mb-2 text-center">Risk Scores</h2>
        
        {/* Risk Score Pagination Controls */}
        <div className="flex justify-between items-center mb-4">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            onClick={() => handlePageChange(riskCurrentPage - 1, 'risk')}
            disabled={riskCurrentPage === 1 || isRiskLoading}
          >
            Previous
          </button>
          <span>Page {riskCurrentPage} of {riskTotalPages || 1}</span>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            onClick={() => handlePageChange(riskCurrentPage + 1, 'risk')}
            disabled={riskCurrentPage === riskTotalPages || isRiskLoading || riskTotalPages === 0}
          >
            Next
          </button>
        </div>
        
        {/* Loading Indicator for Risk Scores */}
        {isRiskLoading && (
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {riskScores.length > 0 ? (
          <div className="flex justify-center">
            <table className="w-2/3 bg-white border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border-b border-gray-300 text-center">Vehicle</th>
                  <th className="px-4 py-2 border-b border-gray-300 text-center">Risk Score</th>
                  <th className="px-4 py-2 border-b border-gray-300 text-center">DP Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {riskScores.map((item, index) => {
                  const vehicleId = item.Vehicle_ID;
                  return (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-4 py-2 border-b border-gray-300 text-center">{vehicleId}</td>
                      <td className="px-4 py-2 border-b border-gray-300 text-center">{item.Risk_Score}</td>
                      <td className="px-4 py-2 border-b border-gray-300 text-center">
                        {getMatchingDpRiskScore(vehicleId)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-4 border rounded">
            {isRiskLoading ? "Loading..." : "No risk score data available"}
          </div>
        )}
      </div>

      {/* Vehicle Data Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2 text-center">Vehicle Data</h2>
        
        {/* Pagination Controls */}
        <div className="flex justify-between items-center mb-4">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            onClick={() => handlePageChange(currentPage - 1, 'vehicle')}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages || 1}</span>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            onClick={() => handlePageChange(currentPage + 1, 'vehicle')}
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
        <div className="overflow-x-auto">
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

      {/* DP Vehicle Data Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2 text-center">Private Vehicle Data</h2>
        
        {/* DP Pagination Controls */}
        <div className="flex justify-between items-center mb-4">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            onClick={() => handlePageChange(dpCurrentPage - 1, 'dp')}
            disabled={dpCurrentPage === 1 || isDpLoading}
          >
            Previous
          </button>
          <span>Page {dpCurrentPage} of {dpTotalPages || 1}</span>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            onClick={() => handlePageChange(dpCurrentPage + 1, 'dp')}
            disabled={dpCurrentPage === dpTotalPages || isDpLoading || dpTotalPages === 0}
          >
            Next
          </button>
        </div>

        {/* Loading Indicator for DP Data */}
        {isDpLoading && (
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* DP Vehicle Data Table */}
        <div className="overflow-x-auto">
          {dpVehicles.length > 0 ? (
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
                {dpVehicles.map((vehicle, idx) => (
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
              {isDpLoading ? "Loading..." : "No private vehicle data available"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaticDashboard;