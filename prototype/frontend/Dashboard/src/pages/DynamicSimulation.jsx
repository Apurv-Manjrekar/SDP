import React, { useState, useEffect } from "react";

const DynamicSimulation = () => {
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [vehicleType, setVehicleType] = useState("car"); // Default to 'car'
  const [vehicleBehavior, setVehicleBehavior] = useState("normal"); // Default to 'normal'

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  return (
    <div>
      <h1>SUMO Simulation</h1>
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

      {error && <div style={{ color: "red" }}>Error: {error}</div>}
      {successMessage && <div style={{ color: "green" }}>{successMessage}</div>}
    </div>
  );
};

export default DynamicSimulation;