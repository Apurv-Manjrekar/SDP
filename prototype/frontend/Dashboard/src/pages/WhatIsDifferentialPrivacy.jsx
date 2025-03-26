import React from "react";

const WhatIsDifferentialPrivacy = () => {
  return (
    <div
      style={{
        padding: "4vw",
        maxWidth: "800px",
        margin: "auto",
        fontSize: "1.1rem",
        lineHeight: "1.6",
      }}
    >
      <h1 style={{ fontSize: "2rem", textAlign: "center" }}>
        What is Differential Privacy?
      </h1>
      <p>
        Differential Privacy is a powerful technique used to protect personal
        data while still enabling meaningful insights from datasets. It works by
        introducing a small amount of mathematical "noise" into data queries or
        results, making it nearly impossible to identify any individual person
        within the dataset. For example, a company analyzing customer behavior
        might use differential privacy to understand shopping trends without
        revealing specific purchase histories. This way, organizations can make
        data-driven decisions without compromising individual privacy.
      </p>
      <p>
        A well-known example of this in action is <strong>Apple</strong>, which
        uses differential privacy to collect usage patterns from iPhones without
        tracking users individually. <strong>The U.S. Census Bureau</strong> also
        adopted differential privacy in the 2020 Census to protect citizens’ data
        while still producing accurate population statistics.
      </p>
      <p>
        In simple terms, think of it like blurring a photo just enough so that
        you can see the shapes and patterns, but not identify anyone in it.
        That’s what differential privacy does with data—it keeps the big picture
        clear while keeping individual identities hidden.
      </p>

      <h2 style={{ fontSize: "1.5rem", marginTop: "2rem" }}>Key Features</h2>
      <ul style={{ paddingLeft: "20px", listStyleType: "disc" }}>
        <li>Ensures individual privacy while providing useful insights.</li>
        <li>Uses mathematical noise to obfuscate sensitive data.</li>
        <li>Prevents attackers from inferring private information.</li>
      </ul>

      <h2 style={{ fontSize: "1.5rem", marginTop: "2rem" }}>Applications</h2>
      <p>
        Differential Privacy is used in industries like healthcare, finance, and
        machine learning to protect user data while allowing statistical analysis.
        It also helps organizations comply with privacy regulations such as GDPR
        and HIPAA, while maintaining user trust and transparency.
      </p>
    </div>
  );
};

export default WhatIsDifferentialPrivacy;
