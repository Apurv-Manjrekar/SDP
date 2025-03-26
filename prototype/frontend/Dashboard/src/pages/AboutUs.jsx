import React from "react";
import ApurvManjrekarImage from "../assets/TeamPhotos/ApurvManjrekar.jpg";
import SaiAkavaramuImage from "../assets/TeamPhotos/SaiAkavaramu.png";
import VanshikaGuptaImage from "../assets/TeamPhotos/VanshikaGupta.png";
import IshanaMokashiImage from "../assets/TeamPhotos/IshanaMokashi.png";
import PeiqiLiImage from "../assets/TeamPhotos/PeiqiLi.jpg";
import AminSheikhImage from "../assets/TeamPhotos/AminSheikh.png";
import AmirHerzbergImage from "../assets/TeamPhotos/AmirHerzberg.jpg";

const AboutUs = () => {
    return (
      <div className="py-8 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">About Our Team</h1>
        <p className="text-lg text-gray-600 mb-12 text-center leading-relaxed">
          We are a group of Computer Science seniors at the University of Connecticut 
          passionate about Differential Privacy!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Team Member 1 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
            <img
              src={ApurvManjrekarImage}
              alt="Apurv Manjrekar"
              className="w-40 h-40 object-cover rounded-full mx-auto mb-4 border-4 border-blue-100"
            />
            <h2 className="text-xl font-semibold text-gray-800">Apurv Manjrekar (Team Lead & Developer)</h2>
            <p className="text-gray-600 mt-3">
              Oversees project direction and coordinates team efforts while contributing to core development.
            </p>
          </div>

          {/* Team Member 2 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
            <img
              src={SaiAkavaramuImage}
              alt="Sai Akavaramu"
              className="w-40 h-40 object-cover rounded-full mx-auto mb-4 border-4 border-blue-100"
            />
            <h2 className="text-xl font-semibold text-gray-800">Sai Akavaramu (Developer & Co-Lead)</h2>
            <p className="text-blue-600 font-medium mt-1">Developer & Co-Lead</p>
            <p className="text-gray-600 mt-3">
              Leads data processing implementation and ensures code quality across the project.
            </p>
          </div>

          {/* Team Member 3 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
            <img
              src={VanshikaGuptaImage}
              alt="Vanshika Gupta"
              className="w-40 h-40 object-cover rounded-full mx-auto mb-4 border-4 border-blue-100"
            />
            <h2 className="text-xl font-semibold text-gray-800">Vanshika Gupta (Developer & Researcher)</h2>
            <p className="text-gray-600 mt-3">
              Implements key frontend features and conducts research to inform our technical approach.
            </p>
          </div>

          {/* Team Member 4 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
            <img
              src={IshanaMokashiImage}
              alt="Ishana Mokashi"
              className="w-40 h-40 object-cover rounded-full mx-auto mb-4 border-4 border-blue-100"
            />
            <h2 className="text-xl font-semibold text-gray-800">Ishana Mokashi (Developer & Researcher)</h2>
            <p className="text-gray-600 mt-3">
              Focuses on algorithm development and performance optimization.
            </p>
          </div>

          {/* Team Member 5 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
            <img
              src={PeiqiLiImage}
              alt="Peiqi Li"
              className="w-40 h-40 object-cover rounded-full mx-auto mb-4 border-4 border-blue-100"
            />
            <h2 className="text-xl font-semibold text-gray-800">Peiqi Li (Developer & Researcher)</h2>
            <p className="text-gray-600 mt-3">
              Specializes in user interface implementation.
            </p>
          </div>

          {/* Team Member 6 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
            <img
              src={AminSheikhImage}
              alt="Amin Sheikh"
              className="w-40 h-40 object-cover rounded-full mx-auto mb-4 border-4 border-blue-100"
            />
            <h2 className="text-xl font-semibold text-gray-800">Amin Sheikh (Data Engineer & Project Manager)</h2>
            <p className="text-gray-600 mt-3">
              Manages project timelines and implemented risk score analysis.
            </p>
          </div>

        

          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Our Advisors</h1>
          
          {/* Professor */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
            <img
              src={AmirHerzbergImage}
              alt="Amir Herzberg"
              className="w-40 h-40 object-cover rounded-full mx-auto mb-4 border-4 border-blue-100"
            />
            <h2 className="text-xl font-semibold text-gray-800">Professor Herzberg (Faculty Advisor)</h2>
            <p className="text-gray-600 mt-3">
              Provides academic guidance and ensures the project meets educational objectives.
            </p>
          </div>

          {/* Mike Knas */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
            <img
              src={AminSheikhImage}
              alt="Mike Knas"
              className="w-40 h-40 object-cover rounded-full mx-auto mb-4 border-4 border-blue-100"
            />
            <h2 className="text-xl font-semibold text-gray-800">Mike Knas (Industry Mentor)</h2>
            <p className="text-gray-600 mt-3">
              Offers practical insights and helps bridge academic concepts with real-world applications.
            </p>
          </div>
          </div>
      </div>
    );
};

export default AboutUs;