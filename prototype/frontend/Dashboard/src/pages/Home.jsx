import React from "react"; 
import { Link } from "react-router-dom";
import "./Info.css";

const Home = () => {
  return (
    <div className="info-container">
      <div className="info-content">
        {/* <h1 className="info-title">Welcome to the Differential Privacy Dashboard</h1> */}
        
        <p className="info-text">
          This platform is designed to help you understand and explore differential privacy, a technique that protects sensitive data while preserving statistical accuracy.
        </p>
        
        <h2 className="info-subtitle">What This Website Offers</h2>
        <ul className="info-list">
          <li>A large static pre-simulated vehicle telematics dataset to explore the application of differential privacy in the insurance space.</li>
          <li>A dynamic simulation for you to simulate your own vehicle trip and explore the effects of differential privacy.</li>
          <li>Statistical analysis visualizing the balance between privacy and data utility.</li>
          <li>The ability to learn more about differential privacy.</li>
        </ul>
        
        <h2 className="info-subtitle">How It Works</h2>
        <p className="info-text">
          Our prototype utilizes SUMO (Simulation of Urban Mobility) to simulate vehicle behavior and collect telemetry data. Once the data is processed 
          and cleaned, OpenMinded's PyDp (a Python wrapper for Google's Differential Privacy Library) is used to add noise to the data. 
          After this, risk scores are calculated for each vehicle. We then compare and analyze the risk scores with and without differential privacy.
        </p>
      </div>
    </div>
  );
};

export default Home;