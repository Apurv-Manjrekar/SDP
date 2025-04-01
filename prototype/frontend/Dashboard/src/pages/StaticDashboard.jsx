import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { DashboardContext } from "./DashboardContext";
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap, Circle, Tooltip, CircleMarker, Rectangle } from "react-leaflet";
import L from "leaflet";
import "./StaticDashboard.css";
import "./DashboardStyles.css";
import StaticDashboardFlow from '../components/StaticDashboardFlow/StaticDashboardFlow';



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
        setRiskScores(cachedData.data);
        // setDpRiskScores(cachedData.dpData);
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
      setRiskScores({ original: paginatedOriginalData, dp: filteredDpData });
      // setDpRiskScores(filteredDpData);
      setRiskTotalPages(totalRiskPages || 1);
      
      // Update cache
      const cacheKey = `${selectedVehicle}_${selectedVehicleType}_${riskCurrentPage}`;
      setDataCache(prevCache => ({
        ...prevCache,
        riskScores: {
          ...prevCache.riskScores,
          [cacheKey]: {
            data: {
              original: paginatedOriginalData,
              dp: filteredDpData,
            },
            totalPages: totalRiskPages || 1,
            allOriginalData: filteredOriginalData // Store all data for client-side pagination
          }
        }
      }));
    } catch (error) {
      console.error("Failed to fetch risk scores:", error);
      setRiskScores({ original: null, dp: null });
      // setDpRiskScores([]);
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
      {/* <h1>Vehicle Data Dashboard</h1> */}

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>}
      {view === "map" && (
        <div className="static-map">
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
        </div>
        )
      }

      {/* Vehicle Selection */}
      <div className="selection-container">

        {/* Vehicle Type Selection */}
        <div className="selector">
          <label >
            Select Vehicle Type:
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
        <div className="selector">
          <label>
            Select Vehicle:
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
      </div>

      
      {/* Vehicle Data Section */}
      {view !== "map" && (
        <div className="data-container">

          {/* Original Vehicle Data */}
          {view === "raw-vehicle-data" && (
            <div className="data-display">
              <h3>Original Vehicle Data</h3>

              {isLoading ? (
                <p>Loading data...</p>
              ) : vehicles.length > 0 ? (
                <>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Vehicle ID</th>
                          <th>Speed</th>
                          <th>Acceleration</th>
                          <th>Latitude</th>
                          <th>Longitude</th>
                          <th>Lane</th>
                          <th>Headway Distance</th>
                          <th>Time Gap</th>
                          <th>Speed Limit</th>
                          <th>Lane Change</th>
                          <th>Lane Change Reason</th>
                          <th>Collision</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicles.map((vehicle, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td>{vehicle.Time}</td>
                            <td>{vehicle.Vehicle_ID}</td>
                            <td>{vehicle.Speed}</td>
                            <td>{vehicle.Acceleration}</td>
                            <td>{vehicle.Latitude}</td>
                            <td>{vehicle.Longitude}</td>
                            <td>{vehicle.Lane}</td>
                            <td>{vehicle.Headway_Distance}</td>
                            <td>{vehicle.Time_Gap}</td>
                            <td>{vehicle.Speed_Limit}</td>
                            <td>{formatValue(vehicle.Lane_Change)}</td>
                            <td>{formatValue(vehicle.Lane_Change_Reason)}</td>
                            <td>{formatValue(vehicle.Collision)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1, 'vehicle')}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span>
                      Page {currentPage} of {totalPages}
                      </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1, 'vehicle')}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <p>No data available</p>
              )}
            </div>
          )}
          {/* DP Vehicle Data */}
          {view === 'dp-vehicle-data' && (
            <div className="data-display">
              <h3>Differential Privacy Vehicle Data (Applied Epsilon: 5.0)</h3>

              {isDpLoading ? (
                <p>Loading data...</p>
              ) : dpVehicles.length > 0 ? (
                <>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Vehicle ID</th>
                          <th>Speed</th>
                          <th>Acceleration</th>
                          <th>Latitude</th>
                          <th>Longitude</th>
                          <th>Lane</th>
                          <th>Headway Distance</th>
                          <th>Time Gap</th>
                          <th>Speed Limit</th>
                          <th>Lane Change</th>
                          <th>Lane Change Reason</th>
                          <th>Collision</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dpVehicles.map((vehicle, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td>{vehicle.Time}</td>
                            <td>{vehicle.Vehicle_ID}</td>
                            <td>{vehicle.Speed}</td>
                            <td>{vehicle.Acceleration}</td>
                            <td>{vehicle.Latitude}</td>
                            <td>{vehicle.Longitude}</td>
                            <td>{vehicle.Lane}</td>
                            <td>{vehicle.Headway_Distance}</td>
                            <td>{vehicle.Time_Gap}</td>
                            <td>{vehicle.Speed_Limit}</td>
                            <td>{formatValue(vehicle.Lane_Change)}</td>
                            <td>{formatValue(vehicle.Lane_Change_Reason)}</td>
                            <td>{formatValue(vehicle.Collision)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pagination">
                    <button
                      onClick={() => handlePageChange(dpCurrentPage - 1, 'dp')}
                      disabled={dpCurrentPage === 1}
                    >
                      Previous
                    </button>
                    <span>
                      Page {dpCurrentPage} of {dpTotalPages}
                      </span>
                    <button
                      onClick={() => handlePageChange(dpCurrentPage + 1, 'dp')}
                      disabled={dpCurrentPage === dpTotalPages}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <p>No data available</p>
              )}
            </div>
          )}

          {/* Risk Score Table */}
          {view === "risk-scores" && (
            (riskScores.original || riskScores.dp) && (
              <div className="risk-scores-display">
                <h3>Risk Scores (Applied Epsilon: 5.0)</h3>
                <div className="risk-scores-container">
                  {/* Check if both original and dp are available */}
                  {(riskScores.original && riskScores.dp) && (
                    <>
                      <div className="risk-score-section">
                        <h4>Combined Risk Scores</h4>
                        <table>
                          <thead>
                            <tr>
                              <th>Vehicle_ID</th>
                              <th>Original_Risk_Score</th>
                              <th>DP_Risk_Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {riskScores.original.map((originalRow, index) => {
                              // Look for the corresponding dp row based on Vehicle_ID
                              const dpRow = riskScores.dp.find(dpRow => dpRow.Vehicle_ID === originalRow.Vehicle_ID);
                              return (
                                <tr key={index}>
                                  <td>{originalRow.Vehicle_ID}</td>
                                  <td>{originalRow.Risk_Score?.toString()}</td>
                                  {/* Check if dpRow exists and display the DP risk score */}
                                  <td>{dpRow ? dpRow.Risk_Score?.toString() : 'No DP Data'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="pagination">
                        <button
                          onClick={() => handlePageChange(riskCurrentPage - 1, 'risk')}
                          disabled={riskCurrentPage === 1}
                        >
                          Previous
                        </button>
                        <span>
                          Page {riskCurrentPage} of {riskTotalPages}
                          </span>
                        <button
                          onClick={() => handlePageChange(riskCurrentPage + 1, 'risk')}
                          disabled={riskCurrentPage === riskTotalPages}
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )}
                  </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Static Dashboard Flow Chart and Logs */}
      {view === "map" && (
        <div className="flow-log-container">
          <div className="flow-chart-container">
            <label>Static Dashboard Flow</label>
            <StaticDashboardFlow />
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