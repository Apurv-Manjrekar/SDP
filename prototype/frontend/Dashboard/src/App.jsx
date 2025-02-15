import React, { useState, useEffect } from "react";

const RiskDashboard = () => {
  const [riskWithDP, setRiskWithDP] = useState(Math.random() * 100);
  const [riskWithoutDP, setRiskWithoutDP] = useState(Math.random() * 100);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
      <div className="w-full max-w-4xl flex flex-row gap-6">
        {/* Risk Score with Differential Privacy */}
        <div className="flex-1 bg-white p-6 rounded-2xl shadow-lg text-center">
          <h2 className="text-xl font-semibold mb-4">Risk Score with Differential Privacy</h2>
          <p className="text-4xl font-bold text-green-600">{riskWithDP.toFixed(2)}</p>
        </div>

        {/* Risk Score without Differential Privacy */}
        <div className="flex-1 bg-white p-6 rounded-2xl shadow-lg text-center">
          <h2 className="text-xl font-semibold mb-4">Risk Score without Differential Privacy</h2>
          <p className="text-4xl font-bold text-red-600">{riskWithoutDP.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return <RiskDashboard />;
};

export default App;
