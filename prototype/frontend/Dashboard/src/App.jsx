import React, { useState, useEffect } from "react";

const RiskDashboard = () => {
  const [vehicleData, setVehicleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = "http://localhost:8000"; // Flask backend URL

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const response = await fetch(`${API_URL}/vehicle-data`);
        const data = await response.json();

        if (response.ok) {
          // Set the fetched data
          setVehicleData(data);
        } else {
          setError(data.error || "Failed to fetch data");
        }
      } catch (error) {
        setError("Error fetching data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-600">Loading data...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  if (vehicleData.length === 0) {
    return <p className="text-center text-gray-600">No vehicle data available</p>;
  }

  // Get the headers dynamically from the first vehicle's keys
  const headers = Object.keys(vehicleData[0]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
      <div className="w-full max-w-5xl bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold text-center mb-4">Vehicle Data</h2>

        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              {headers.map((header, index) => (
                <th key={index} className="border border-gray-300 p-2">
                  {header.replace(/_/g, " ")} {/* Optional: format headers */}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicleData.map((vehicle, index) => (
              <tr key={index} className="text-center">
                {headers.map((header, idx) => (
                  <td key={idx} className="border border-gray-300 p-2">
                    {vehicle[header] !== null && vehicle[header] !== undefined
                      ? vehicle[header].toString()
                      : "N/A"} {/* Display "N/A" for null or undefined */}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const App = () => {
  return <RiskDashboard />;
};

export default App;
