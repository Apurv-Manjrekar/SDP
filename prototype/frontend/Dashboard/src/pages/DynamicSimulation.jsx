import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap, Circle, Tooltip, CircleMarker, Rectangle } from "react-leaflet";
import { useLocation } from "react-router-dom";
import L from "leaflet";
import "./DynamicSimulation.css";
import "./DashboardStyles.css";
import 'leaflet/dist/leaflet.css';
import SimulationFlow from '../components/SimulationFlow/SimulationFlow';

const DynamicSimulation = () => {
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [vehicleType, setVehicleType] = useState("car"); // Default to 'car'
  const [vehicleBehavior, setVehicleBehavior] = useState("normal"); // Default to 'normal'
  const [vehicleRoute, setVehicleRoute] = useState([]);
  const [dpVehicleRoute, setDpVehicleRoute] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [vehicleList, setVehicleList] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [vehicleData, setVehicleData] = useState([]);
  const [dpVehicleData, setDpVehicleData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isApplyingDP, setIsApplyingDP] = useState(false);
  const [isDpApplied, setIsDpApplied] = useState(false);
  const [isCalculatingRisk, setIsCalculatingRisk] = useState(false);
  const [riskScores, setRiskScores] = useState({ original: null, dp: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [dpCurrentPage, setDpCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dpTotalPages, setDpTotalPages] = useState(1);

  const [epsilon, setEpsilon] = useState(5)

  const [usedDpEpsilon, setDpUsedEpsilon] = useState(5)
  const [usedRiskEpsilon, setRiskUsedEpsilon] = useState(5)

  const [logs, setLogs] = useState([]);

  const handleLogUpdate = (newLogs) => {
    // Update the logs state by appending new logs
    setLogs(prevLogs => [...prevLogs, ...newLogs]);
    // remove any empty logs
    setLogs(prevLogs => prevLogs.filter(log => log.trim() !== ""));
  };

  const sumoBounds = [
    [41.645520, -72.797705], // SW corner
    [41.888833, -72.553847], // NE corner
  ];


  const useQuery = () => new URLSearchParams(useLocation().search);
  const query = useQuery();
  const view = query.get("view"); // e.g., "raw-vehicle-data"


  useEffect(() => {
    fetchVehicleList();
  }, [successMessage]);

  const fetchVehicleList = async () => {
    try {
      const functionRoute = "http://localhost:8000/dynamic-vehicle-list";
      const encodedFunctionRoute = encodeURIComponent(functionRoute);

      const response = await fetch(`http://localhost:8000/call-function?function_route=${encodedFunctionRoute}`);
      if (response.ok) {
        const result = await response.json();
        if (result.log_output && result.log_output.length > 0) {
          const newLogs = result.log_output.split('\n');
          handleLogUpdate(newLogs);
        }
        console.log("LOG: ", logs);
        const data = result.function_response;
        setVehicleList(["Create New Vehicle", ...data]);
        if (data.length > 0 && !selectedVehicle) {
          setSelectedVehicle(data[0].id);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch vehicle list:", errorData.error);
      }
    } catch (err) {
      console.error("Error fetching vehicle list:", err);
    }
  };

  useEffect(() => {
    if (selectedVehicle === "Create New Vehicle") {
      setStartPoint("");
      setEndPoint("");
      setVehicleType("car"); // Default to 'car'
      setVehicleBehavior("normal"); // Default to 'normal'
      setVehicleData([]);
      setVehicleRoute([]);
      setDpVehicleRoute([]);
      // setIsDpApplied(false);
      setDpVehicleData([]);
      setRiskScores({ original: null, dp: null });
    }
    else if (selectedVehicle) {
      fetchVehicleData();
      fetchVechicleRoute();
      setDpVehicleRoute([]);
      fetchDpVehicleRoute();
      // setIsDpApplied(false);
      setDpVehicleData([]);
      fetchDpVehicleData();
      setRiskScores({ original: null, dp: null });
      fetchRiskScores();
    }
  }, [selectedVehicle, currentPage, dpCurrentPage, isDpApplied]);

  useEffect(() => {
    if (!selectedVehicle) return;
    setCurrentPage(1);
    setDpCurrentPage(1);
    if (selectedVehicle.includes("veh_passenger")) {
      setVehicleType("car");
    } else if (selectedVehicle.includes("truck_truck")) {
      setVehicleType("truck");
    } else if (selectedVehicle.includes("motorcycle_motorcycle")) {
      setVehicleType("motorcycle");
    }
    if (selectedVehicle.includes("aggressive")) {
      setVehicleBehavior("aggressive");
    } else if (selectedVehicle.includes("cautious")) {
      setVehicleBehavior("cautious");
    } else {
      setVehicleBehavior("normal");
    }
  }, [selectedVehicle]);

  const fetchVehicleData = async () => {
    if (!selectedVehicle || selectedVehicle === "Create New Vehicle") return;
    
    setIsLoadingData(true);
    try {
      const functionRoute = `http://localhost:8000/vehicle-data?dynamic=true&data_file=${selectedVehicle}&page=${currentPage}&per_page=50`;
      const encodedFunctionRoute = encodeURIComponent(functionRoute);

      const response = await fetch(
        `http://localhost:8000/call-function?function_route=${encodedFunctionRoute}`

        // `http://localhost:8000/vehicle-data?dynamic=true&data_file=${selectedVehicle}&page=${currentPage}&per_page=50`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.log_output && result.log_output.length > 0) {
          const newLogs = result.log_output.split('\n');
          handleLogUpdate(newLogs);
        }
        console.log("LOG: ", logs);
        console.log("Received Logs:", result.log_output);
        const data = result.function_response;

        setVehicleData(data.data);
        setTotalPages(data.pagination.total_pages);
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch vehicle data:", errorData.error);
      }
    } catch (err) {
      console.error("Error fetching vehicle data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchVechicleRoute = async () => {
    if (!selectedVehicle || selectedVehicle === "Create New Vehicle") return;
    
    setIsLoadingData(true);
    try {
      const functionRoute = `http://localhost:8000/vehicle-route?dynamic=true&data_file=${selectedVehicle}`;
      const encodedFunctionRoute = encodeURIComponent(functionRoute);
      const response = await fetch(
        `http://localhost:8000/call-function?function_route=${encodedFunctionRoute}`
        // `http://localhost:8000/vehicle-route?dynamic=true&data_file=${selectedVehicle}`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.log_output && result.log_output.length > 0) {
          const newLogs = result.log_output.split('\n');
          handleLogUpdate(newLogs);
        }
        console.log("LOG: ", logs);
        const data = result.function_response;
        if (data.data && data.data.length > 0) {
          const route = data.data
            .filter(point => point.Latitude !== undefined && point.Longitude !== undefined)
            .map(point => ({
              lat: Number(point.Latitude),
              lng: Number(point.Longitude),
              speed: point.Speed ?? null,
              acceleration: point.Acceleration ?? null,
              timeGap: point["Time_Gap"] ?? null
            }));
          setVehicleRoute(route);
          console.log("Vehicle route received:", data.data);
          console.log("Filtered route data:", route);
          if (route.length > 0) {
            setStartPoint([route[0].lat, route[0].lng]);
            setEndPoint([route[route.length - 1].lat, route[route.length - 1].lng]);
          }
        } else {
          setVehicleRoute([]);
          setStartPoint("");
          setEndPoint("");
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch vehicle route:", errorData.error);
        setVehicleRoute([]);
        setStartPoint("");
        setEndPoint("");
      }
    } catch (err) {
      console.error("Error fetching vehicle route:", err);
      setVehicleRoute([]);
      setStartPoint("");
      setEndPoint("");
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchDpVehicleRoute = async () => {
    if (!selectedVehicle || selectedVehicle === "Create New Vehicle") return;
    
    setIsLoadingData(true);
    try {
      const dpFileName = `dp_${selectedVehicle}`;

      const functionRoute = `http://localhost:8000/vehicle-route?dynamic=true&data_file=${dpFileName}`;
      const encodedFunctionRoute = encodeURIComponent(functionRoute);
      const response = await fetch(
        `http://localhost:8000/call-function?function_route=${encodedFunctionRoute}`
        // `http://localhost:8000/vehicle-route?dynamic=true&data_file=${dpFileName}`
      );
      if (response.ok) {
        setIsDpApplied(true);
        const result = await response.json();
        if (result.log_output && result.log_output.length > 0) {
          const newLogs = result.log_output.split('\n');
          handleLogUpdate(newLogs);
        }
        console.log("LOG: ", logs);
        const data = result.function_response;
        if (data.data && data.data.length > 0) {
          const route = data.data
            .filter(point => point.Latitude !== undefined && point.Longitude !== undefined)
            .map(point => ({
              lat: Number(point.Latitude),
              lng: Number(point.Longitude),
              speed: point.Speed ?? null,
              acceleration: point.Acceleration ?? null,
              timeGap: point["Time_Gap"] ?? null
            }));
          setDpVehicleRoute(route);
          console.log("DP vehicle route received:", data.data);
          console.log("Filtered DP route data:", route);
        } else {
          setDpVehicleRoute([]);
        }
      } else {
        setIsDpApplied(false);
        const errorData = await response.json();
        console.error("Failed to fetch DP vehicle route:", errorData.error);
        setDpVehicleRoute([]);
      }
    } catch (err) {
      console.error("Error fetching DP vehicle route:", err);
      setDpVehicleRoute([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    console.log("Current vehicleRoute state:", vehicleRoute);
    console.log("Current dpVehicleRoute state:", dpVehicleRoute);
  }, [vehicleRoute, dpVehicleRoute]);

  const fetchDpVehicleData = async () => {
    if (!selectedVehicle || selectedVehicle === "Create New Vehicle") return;
    
    setIsLoadingData(true);
    try {
      const dpFileName = `dp_${selectedVehicle}`;

      const functionRoute = `http://localhost:8000/vehicle-data?dynamic=true&data_file=${dpFileName}&page=${dpCurrentPage}&per_page=50`;
      const encodedFunctionRoute = encodeURIComponent(functionRoute);
      const response = await fetch(
        `http://localhost:8000/call-function?function_route=${encodedFunctionRoute}`
        // `http://localhost:8000/vehicle-data?dynamic=true&data_file=${dpFileName}&page=${dpCurrentPage}&per_page=50`
      );
      if (response.ok) {
        setIsDpApplied(true);
        const result = await response.json();
        if (result.log_output && result.log_output.length > 0) {
          const newLogs = result.log_output.split('\n');
          handleLogUpdate(newLogs);
        }
        console.log("LOG: ", logs);
        const data = result.function_response;
        setDpVehicleData(data.data);
        setDpTotalPages(data.pagination.total_pages)
        setDpUsedEpsilon(data.epsilon)
        setIsDpApplied(true)
      } else {
        setIsDpApplied(false);
        const errorData = await response.json();
        console.error("Failed to fetch DP vehicle data:", errorData.error, "Make sure you have applied DP!");
        setDpVehicleData([]);
      }
    } catch (err) {
      console.error("Error fetching DP vehicle data:", err);
      setDpVehicleData([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isDpApplied) {
      fetchDpVehicleData();
    }
  }, [dpCurrentPage]);

  const applyDifferentialPrivacy = async () => {
    if (!selectedVehicle) return;

    setIsDpApplied(false);
    
    setIsApplyingDP(true);
    try {
      const functionRoute = `http://localhost:8000/apply-dp`;
      const response = await fetch("http://localhost:8000/call-function", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          function_route: functionRoute,
          payload: {
            dynamic: true,
            data_file: selectedVehicle,
            epsilon: epsilon.toString(),
          }
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.log_output && result.log_output.length > 0) {
          const newLogs = result.log_output.split('\n');
          handleLogUpdate(newLogs);
        }
        console.log("LOG: ", logs);
        setSuccessMessage("Differential privacy applied successfully.");
        setIsDpApplied(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to apply differential privacy.");
      }
    } catch (err) {
      setError("Error applying differential privacy.");
    } finally {
      setIsApplyingDP(false);
      fetchDpVehicleData();
      fetchDpVehicleRoute();
    }
  };

  const calculateRiskScores = async () => {
    if (!selectedVehicle || selectedVehicle === "Create New Vehicle") {
      setError("Please select a vehicle first.");
      return;
    }
    
    setIsCalculatingRisk(true);
    try {
      const functionRoute = `http://localhost:8000/calculate-risk-score`;
      const response = await fetch("http://localhost:8000/call-function", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          function_route: functionRoute,
          payload: {
            dynamic: true,
            data_file: selectedVehicle
          }
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.log_output && result.log_output.length > 0) {
          const newLogs = result.log_output.split('\n');
          handleLogUpdate(newLogs);
        }
        console.log("LOG: ", logs);
        setSuccessMessage("Risk scores calculated successfully.");
        fetchRiskScores();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to calculate risk scores.");
      }
    } catch (err) {
      setError("Error calculating risk scores.");
    } finally {
      setIsCalculatingRisk(false);
      fetchRiskScores();
    }
  };

  const fetchRiskScores = async () => {
    if (!selectedVehicle) return;
    
    try {
      const functionRoute = `http://localhost:8000/get-risk-score?dynamic=true&data_file=${selectedVehicle}`;
      const encodedFunctionRoute = encodeURIComponent(functionRoute);
      const response = await fetch(
        `http://localhost:8000/call-function?function_route=${encodedFunctionRoute}`
        // `http://localhost:8000/get-risk-score?dynamic=true&data_file=${selectedVehicle}`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.log_output && result.log_output.length > 0) {
          const newLogs = result.log_output.split('\n');
          handleLogUpdate(newLogs);
        }
        console.log("LOG: ", logs);
        const data = result.function_response;
        setRiskScores(data.data);
        console.log("Risk scores received:", data.data);
        setRiskUsedEpsilon(data.epsilon)
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch risk scores:", errorData.error);
        setRiskScores({ original: null, dp: null });
      }
    } catch (err) {
      console.error("Error fetching risk scores:", err);
      setRiskScores({ original: null, dp: null });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    const requestData = {
      start_point: startPoint,
      end_point: endPoint,
      vehicle_type: vehicleType,
      vehicle_behavior: vehicleBehavior,
    };

    const functionRoute = "http://localhost:8000/run-simulation";

    try {
      const response = await fetch("http://localhost:8000/call-function", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          function_route: functionRoute,
          payload: requestData
        }),
      });

      const result = await response.json();
      if (result.log_output && result.log_output.length > 0) {
        const newLogs = result.log_output.split('\n');
        handleLogUpdate(newLogs);
      }
      console.log("LOG: ", logs);
      const data = result.function_response;

      if (response.ok) {
        setSuccessMessage("Simulation completed successfully.");
      } else {
        setError(data.error || "An error occurred during the simulation.");
      }
    } catch (err) {
      setError("Failed to communicate with the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage, type) => {
    if (type === 'vehicle' && newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    } else if (type === 'dp' && newPage >= 1 && newPage <= dpTotalPages) {
      setDpCurrentPage(newPage);
    }
  };

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
        lat: dpPoint.lat,
        lng: dpPoint.lng,
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
          map.fitBounds(bounds, { padding: [5, 5] });
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
      {/* <h1>SUMO Simulation</h1> */}
      <div className="simulation-content">
        {/* Map Section */}
        {view === "run-simulation" && (
          <div className="map-wrapper">
            <div className="map-container">
              <MapContainer
                className="map"
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
                  pathOptions={{ color: 'black', weight: 2, fillOpacity: 0 }}
                />
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
                          <div style={{ fontSize: "2vh" }}>
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

                {/* {dpVehicleRoute.length > 1 && <MapBoundsFitter route={dpVehicleRoute} />} 
                {dpVehicleRoute.length > 1 && (
                  <Polyline positions={dpVehicleRoute} color="red" weight={3} />
                )} */}
              </MapContainer>
            </div>
          </div>
        )}
        {/* Simulation Form */}
        {view === "run-simulation" && (
          <div className="simulation-form-container">
            <h2>Run Simulation</h2>
            <form className="simulation-form" onSubmit={handleSubmit}>
              <div>
                <label>
                  Start Point:
                  <input
                    type="text"
                    value={startPoint}
                    onChange={(e) => setStartPoint(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div>
                <label>
                  End Point:
                  <input
                    type="text"
                    value={endPoint}
                    onChange={(e) => setEndPoint(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div>
                <label>
                  Vehicle Type:
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                  >
                    <option value="car">Car</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="truck">Truck</option>
                  </select>
                </label>
              </div>
              <div>
                <label>
                  Vehicle Behavior:
                  <select
                    value={vehicleBehavior}
                    onChange={(e) => setVehicleBehavior(e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="aggressive">Aggressive</option>
                    <option value="cautious">Cautious</option>
                  </select>
                </label>
              </div>
              <div>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? "Running Simulation..." : "Run Simulation"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Vehicle Selection Section */}
      <div className="selection-container">
        {/* <h2>Vehicle Data</h2> */}
        <div className="selector">
          <label>
            Select Vehicle: 
          </label>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            disabled={vehicleList.length === 0}
          >
            {vehicleList.length === 0 ? (
              <option value="">No vehicles available</option>
            ) : (
              vehicleList.map((vehicle) => (
                <option key={vehicle} value={vehicle}>
                  {vehicle}
                </option>
              ))
            )}
          </select>
        </div>
        {/* Epsilon and Apply DP (only for DP view) */}
        {view === "dp-simulation-data" && (
          <div className="dp-controls">
            <label htmlFor="epsilon-slider">Epsilon (Differential Privacy): {epsilon}</label>
            <input
              type="range"
              id="epsilon-slider"
              min="0.1"
              max="10"
              step="0.1"
              value={epsilon}
              onChange={(e) => setEpsilon(parseFloat(e.target.value))}
            />
            <button
              onClick={applyDifferentialPrivacy}
              disabled={!selectedVehicle || isApplyingDP}
            >
              {isApplyingDP ? "Applying DP..." : "Apply Differential Privacy"}
            </button>
          </div>
        )}

        {/* Risk Score Button (only for Risk view) */}
        {view === "simulation-risk-scores" && (
          <div className="risk-controls">
            <button
              onClick={calculateRiskScores}
              disabled={!isDpApplied || isCalculatingRisk}
            >
              {isCalculatingRisk ? "Calculating..." : "Calculate Risk Scores"}
            </button>
          </div>
        )}
      </div>

      {/* Vehicle Data Section */}
      {view !== "run-simulation" && selectedVehicle && selectedVehicle !== "Create New Vehicle" && (
        <div className="data-container">
      
          {/* Display Original Data */}
          {view === "raw-simulation-data" && (
            selectedVehicle && (
              <div className="data-display">
                <h3>Original Vehicle Data</h3>
                {isLoadingData ? (
                  <p>Loading data...</p>
                ) : vehicleData.length > 0 ? (
                  <>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th >Time</th>
                            <th >Vehicle ID</th>
                            <th >Speed</th>
                            <th >Acceleration</th>
                            <th >Latitude</th>
                            <th >Longitude</th>
                            <th >Lane</th>
                            <th>Headway Distance</th>
                            <th >Time Gap</th>
                            <th >Speed Limit</th>
                            <th>Lane Change</th>
                            <th>Lane Change Reason</th>
                            <th>Collision</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicleData.map((vehicle, idx) => (
                          <tr key={idx}>
                            <td >{vehicle.Time}</td>
                            <td >{vehicle.Vehicle_ID}</td>
                            <td >{vehicle.Speed}</td>
                            <td >{vehicle.Acceleration}</td>
                            <td>{vehicle.Latitude}</td>
                            <td>{vehicle.Longitude}</td>
                            <td >{vehicle.Lane}</td>
                            <td >{vehicle.Headway_Distance}</td>
                            <td >{vehicle.Time_Gap}</td>
                            <td >{vehicle.Speed_Limit}</td>
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
                  <p>No data available.</p>
                )}
              </div>
            )
          )}

          {/* Display DP Data */}
          {view === "dp-simulation-data" && (
            isDpApplied && (
              <div className="data-display">
                <h3>Differential Privacy Vehicle Data (Applied Epsilon: {usedDpEpsilon})</h3>
                {isLoadingData ? (
                  <p>Loading data...</p>
                ) : dpVehicleData.length > 0 ? (
                  <>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th >Time</th>
                            <th >Vehicle ID</th>
                            <th >Speed</th>
                            <th >Acceleration</th>
                            <th >Latitude</th>
                            <th >Longitude</th>
                            <th >Lane</th>
                            <th>Headway Distance</th>
                            <th >Time Gap</th>
                            <th >Speed Limit</th>
                            <th>Lane Change</th>
                            <th>Lane Change Reason</th>
                            <th>Collision</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dpVehicleData.map((vehicle, idx) => (
                          <tr key={idx}>
                            <td >{vehicle.Time}</td>
                            <td >{vehicle.Vehicle_ID}</td>
                            <td >{vehicle.Speed}</td>
                            <td >{vehicle.Acceleration}</td>
                            <td>{vehicle.Latitude}</td>
                            <td>{vehicle.Longitude}</td>
                            <td >{vehicle.Lane}</td>
                            <td >{vehicle.Headway_Distance}</td>
                            <td >{vehicle.Time_Gap}</td>
                            <td >{vehicle.Speed_Limit}</td>
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
                  <p>No DP data available.</p>
                )}
              </div>
            )
          )}

          {/* Display Risk Scores */}
          {view === "simulation-risk-scores" && (
            (riskScores.original || riskScores.dp) && (
              <div className="risk-scores-display">
                <h3>Risk Scores (Applied Epsilon: {usedRiskEpsilon})</h3>
                <div className="risk-scores-container">
                  {/* Check if both original and dp are available */}
                  {(riskScores.original && riskScores.dp) && (
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
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Flow Chart and Logs */}
      {view === "run-simulation" && (
        <div className="flow-log-container">
          <div className="flow-chart-container">
              <label>Simulation Flow</label>
              <SimulationFlow/>
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

      {error && <div style={{ color: "red" }}>Error: {error}</div>}
      {successMessage && <div style={{ color: "green" }}>{successMessage}</div>}
    </div>
  );
};

export default DynamicSimulation;