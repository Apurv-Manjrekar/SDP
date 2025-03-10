import React, { createContext, useState } from "react";

export const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState([]);
  const [dpVehicles, setDpVehicles] = useState([]);
  const [riskScores, setRiskScores] = useState([]);
  const [dpRiskScores, setDpRiskScores] = useState([]);
  const [vehicleList, setVehicleList] = useState([]);
  const [dataCache, setDataCache] = useState({
    vehicleData: {},
    dpVehicleData: {},
    riskScores: {},
  });

  const value = {
    vehicles, setVehicles,
    dpVehicles, setDpVehicles,
    riskScores, setRiskScores,
    dpRiskScores, setDpRiskScores,
    vehicleList, setVehicleList,
    dataCache, setDataCache
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
