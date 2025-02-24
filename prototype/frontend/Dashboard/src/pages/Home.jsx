import React from "react";

const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col bg-gray-100">
      <h1 className="text-4xl font-bold">Welcome to the Differential Privacy Dashboard</h1>
      <p className="text-lg text-gray-700 mt-4">
        Learn how differential privacy protects data while maintaining statistical utility.
      </p>
    </div>
  );
};

export default Home;

// import React, { useState, useEffect } from "react";
// import { Routes, Route, Link } from "react-router-dom";
// import { MapContainer, TileLayer, Polyline } from "react-leaflet";
// import "leaflet/dist/leaflet.css";

// const API_URL = "http://localhost:8000";

// const Home = () => {
//   const [vehicles, setVehicles] = useState([]);
//   const [selectedVehicle, setSelectedVehicle] = useState("all");
//   const [riskScores, setRiskScores] = useState([]);
//   const [dpRiskScores, setDpRiskScores] = useState([]);
//   const [epsilon, setEpsilon] = useState(1.0);
//   const [isApplyingDp, setIsApplyingDp] = useState(false);

//   useEffect(() => {
//     fetch(`${API_URL}/vehicles`)
//       .then(res => res.json())
//       .then(data => setVehicles(data))
//       .catch(err => console.error("Error fetching vehicles:", err));

//     fetch(`${API_URL}/get-risk-score`)
//       .then(res => res.json())
//       .then(data => setRiskScores(data))
//       .catch(err => console.error("Error fetching risk scores:", err));

//     fetch(`${API_URL}/get-dp-risk-score`)
//       .then(res => res.json())
//       .then(data => setDpRiskScores(data))
//       .catch(err => console.error("Error fetching DP risk scores:", err));
//   }, []);

//   const handleApplyDp = async () => {
//     setIsApplyingDp(true);
//     await fetch(`${API_URL}/apply-dp`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ epsilon }),
//     });
//     setIsApplyingDp(false);
//   };

//   return (
//     <div className="container mx-auto p-6">
//       <h1 className="text-3xl font-bold text-center mb-6">Risk Dashboard</h1>
//       <button onClick={handleApplyDp} disabled={isApplyingDp} className="bg-blue-500 text-white px-4 py-2 rounded">
//         {isApplyingDp ? "Applying DP..." : "Apply Differential Privacy"}
//       </button>
//       <div className="mb-6">
//         <h2 className="text-xl font-bold">Risk Scores</h2>
//         <table className="w-full border-collapse border border-gray-300">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="border border-gray-300 p-2">Vehicle</th>
//               <th className="border border-gray-300 p-2">Risk Score</th>
//               <th className="border border-gray-300 p-2">DP Risk Score</th>
//             </tr>
//           </thead>
//           <tbody>
//             {riskScores.map((item, index) => (
//               <tr key={index}>
//                 <td className="border border-gray-300 p-2">{item.vehicle}</td>
//                 <td className="border border-gray-300 p-2">{item.risk_score}</td>
//                 <td className="border border-gray-300 p-2">{dpRiskScores[index]?.dp_risk_score || "N/A"}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// const StaticDashboard = () => {
//   const [tripData, setTripData] = useState([]);
//   useEffect(() => {
//     fetch(`${API_URL}/trip-data`)
//       .then(res => res.json())
//       .then(data => setTripData(data))
//       .catch(err => console.error("Error fetching trip data:", err));
//   }, []);
//   return (
//     <div className="container mx-auto p-6">
//       <h1 className="text-3xl font-bold text-center mb-6">Static Vehicle Risk Dashboard</h1>
//       <MapContainer center={[40.7128, -74.006]} zoom={12} className="h-96 w-full">
//         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//         {tripData.map((trip, index) => (
//           <Polyline key={index} positions={trip.coordinates} color="blue" />
//         ))}
//       </MapContainer>
//     </div>
//   );
// };

// const DynamicSimulation = () => {
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100">
//       <h1 className="text-4xl font-bold">Dynamic Simulation Coming Soon!</h1>
//     </div>
//   );
// };

// const App = () => {
//   return (
//     <div>
//       <nav className="bg-gray-800 p-4 text-white">
//         <div className="container mx-auto flex justify-between">
//           <h1 className="text-xl font-bold">Differential Privacy Dashboard</h1>
//           <div>
//             <Link to="/" className="px-4">Home</Link>
//             <Link to="/static-dashboard" className="px-4">Static Dashboard</Link>
//             <Link to="/dynamic-simulation" className="px-4">Dynamic Simulation</Link>
//           </div>
//         </div>
//       </nav>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/static-dashboard" element={<StaticDashboard />} />
//         <Route path="/dynamic-simulation" element={<DynamicSimulation />} />
//       </Routes>
//     </div>
//   );
// };

// export default App;
