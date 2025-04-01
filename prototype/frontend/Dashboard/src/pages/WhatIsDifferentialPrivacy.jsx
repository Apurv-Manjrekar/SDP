import React from "react";
import "./Info.css"; // Import styles for the component

// Component to explain Differential Privacy
const WhatIsDifferentialPrivacy = () => {
  return (
    <div className="info-container">
      <div className="info-content">
        {/* Main content about Differential Privacy */}

        {/* Heading (commented out) 
        <h1 style={{ fontSize: "2rem", textAlign: "center" }}>
          What is Differential Privacy?
        </h1> 
        */}

        {/* Introduction paragraph explaining Differential Privacy */}
        <p className="info-text">
          Differential Privacy is a powerful technique used to protect personal
          data while still enabling meaningful insights from datasets. It works by
          introducing a small amount of mathematical "noise" into data queries or
          results, making it nearly impossible to identify any individual person
          within the dataset. For example, a company analyzing customer behavior
          might use differential privacy to understand shopping trends without
          revealing specific purchase histories. This way, organizations can make
          data-driven decisions without compromising individual privacy.
        </p>

        {/* Example section */}
        <h2 className="info-subtitle">An Example</h2>
        <p className="info-text">
          A well-known example of this in action is <strong>Apple</strong>, which
          uses differential privacy to collect usage patterns from iPhones without
          tracking users individually. <strong>The U.S. Census Bureau</strong> also
          adopted differential privacy in the 2020 Census to protect citizens’ data
          while still producing accurate population statistics.
        </p>
        <p className="info-text">
          In simple terms, think of it like blurring a photo just enough so that
          you can see the shapes and patterns, but not identify anyone in it.
          That’s what differential privacy does with data—it keeps the big picture
          clear while keeping individual identities hidden.
        </p>

        {/* Key features section */}
        <h2 className="info-subtitle">Key Features</h2>
        <ul className="info-list" style={{ position: "relative", left: "22.5%" }}>
          <li>Ensures individual privacy while providing useful insights.</li>
          <li>Uses mathematical noise to obfuscate sensitive data.</li>
          <li>Prevents attackers from inferring private information.</li>
        </ul>

        {/* Applications section */}
        <h2 className="info-subtitle">Applications</h2>
        <p className="info-text">
          Differential Privacy is used in industries like healthcare, finance, and
          machine learning to protect user data while allowing statistical analysis.
          It also helps organizations comply with privacy regulations such as GDPR
          and HIPAA, while maintaining user trust and transparency.
        </p>
      </div>
    </div>
  );
};

export default WhatIsDifferentialPrivacy; // Export the component for use in other files
