import React from "react";

const WhyDifferentialPrivacy = () => {
  return (
    <div
      style={{
        padding: "4vw",
        maxWidth: "800px",
        margin: "auto",
        fontSize: "1.1rem",
        lineHeight: "1.6",
        textAlign: "center",
      }}
    >
      {/* <h1 style={{ fontSize: "2rem" }}>Why Differential Privacy?</h1> */}
      <p>
        The Hartford is exploring differential privacy to address the increasing
        importance of data protection and regulatory compliance in the insurance
        sector. As organizations collect and analyze vast amounts of customer
        and operational data, ensuring individual privacy without compromising
        analytical utility becomes a significant challenge. Differential privacy
        offers a robust mathematical framework that enables the sharing of
        valuable insights while safeguarding sensitive personal information.
      </p>
      <p>
        This approach is especially relevant for the insurance industry, where
        sensitive customer data is used for risk modeling, fraud detection, and
        product personalization. For example, if The Hartford wants to analyze
        vehicle telemetry data to improve pricing models, differential privacy
        allows for this analysis without exposing specific driver behaviors or
        identifiable information. By adding mathematical noise to the data,
        trends and patterns remain visible to analysts, while the privacy of
        individuals is preserved.
      </p>
      <p>
        The Hartford’s interest in differential privacy stems from its
        commitment to ethical data practices and its proactive stance on
        adapting to evolving data privacy standards. Implementing such
        privacy-preserving techniques can not only enhance trust with
        policyholders but also position the company as a leader in responsible
        data innovation.
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
  );
};

export default WhyDifferentialPrivacy;
