import React from "react";
import { Link } from "react-router-dom";

const LearnMore = () => {
  const cleanText = (text) => {
    return text.replace(/\s+/g, " ").trim(); 
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 flex flex-col items-center">
      <div className="text-left max-w-2xl w-full"> 
        <h1 className="text-4xl font-bold mb-6">What is Differential Privacy?</h1>
        <p className="text-lg mb-4 whitespace-normal"> 
          {cleanText(`
            Differential privacy is a framework for data analysis that provides strong privacy guarantees. 
            It ensures that the inclusion or exclusion of a single individual in a dataset does not 
            significantly affect the results of any analysis performed on the dataset.
          `)}
        </p>
        <h2 className="text-2xl font-bold mt-6 mb-4">How It Works</h2>
        <p className="text-lg mb-4 whitespace-normal"> 
          {cleanText(`
            Differential privacy adds controlled noise to the data or the results of queries, making it 
            difficult to determine whether any specific individual's data was used in the analysis. This 
            noise is calibrated based on a privacy budget (epsilon), which controls the trade-off between 
            privacy and accuracy.
          `)}
        </p>
        <h2 className="text-2xl font-bold mt-6 mb-4">Using This Dashboard</h2>
        <p className="text-lg mb-4 whitespace-normal"> 
          {cleanText(`
            This dashboard allows you to explore vehicle simulation data with and without differential 
            privacy. You can compare risk scores, view vehicle trajectories, and adjust privacy parameters 
            to see how differential privacy affects the results.
          `)}
        </p>
        <Link to="/" className="text-blue-500 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

export default LearnMore;