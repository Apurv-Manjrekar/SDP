import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";

const DynamicSimulation = () => {
  const [tripData, setTripData] = useState([]);
  const [riskScore, setRiskScore] = useState(null);

  // Fetch trip data and risk score from Flask API
  useEffect(() => {
    // Change this to the correct vehicle ID dynamically if needed
    const vehicleId = "vehicle123"; 

    const fetchData = async () => {
      try {
        // Fetch trip data from Flask backend
        const tripResponse = await fetch(`/api/trip/${vehicleId}`);
        const tripData = await tripResponse.json();

        // Fetch risk score from Flask backend
        const riskResponse = await fetch(`/api/risk_score/${vehicleId}`);
        const riskData = await riskResponse.json();

        setTripData(tripData);
        setRiskScore(riskData.risk_score);  // Assuming the response returns { risk_score: X }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-4xl font-bold mb-4">Dynamic Vehicle Simulation</h1>

      {/* Map Display */}
      <div className="w-full h-96 mb-6">
        <MapContainer center={[40.7128, -74.0060]} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {tripData.length > 0 && (
            <Polyline positions={tripData.map(d => [d.lat, d.lng])} color="blue" />
          )}
        </MapContainer>
      </div>

      {/* Risk Score */}
      <div className="text-lg font-semibold mb-4">
        <span className="text-gray-700">Risk Score:</span> 
        <span className="text-red-500">{riskScore !== null ? riskScore : "Loading..."}</span>
      </div>

      {/* Trip Data Table */}
      <div className="w-full max-w-4xl">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 border">Timestamp</th>
              <th className="px-4 py-2 border">Latitude</th>
              <th className="px-4 py-2 border">Longitude</th>
              <th className="px-4 py-2 border">Speed (km/h)</th>
            </tr>
          </thead>
          <tbody>
            {tripData.length > 0 ? (
              tripData.map((row, index) => (
                <tr key={index} className="text-center">
                  <td className="px-4 py-2 border">{row.timestamp}</td>
                  <td className="px-4 py-2 border">{row.lat}</td>
                  <td className="px-4 py-2 border">{row.lng}</td>
                  <td className={`px-4 py-2 border ${row.speed > 100 ? "text-red-500" : ""}`}>{row.speed}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4">No trip data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DynamicSimulation;
