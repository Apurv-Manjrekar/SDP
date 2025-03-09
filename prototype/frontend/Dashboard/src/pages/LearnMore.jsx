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
            Differential privacy is a framework for data analysis that allows meaningful insights to be drawn 
            from datasets while providing strong privacy guarantees. It ensures that the inclusion or exclusion 
            of a single individual in a dataset does not significantly affect the results of any analysis performed 
            on the dataset. Differential privacy is widely used in fields such as healthcare, finance, and social 
            sciences to balance data utility with privacy protection. It is a key technique in privacy-preserving 
            machine learning and data-sharing practices.
          `)}
        </p>
        <h2 className="text-2xl font-bold mt-6 mb-4">How It Works</h2>
        <p className="text-lg mb-4 whitespace-normal"> 
          {cleanText(`
            Differential privacy adds controlled noise to the data or the results of queries, making it difficult to determine whether any specific individual's data was used in the analysis. This noise is determined by a privacy budget (ε), which balances privacy and accuracy.

            Mathematically, a mechanism M satisfies ε-differential privacy if for all possible datasets D and D' differing by only one individual, and for all outputs S of M, the following holds:
            
            P(M(D) ∈ S) / P(M(D') ∈ S) ≤ e^ε
            
            Where:
            - ε (epsilon) is the privacy budget, controlling how much information can be leaked. A smaller ε provides stronger privacy.
            - The added noise is often drawn from a Laplace or Gaussian distribution, depending on the privacy model used.
            
            For example, in the Laplace mechanism, noise is drawn from a Laplace distribution with scale b, where:
            b = Δ𝑓 / ε
            
            Here, Δ𝑓 represents the sensitivity of the function 𝑓, measuring how much the function's output changes when one individual's data is added or removed.
            
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
