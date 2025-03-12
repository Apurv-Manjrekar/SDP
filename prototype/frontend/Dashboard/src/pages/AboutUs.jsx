import React from "react";
import ApurvManjrekarImage from "../assets/TeamPhotos/ApurvManjrekar.jpg";
import SaiAkavaramuImage from "../assets/TeamPhotos/SaiAkavaramu.png";
import VanshikaGuptaImage from "../assets/TeamPhotos/VanshikaGupta.png";
import IshanaMokashiImage from "../assets/TeamPhotos/IshanaMokashi.png";
import PeiqiLiImage from "../assets/TeamPhotos/PeiqiLi.jpg";
import AminSheikhImage from "../assets/TeamPhotos/AminSheikh.png";
import { Link } from "react-router-dom";

const AboutUs = () => {
    return (
      <div style={{ 
        padding: '20px', 
        maxWidth: '800px', 
        margin: '0 auto', 
        textAlign: 'center' 
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>About Us</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '15px' }}>
        Welcome to our website! We are a team of passionate seniors styding computer science at the University of Connecticut!
        </p>

        {/* Team Member 1 */}
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <img
            src={ApurvManjrekarImage} // Placeholder image path
            alt="Team Member 1"
            className="w-32 h-32 rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold">Apruv Manjrekar</h2>
          <p className="text-gray-700 mt-2">
            Team Lead/Developer
          </p>
          <p className="text-gray-600 mt-2">
            <strong>Contribution:</strong> [Description of their contribution.]
          </p>
        </div>

         {/* Team Member 2 */}
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <img
            src={SaiAkavaramuImage} // Placeholder image path 
            alt="Team Member 2"
            className="w-20 h-20 rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold">Sai Akavaramu</h2>
          <p className="text-gray-700 mt-2">
            Developer/Co-Lead
          </p>
          <p className="text-gray-600 mt-2">
            <strong>Contribution:</strong> [Description of their contribution.]
          </p>
        </div>

        {/* Team Member 3 */}
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <img
            src={VanshikaGuptaImage} // Placeholder image path
            alt="Team Member 1"
            className="w-32 h-32 rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold">Vanshika Gupta</h2>
          <p className="text-gray-700 mt-2">
            Developer/Researcher
          </p>
          <p className="text-gray-600 mt-2">
            <strong>Contribution:</strong> [Description of their contribution.]
          </p>
        </div>

        {/* Team Member 4 */}
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <img
            src={IshanaMokashiImage} // Placeholder image path
            alt="Team Member 1"
            className="w-32 h-32 rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold">Ishana Mokashi</h2>
          <p className="text-gray-700 mt-2">
            Developer/Researcher
          </p>
          <p className="text-gray-600 mt-2">
            <strong>Contribution:</strong> [Description of their contribution.]
          </p>
        </div>

        {/* Team Member 5 */}
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <img
            src={PeiqiLiImage} // Placeholder image path
            alt="Team Member 1"
            className="w-32 h-32 rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold">Peiqi Li</h2>
          <p className="text-gray-700 mt-2">
            Developer/Researcher
          </p>
          <p className="text-gray-600 mt-2">
            <strong>Contribution:</strong> [Description of their contribution.]
          </p>
        </div>

        {/* Team Member 6 */}
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <img
            src={AminSheikhImage} // Placeholder image path
            alt="Team Member 1"
            className="w-32 h-32 rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold">Amin Sheikh</h2>
          <p className="text-gray-700 mt-2">
            Developer/Data Engineer/Project Manager
          </p>
          <p className="text-gray-600 mt-2">
            <strong>Contribution:</strong> [Description of their contribution.]
          </p>
        </div>

        {/* Professor */}
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <img
            src="/images/professor.jpg" // Placeholder image path
            alt="Professor"
            className="w-32 h-32 rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold">Professor Herzberg</h2>
          <p className="text-gray-700 mt-2">
            [Brief bio about the professor and their role in the project.]
          </p>
          <p className="text-gray-600 mt-2">
            <strong>Contribution:</strong> [Description of their contribution.]
          </p>
        </div>

        {/* Mike */}
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <img
            src="/images/mike.jpg" // Placeholder image path
            alt="Mike"
            className="w-32 h-32 rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold">Mike Knas</h2>
          <p className="text-gray-700 mt-2">
            [Brief bio about Mike and their role in the project.]
          </p>
          <p className="text-gray-600 mt-2">
            <strong>Contribution:</strong> [Description of their contribution.]
          </p>
        </div>


        
      </div>

      
    );
};

export default AboutUs;