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
            <h2 className="text-xl font-semibold text-gray-800">Apurv Manjrekar</h2>
            <p className="text-blue-600 font-medium mt-1">Team Lead & Developer</p>
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
            <h2 className="text-xl font-semibold text-gray-800">Sai Akavaramu</h2>
            <p className="text-blue-600 font-medium mt-1">Developer & Co-Lead</p>
            <p className="text-gray-600 mt-3">
              Leads technical implementation and ensures code quality across the project.
            </p>
          </div>

          {/* Team Member 3 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
            <img
              src={VanshikaGuptaImage}
              alt="Vanshika Gupta"
              className="w-40 h-40 object-cover rounded-full mx-auto mb-4 border-4 border-blue-100"
            />
            <h2 className="text-xl font-semibold text-gray-800">Vanshika Gupta</h2>
            <p className="text-blue-600 font-medium mt-1">Developer & Researcher</p>
            <p className="text-gray-600 mt-3">
              Implements key features and conducts research to inform our technical approach.
            </p>
          </div>

          {/* Team Member 4 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
            <img
              src={IshanaMokashiImage}
              alt="Ishana Mokashi"
              className="w-40 h-40 object-cover rounded-full mx-auto mb-4 border-4 border-blue-100"
            />
            <h2 className="text-xl font-semibold text-gray-800">Ishana Mokashi</h2>
            <p className="text-blue-600 font-medium mt-1">Developer & Researcher</p>
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
            <h2 className="text-xl font-semibold text-gray-800">Peiqi Li</h2>
            <p className="text-blue-600 font-medium mt-1">Developer & Researcher</p>
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
            <h2 className="text-xl font-semibold text-gray-800">Amin Sheikh</h2>
            <p className="text-blue-600 font-medium mt-1">Data Engineer & Project Manager</p>
            <p className="text-gray-600 mt-3">
              Manages project timelines and implemented risk score analysis.
            </p>
          </div>
        </div>

        <div className="mt-16">
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">Our Advisors</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Professor */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
              <img
              src={AmirHerzbergImage}
              alt="Amir Herzberg"
              className="w-40 h-40 object-contain rounded-full mx-auto mb-4 border-4 border-blue-100 bg-gray-100"
              />
              <h2 className="text-xl font-semibold text-gray-800">Professor Herzberg</h2>
              <p className="text-blue-600 font-medium mt-1">Faculty Advisor</p>
              <p className="text-gray-600 mt-3">
                Provides academic guidance and ensures the project meets educational objectives.
              </p>
            </div>

            {/* Mike */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
              <div className="w-40 h-40 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-400">Mike Image</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Mike Knas</h2>
              <p className="text-blue-600 font-medium mt-1">Industry Mentor</p>
              <p className="text-gray-600 mt-3">
                Offers practical insights and helps bridge academic concepts with real-world applications.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
};

export default AboutUs;