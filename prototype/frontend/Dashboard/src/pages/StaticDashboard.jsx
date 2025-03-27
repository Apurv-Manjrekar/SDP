import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { DashboardContext } from "./DashboardContext";
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap, Circle, Tooltip, CircleMarker, Rectangle } from "react-leaflet";
import L from "leaflet";
import "./StaticDashboard.css";
import StaticDashboardFlow from './../components/StaticDashboardFlow';



const API_URL = "http://localhost:8000";

const StaticDashboard = () => {
  const {
    vehicles, setVehicles,
    dpVehicles, setDpVehicles,
    riskScores, setRiskScores,
    dpRiskScores, setDpRiskScores,
    vehicleList, setVehicleList,
    dataCache, setDataCache
  } = React.useContext(DashboardContext);

  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [selectedVehicleType, setSelectedVehicleType] = useState("all");
  const [vehicleTypes, setVehicleTypes] = useState(["all", "car",  "truck", "motorcycle"]);
  
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

  const [vehicleRoute, setVehicleRoute] = useState([]);
  const [dpVehicleRoute, setDpVehicleRoute] = useState([]);
  const [startPoint, setStartPoint] = useState([]);
  const [endPoint, setEndPoint] = useState([]);

  const [logs, setLogs] = useState([]);

  const handleLogUpdate = (newLogs) => {
    // Update the logs state by appending new logs
    setLogs(prevLogs => [...prevLogs, ...newLogs]);
    // remove any empty logs
    setLogs(prevLogs => prevLogs.filter(log => log.trim() !== ""));
  };

  const useQuery = () => new URLSearchParams(useLocation().search);
  const query = useQuery();
  const view = query.get("view"); // e.g., "raw-vehicle-data"

  const sumoBounds = [
    [41.645520, -72.797705], // SW corner
    [41.888833, -72.553847], // NE corner
  ];
  
  const perPage = 50;

  const vehicleMap = {
    "car": "veh",
    "truck": "truck",
    "motorcycle": "motorcycle",
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Get list of all unique vehicle IDs for dropdown
  const fetchVehicleList = useCallback(async () => {
    try {
      const vehicleType = vehicleMap[selectedVehicleType];
      const functionRoute = selectedVehicleType === "all"
      ? `${API_URL}/vehicle-list`
      : `${API_URL}/vehicle-list?vehicle_type=${vehicleType}`
      const encodedFunctionRoute = encodeURIComponent(functionRoute);
      const response = await fetch(`${API_URL}/call-function?function_route=${encodedFunctionRoute}`);
      if (response.ok) {
        const result = await response.json();
        if (result.log_output && result.log_output.length > 0) {
          const newLogs = result.log_output.split('\n');
          handleLogUpdate(newLogs);
        }
        console.log("LOG: ", logs);
        const data = result.function_response;
        setVehicleList(data)
      }
    } catch (error) {
      console.error("Failed to fetch vehicle list:", error);
      setError("Failed to fetch vehicle list. Please refresh the page.");
    }
  }, [selectedVehicleType]);

  useEffect(() => {
    const debouncedFetchVehicleList = debounce(fetchVehicleList, 300);
    debouncedFetchVehicleList();

    // Cleanup function to cancel any pending timeout
    return () => {
      debouncedFetchVehicleList.cancel && debouncedFetchVehicleList.cancel();
    };
  }, [fetchVehicleList]);


  // Memoized data fetching function to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    try {
      // Create cache keys
      const vehicleDataKey = `${selectedVehicle}_${selectedVehicleType}_${currentPage}`;
      const dpVehicleDataKey = `${selectedVehicle}_${selectedVehicleType}_${dpCurrentPage}`;
      const riskScoreKey = `${selectedVehicle}_${selectedVehicleType}_${riskCurrentPage}`;
      // const vehicleRouteKey = `${selectedVehicle}`
      // const dpVehicleRouteKey = `${selectedVehicle}`
      
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
        const cachedData = dataCache.riskScores[riskScoreKey];
        setRiskScores(cachedData.originalData);
        setDpRiskScores(cachedData.dpData);
        setRiskTotalPages(cachedData.totalPages);
      }

    } catch (error) {
      setError(`Failed to fetch data: ${error.message}`);
    }
  }, [selectedVehicle, selectedVehicleType, currentPage, dpCurrentPage, riskCurrentPage]);

  // Trigger data fetching when vehicle or page changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // useEffect(() => {
  //     fetchVehicleList();
  //   }, [selectedVehicleType]);

  const fetchVehicleData = async () => {
    setIsLoading(true);
    try {
      const vehicleRouteKey = `${selectedVehicle}_${selectedVehicleType}`;
      const isAllVehicles = selectedVehicle === "all";
  
      let functionRoute;
      const vehicleType = vehicleMap[selectedVehicleType];
      if (!dataCache.vehicleRoute[vehicleRouteKey]) {
        isAllVehicles
          ? functionRoute = selectedVehicleType === "all"
            ? `${API_URL}/vehicle-data?dynamic=false&data_file=vehicle_data.csv&page=${currentPage}&per_page=${perPage}`
            : `${API_URL}/vehicle-data-by-type/${vehicleType}?dynamic=false&data_file=vehicle_data.csv&page=${currentPage}&per_page=${perPage}`
          : functionRoute = `${API_URL}/vehicle-data-by-id/${selectedVehicle}?dynamic=false&data_file=vehicle_data.csv&page=${currentPage}&per_page=${perPage}&get_route=true`
      } else {
        isAllVehicles
          ? functionRoute = selectedVehicleType === "all"
            ? `${API_URL}/vehicle-data?dynamic=false&data_file=vehicle_data.csv&page=${currentPage}&per_page=${perPage}`
            : `${API_URL}/vehicle-data-by-type/${vehicleType}?dynamic=false&data_file=vehicle_data.csv&page=${currentPage}&per_page=${perPage}`
          : functionRoute = `${API_URL}/vehicle-data-by-id/${selectedVehicle}?dynamic=false&data_file=vehicle_data.csv&page=${currentPage}&per_page=${perPage}`
      }

      console.log("Fetching data from:", functionRoute);

      const encodedFunctionRoute = encodeURIComponent(functionRoute);
      const response = await fetch(`${API_URL}/call-function?function_route=${encodedFunctionRoute}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.log_output && result.log_output.length > 0) {
        const newLogs = result.log_output.split('\n');
        handleLogUpdate(newLogs);
      }

      console.log("LOG: ", logs);
      const data = result.function_response;
      
      if (data.data && Array.isArray(data.data)) {

        console.log("length:", data.data.length);
        console.log("ID:", data.data.slice(0, 5).map(v => v.Vehicle_ID));

        setVehicles(data.data)
        setTotalPages(data.pagination.total_pages)
        
        // Update cache
        const cacheKey = `${selectedVehicle}_${selectedVehicleType}_${currentPage}`;
        setDataCache(prevCache => ({
          ...prevCache,
          vehicleData: {
            ...prevCache.vehicleData,
            [cacheKey]: {
              data: data.data,
              totalPages: data.pagination.total_pages
            }
          }
        }));

        if (!dataCache.vehicleRoute[vehicleRouteKey] && data.route && data.route.length > 0) {
          const route = data.route
            .filter(point => point.Latitude !== undefined && point.Longitude !== undefined)
            .map(point => ({
              lat: Number(point.Latitude),
              lng: Number(point.Longitude),
              speed: point.Speed ?? null,
              acceleration: point.Acceleration ?? null,
              timeGap: point["Time_Gap"] ?? null
            }));

          setVehicleRoute(route);
          setDataCache(prevCache => ({
            ...prevCache,
            vehicleRoute: {
              ...prevCache.vehicleRoute,
              [vehicleRouteKey]: {
                route: route
              }
            }
          }));
    
          if (route.length > 0) {
            setStartPoint([route[0].lat, route[0].lng]);
            setEndPoint([route[route.length - 1].lat, route[route.length - 1].lng]);
          } else {
            setVehicleRoute([]);
            setStartPoint("");
            setEndPoint("");
          }
        }
      } else {
        console.log("API:", data);
        setError(`No data found for ${selectedVehicle === "all" ? "any vehicles" : `Vehicle ${selectedVehicle}`}.`);
        setVehicles([]);
      }
    } catch (error) {
      console.error("Failed to fetch vehicle data:", error);
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDpVehicleData = async () => {
    setIsDpLoading(true);
    try {
      const dpVehicleRouteKey = `${selectedVehicle}_${selectedVehicleType}`;
      const isAllVehicles = selectedVehicle === "all";
  
      let functionRoute;
      const vehicleType = vehicleMap[selectedVehicleType];
      if (!dataCache.dpVehicleRoute[dpVehicleRouteKey]) {
        isAllVehicles
          ? functionRoute = selectedVehicleType === "all"
            ? `${API_URL}/vehicle-data?dynamic=false&data_file=dp_vehicle_data.csv&page=${dpCurrentPage}&per_page=${perPage}`
            : `${API_URL}/vehicle-data-by-type/${vehicleType}?dynamic=false&data_file=dp_vehicle_data.csv&page=${dpCurrentPage}&per_page=${perPage}`
          : functionRoute = `${API_URL}/vehicle-data-by-id/${selectedVehicle}?dynamic=false&data_file=dp_vehicle_data.csv&page=${dpCurrentPage}&per_page=${perPage}&get_route=true`
      } else {
        isAllVehicles
          ? functionRoute = selectedVehicleType === "all"
          ? `${API_URL}/vehicle-data?dynamic=false&data_file=dp_vehicle_data.csv&page=${dpCurrentPage}&per_page=${perPage}`
          : `${API_URL}/vehicle-data-by-type/${vehicleType}?dynamic=false&data_file=dp_vehicle_data.csv&page=${dpCurrentPage}&per_page=${perPage}`
        : functionRoute = `${API_URL}/vehicle-data-by-id/${selectedVehicle}?dynamic=false&data_file=dp_vehicle_data.csv&page=${dpCurrentPage}&per_page=${perPage}`
      }

      const encodedFunctionRoute = encodeURIComponent(functionRoute);
      const response = await fetch(`${API_URL}/call-function?function_route=${encodedFunctionRoute}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.log_output && result.log_output.length > 0) {
        const newLogs = result.log_output.split('\n');
        handleLogUpdate(newLogs);
      }

      console.log("LOG: ", logs);
      const data = result.function_response;
      
      if (data.data && Array.isArray(data.data)) {

        setDpVehicles(data.data)
        setDpTotalPages(data.pagination.total_pages)

        const cacheKey = `${selectedVehicle}_${selectedVehicleType}_${dpCurrentPage}`;
        setDataCache(prevCache => ({
          ...prevCache,
          dpVehicleData: {
            ...prevCache.dpVehicleData,
            [cacheKey]: {
              data: data.data,
              totalPages: data.pagination.total_pages
            }
          }
        }));
        
        if (!dataCache.dpVehicleRoute[dpVehicleRouteKey] && data.route && data.route.length > 0) {
          const route = data.route
            .filter(point => point.Latitude !== undefined && point.Longitude !== undefined)
            .map(point => ({
              lat: Number(point.Latitude),
              lng: Number(point.Longitude),
              speed: point.Speed ?? null,
              acceleration: point.Acceleration ?? null,
              timeGap: point["Time_Gap"] ?? null
            }));
          setDpVehicleRoute(route);
          setDataCache(prevCache => ({
            ...prevCache,
            dpVehicleRoute: {
              ...prevCache.dpVehicleRoute,
              [dpVehicleRouteKey]: {
                route: route,
              }
            }
          }));
        } else {
          setDpVehicleRoute([]);
        }
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
      let functionRoute;
      const vehicleType = vehicleMap[selectedVehicleType];
      selectedVehicle === "all"
      ? functionRoute = selectedVehicleType === "all"
        ? `${API_URL}/get-risk-score?dynamic=false&data_file=vehicle_data.csv`
        : `${API_URL}/get-risk-score?dynamic=false&data_file=vehicle_data.csv&vehicle_type=${vehicleType}`
      : functionRoute = `${API_URL}/get-risk-score?dynamic=false&data_file=vehicle_data.csv&vehicle_id=${selectedVehicle}`
      
      
      const encodedFunctionRoute = encodeURIComponent(functionRoute);
      const response = await fetch(
        `http://localhost:8000/call-function?function_route=${encodedFunctionRoute}`
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.log_output && result.log_output.length > 0) {
        const newLogs = result.log_output.split('\n');
        handleLogUpdate(newLogs);
      }

      console.log("LOG: ", logs);
      const data = result.function_response;
      
      // Extract original and DP risk scores
      const originalData = data.data.original || [];
      const dpData = data.data.dp || [];
      
      // Filter by vehicle ID if needed
      let filteredOriginalData = selectedVehicle === "all" 
        ? originalData 
        : originalData.filter(item => String(item.Vehicle_ID) === String(selectedVehicle));
    
      let filteredDpData = selectedVehicle === "all"
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
      const cacheKey = `${selectedVehicle}_${selectedVehicleType}_${riskCurrentPage}`;
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
  const handleVehicleTypeChange = (e) => {
    const newValue = e.target.value;
    setSelectedVehicleType(newValue);
    setSelectedVehicle("all");
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

  const combinedRoute = vehicleRoute.map((point, index) => {
    const dpPoint = dpVehicleRoute[index] || {};
    return {
      lat: point.lat,
      lng: point.lng,
      original: {
        speed: point.speed,
        acceleration: point.acceleration,
        timeGap: point.timeGap,
      },
      dp: {
        speed: dpPoint.speed,
        acceleration: dpPoint.acceleration,
        timeGap: dpPoint.timeGap,
      }
    };
  });

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        if (selectedVehicle === "Create New Vehicle") {
          if (!startPoint) {
            setStartPoint([e.latlng.lat, e.latlng.lng]);
          } else if (!endPoint) {
            setEndPoint([e.latlng.lat, e.latlng.lng]);
          } else {
            // Reset if both points are already set
            setStartPoint([e.latlng.lat, e.latlng.lng]);
            setEndPoint(null);
          }
        }
      },
    });
    return null;
  };
  
  const FitBoundsOnMount = ({ bounds }) => {
    const map = useMap();
  
    useEffect(() => {
      setTimeout(() => {
        map.fitBounds(bounds, { padding: [5, 5] }); // Fit exactly without extra space
      }, 100);
    }, [map, bounds]);
  
    return null;
  };
  
  const MapBoundsFitter = ({ route }) => {
    const map = useMap();
    
    useEffect(() => {
      if (route && route.length > 1) {
        try {
          const bounds = L.latLngBounds(route);
          map.fitBounds(bounds, { padding: [50, 50] });
          console.log("Fitting map to bounds:", bounds);
        } catch (err) {
          console.error("Error fitting bounds:", err);
        }
      }
    }, [map, route]);
    
    return null;
  };
  

  return (
    <div className="dashboard-container">
      <h1 className="text-3xl font-bold text-center mb-6">Vehicle Data Dashboard</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>}

      {/* Vehicle Type Selection */}
      <div className="mb-6">
        <label htmlFor="vehicle-type-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Vehicle Type
        </label>
        <select
          id="vehicle-type-select"
          className="block w-full p-2 border border-gray-300 rounded"
          value={selectedVehicleType}
          onChange={handleVehicleTypeChange}
          disabled={isLoading || isDpLoading || isRiskLoading}
        >
          <option value="all">All Types</option>
          {vehicleTypes.filter(type => type !== "all").map((type) => (
            <option key={type} value={type}>
              {type === "car" ? "Car" : 
              type === "motorcycle" ? "Motorcycle" : 
              type === "truck" ? "Truck" : type}
            </option>
          ))}
        </select>
      </div>

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

      {view === "map" && (
        <div className="map-wrapper">
          <div className="map-container">
          <MapContainer
            center={[(sumoBounds[0][0] + sumoBounds[1][0])/2, (sumoBounds[0][1] + sumoBounds[1][1])/2]}
            zoom={13}
            maxBounds={sumoBounds}
            maxBoundsViscosity={1.0} // Prevent dragging outside
            scrollWheelZoom={false}
            doubleClickZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              />
              <FitBoundsOnMount bounds={sumoBounds} />
              <MapClickHandler />
              <Rectangle
                bounds={sumoBounds}
                pathOptions={{ color: 'black', weight: 1, fillOpacity: 0 }}
              />

              {/* Only show route-related elements if data is available */}
              {vehicleRoute.length > 0 && dpVehicleRoute.length > 0 && (
                <>
                  {startPoint && (
                    <Marker position={startPoint}>
                      <Popup>Start Point</Popup>
                    </Marker>
                  )}
                  {endPoint && (
                    <Marker position={endPoint}>
                      <Popup>End Point</Popup>
                    </Marker>
                  )}

                  {vehicleRoute.length > 1 && <MapBoundsFitter route={vehicleRoute} />} 
                  {combinedRoute.length > 1 && (
                    <>
                      <Polyline
                        positions={combinedRoute.map(p => [p.lat, p.lng])}
                        color="blue"
                        weight={3}
                      />

                      {combinedRoute.map((point, index) => (
                        <CircleMarker
                          key={index}
                          center={[point.lat, point.lng]}
                          radius={0.01}
                          color="blue"
                          opacity={0.5}
                        >
                          <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                            <div style={{ fontSize: "0.75rem" }}>
                              <strong>Original:</strong>
                              <div>Speed: {point.original.speed ?? "N/A"} km/h</div>
                              <div>Acceleration: {point.original.acceleration ?? "N/A"} m/s²</div>
                              <div>Time Gap: {point.original.timeGap ?? "N/A"} s</div>
                              <br />
                              <strong>DP:</strong>
                              <div>Speed: {point.dp.speed ?? "N/A"} km/h</div>
                              <div>Acceleration: {point.dp.acceleration ?? "N/A"} m/s²</div>
                              <div>Time Gap: {point.dp.timeGap ?? "N/A"} s</div>
                            </div>
                          </Tooltip>
                        </CircleMarker>
                      ))}
                    </>
                  )}
                </>
              )}

                  {/* {dpVehicleRoute.length > 1 && <MapBoundsFitter route={dpVehicleRoute} />} 
                  {dpVehicleRoute.length > 1 && (
                    <Polyline positions={dpVehicleRoute} color="red" weight={3} />
                  )} */}
              
            </MapContainer>
          </div>
        </div>
        )
      }
        

      {/* Risk Score Table */}
      {view === "risk-scores" && (
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
      )}

      {/* Vehicle Data Section */}
      {view === "raw-vehicle-data" && (
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
      )}
      {/* DP Vehicle Data Section */}
      {view === 'dp-vehicle-data' && (
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
      )}
      {/* Static Dashboard Flow Chart and Logs */}
      {view === "map" && (
        <div className="flow-log-container">
          <div className="flow-chart-container">
            <div className="flow-chart">
              <label>Static Dashboard Flow</label>
              <StaticDashboardFlow />
            </div>
          </div>
          <div className="log-container">
            <div className="log-list">
              {/* Display the logs */}
              {logs.map((log, index) => {
                // Check if the log contains 'ERROR'
                const logClass = log.includes("ERROR") ? "error" : "success"; // Default to 'success' if not 'ERROR'

                return (
                  <div key={index} className={`log ${logClass}`}>
                    {log}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaticDashboard;