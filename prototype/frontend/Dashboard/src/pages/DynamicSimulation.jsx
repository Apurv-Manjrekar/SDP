import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from "react-leaflet";
import { useLocation } from "react-router-dom";
import L from "leaflet";
import "./DynamicSimulation.css";
import 'leaflet/dist/leaflet.css';

const DynamicSimulation = () => {
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [vehicleType, setVehicleType] = useState("car"); // Default to 'car'
  const [vehicleBehavior, setVehicleBehavior] = useState("normal"); // Default to 'normal'
  const [vehicleRoute, setVehicleRoute] = useState([]);

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
      const response = await fetch("http://localhost:8000/dynamic-vehicle-list");
      if (response.ok) {
        const data = await response.json();
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
      setIsDpApplied(false);
      setDpVehicleData([]);
      setRiskScores({ original: null, dp: null });
    }
    else if (selectedVehicle) {
      fetchVehicleData();
      fetchVechicleRoute();
      setIsDpApplied(false);
      setDpVehicleData([]);
      fetchDpVehicleData();
      setRiskScores({ original: null, dp: null });
      fetchRiskScores();
    }
  }, [selectedVehicle, currentPage, dpCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setDpCurrentPage(1);
  }, [selectedVehicle]);

  const fetchVehicleData = async () => {
    if (!selectedVehicle || selectedVehicle === "Create New Vehicle") return;
    
    setIsLoadingData(true);
    try {
      const response = await fetch(
        `http://localhost:8000/vehicle-data?dynamic=true&data_file=${selectedVehicle}&page=${currentPage}&per_page=50`
      );
      if (response.ok) {
        const data = await response.json();
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
      const response = await fetch(
        `http://localhost:8000/vehicle-route?dynamic=true&data_file=${selectedVehicle}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const route = data.data
            .filter(point => point.Latitude !== undefined && point.Longitude !== undefined)
            .map(point => [Number(point.Latitude), Number(point.Longitude)]);
          setVehicleRoute(route);
          console.log("Vehicle route received:", data.data);
          console.log("Filtered route data:", route);
          if (route.length > 0) {
            setStartPoint(route[0]);
            setEndPoint(route[route.length - 1]);
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

  useEffect(() => {
    console.log("Current vehicleRoute state:", vehicleRoute);
  }, [vehicleRoute]);

  const fetchDpVehicleData = async () => {
    if (!selectedVehicle || !isDpApplied || selectedVehicle === "Create New Vehicle") return;
    
    setIsLoadingData(true);
    try {
      const dpFileName = `dp_${selectedVehicle}`;
      const response = await fetch(
        `http://localhost:8000/vehicle-data?dynamic=true&data_file=${dpFileName}&page=${dpCurrentPage}&per_page=50`
      );
      if (response.ok) {
        const data = await response.json();
        setDpVehicleData(data.data);
        setDpTotalPages(data.pagination.total_pages)
        setIsDpApplied(true)
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch DP vehicle data:", errorData.error);
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
  }, [isDpApplied, dpCurrentPage]);

  const applyDifferentialPrivacy = async () => {
    if (!selectedVehicle) return;

    setIsDpApplied(false);
    
    setIsApplyingDP(true);
    try {
      const response = await fetch("http://localhost:8000/apply-dp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dynamic: true,
          data_file: selectedVehicle,
          epsilon: epsilon.toString(),
        }),
      });
      
      if (response.ok) {
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
    }
  };

  const calculateRiskScores = async () => {
    if (!selectedVehicle || !isDpApplied || selectedVehicle === "Create New Vehicle") {
      setError("You must apply differential privacy before calculating risk scores.");
      return;
    }
    
    setIsCalculatingRisk(true);
    try {
      const response = await fetch("http://localhost:8000/calculate-risk-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dynamic: true,
          data_file: selectedVehicle,
        }),
      });
      
      if (response.ok) {
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
    }
  };

  const fetchRiskScores = async () => {
    if (!selectedVehicle) return;
    
    try {
      const response = await fetch(
        `http://localhost:8000/get-risk-score?dynamic=true&data_file=${selectedVehicle}`
      );
      if (response.ok) {
        const data = await response.json();
        setRiskScores(data);
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

    try {
      const response = await fetch("http://localhost:8000/run-simulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage("Simulation completed successfully.");
      } else {
        setError(result.error || "An error occurred during the simulation.");
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
        map.fitBounds(bounds, { padding: [20, 20] }); // Fit exactly without extra space
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
    <div className="simulation-container">
      <h1>SUMO Simulation</h1>
      <div className="simulation-content">
        {/* Map Section */}
        {view === "run-simulation" && (
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
                {vehicleRoute.length > 1 && (
                  <Polyline positions={vehicleRoute} color="blue" weight={3} />
                )}
              </MapContainer>
            </div>
          </div>
        )}
        {/* Simulation Form */}
        {view === "run-simulation" && (
          <div className="simulation-form">
            <h2>Run Simulation</h2>
            <form onSubmit={handleSubmit}>
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

        {/* Vehicle Data Section */}
        <div className="vehicle-data-section">
          <h2>Vehicle Data</h2>
          <div className="vehicle-selector">
            <label>
              Select Vehicle:
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
            </label>
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
              <button
                onClick={calculateRiskScores}
                disabled={!isDpApplied || isCalculatingRisk}
              >
                {isCalculatingRisk ? "Calculating..." : "Calculate Risk Scores"}
              </button>
            )}
          </div>

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
                            {Object.keys(vehicleData[0]).map((key) => (
                              <th key={key}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {vehicleData.map((row, index) => (
                            <tr key={index}>
                              {Object.values(row).map((value, i) => (
                                <td key={i}>{value?.toString()}</td>
                              ))}
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
                <h3>Differential Privacy Vehicle Data</h3>
                {isLoadingData ? (
                  <p>Loading data...</p>
                ) : dpVehicleData.length > 0 ? (
                  <>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            {Object.keys(dpVehicleData[0]).map((key) => (
                              <th key={key}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dpVehicleData.map((row, index) => (
                            <tr key={index}>
                              {Object.values(row).map((value, i) => (
                                <td key={i}>{value?.toString()}</td>
                              ))}
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
                <h3>Risk Scores</h3>
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

        {error && <div style={{ color: "red" }}>Error: {error}</div>}
        {successMessage && <div style={{ color: "green" }}>{successMessage}</div>}
      </div>
    // </div>
  );
};

export default DynamicSimulation;