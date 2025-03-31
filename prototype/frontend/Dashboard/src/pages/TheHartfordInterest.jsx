import React from "react";
import "./Info.css";

const WhyDifferentialPrivacy = () => {
  return (
    <div className="info-container">
      <div className="info-content">
        {/* <h1 style={{ fontSize: "2rem" }}>Why Differential Privacy?</h1> */}
        
        <h2 className="info-subtitle">The Hartford's Mission</h2>
        
        <p className="info-text">
        Searching for new ways to help our customers as they pursue their goals and ambitions has driven the innovation and ingenuity that mark The Hartford’s 214-year history. 
        Our technology organization has created a culture of innovation by leaning into new technologies in collaboration with academia. 
        Together, we experiment with emerging technologies and academia to develop knowledge.

        While a few years away from maturity, we wanted to understand how Differential Privacy works and how it may unlock value for our customers.
        </p>

        <h2 className="info-subtitle">Benefits to The Hartford</h2>
        <p className="info-text">
          The Hartford is exploring differential privacy to address the increasing
          importance of data protection and regulatory compliance in the insurance
          sector. As organizations collect and analyze vast amounts of customer
          and operational data, ensuring individual privacy without compromising
          analytical utility becomes a significant challenge. Differential privacy
          offers a robust mathematical framework that enables the sharing of
          valuable insights while safeguarding sensitive personal information.
        </p>

        <h2 className="info-subtitle">Relevance to the Insurance Industry</h2>
        <p className="info-text">
          This approach is especially relevant for the insurance industry, where
          sensitive customer data is used for risk modeling, fraud detection, and
          product personalization. For example, if The Hartford wants to analyze
          vehicle telemetry data to improve pricing models, differential privacy
          allows for this analysis without exposing specific driver behaviors or
          identifiable information. By adding mathematical noise to the data,
          trends and patterns remain visible to analysts, while the privacy of
          individuals is preserved.
        </p>

        {/* Image Section */}
        <img
          src="/public/DALLE2025-03-2600.00.44-Adigitalillustrationdepictingdataprivacyintheinsuranceindustry.Theimagefeaturesashieldwithalocksymbolinthecenterrepresentingda-ezgif.com-webp-to-jpg-converter.jpg"
          alt="Data Privacy in Insurance"
          style={{
            width: "100%",
            maxWidth: "600px",
            height: "auto",
            marginTop: "20px",
            borderRadius: "8px",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        />
      </div>
    </div>
  );
};

export default WhyDifferentialPrivacy;
