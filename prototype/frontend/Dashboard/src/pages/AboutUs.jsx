import React from "react";
import ApurvManjrekarImage from "../assets/TeamPhotos/ApurvManjrekar.jpg";
import SaiAkavaramuImage from "../assets/TeamPhotos/SaiAkavaramu.png";
import VanshikaGuptaImage from "../assets/TeamPhotos/VanshikaGupta.png";
import IshanaMokashiImage from "../assets/TeamPhotos/IshanaMokashi.png";
import PeiqiLiImage from "../assets/TeamPhotos/PeiqiLi.jpg";
import AminSheikhImage from "../assets/TeamPhotos/AminSheikh.png";
import AmirHerzbergImage from "../assets/TeamPhotos/AmirHerzberg.jpg";
import MikeKnasImage from "../assets/TeamPhotos/MikeKnas.jpg";
import "./AboutUs.css"

const AboutUs = () => {
  return (
    <div className="about-us-container">
      {/* <h1 className="about-us-title">About Our Team</h1> */}
      <p className="about-us-description">
        We are a group of Computer Science seniors at the University of Connecticut 
        passionate about Differential Privacy!
      </p>

      <div className="team-grid">
        {/* Apurv Manjrekar */}
        <div className="team-card">
          <div className="image-container">
            <img
              src={ApurvManjrekarImage}
              alt="Apurv Manjrekar"
              className="team-image"
            />
          </div>
          <h2 className="member-name">Apurv Manjrekar</h2>
          <p className="member-role">Team Lead & Developer</p>
          <p className="member-description">
            Oversees project direction and coordinates team efforts while contributing to core development. Plans to work as a Data Engineer at Travelers after graduation.
          </p>
        </div>

        {/* Sai Akavaramu */}
        <div className="team-card">
          <div className="image-container">
            <img
              src={SaiAkavaramuImage}
              alt="Sai Akavaramu"
              className="team-image"
            />
          </div>
          <h2 className="member-name">Sai Akavaramu</h2>
          <p className="member-role">Developer & Co-Lead</p>
          <p className="member-description">
            Leads data processing implementation and coordinates project timelines to ensure on-time delivery. After graduation, will join Bank of America as a Software Engineer.
          </p>
        </div>

        {/* Vanshika Gupta */}
        <div className="team-card">
          <div className="image-container">
            <img
              src={VanshikaGuptaImage}
              alt="Vanshika Gupta"
              className="team-image"
            />
          </div>
          <h2 className="member-name">Vanshika Gupta</h2>
          <p className="member-role">Developer & Researcher</p>
          <p className="member-description">
            Implements key frontend features and conducts research to inform our technical approach. Plans to study a Masters in Computer Science after a gap year.
          </p>
        </div>

        {/* Ishana Mokashi */}
        <div className="team-card">
          <div className="image-container">
            <img
              src={IshanaMokashiImage}
              alt="Ishana Mokashi"
              className="team-image"
            />
          </div>
          <h2 className="member-name">Ishana Mokashi</h2>
          <p className="member-role">Developer & Researcher</p>
          <p className="member-description">
            Focuses on differential privacy implementation and performance optimization. After graduation, plans to work as a Business Analyst at Journey Blazers.
          </p>
        </div>

        {/* Peiqi Li */}
        <div className="team-card">
          <div className="image-container">
            <img
              src={PeiqiLiImage}
              alt="Peiqi Li"
              className="team-image"
            />
          </div>
          <h2 className="member-name">Peiqi Li</h2>
          <p className="member-role">Developer & Researcher</p>
          <p className="member-description">
            Specializes in frontend development and UI implementation. Plans to study AI applications for game design post graduation.
          </p>
        </div>

        {/* Amin Sheikh */}
        <div className="team-card">
          <div className="image-container">
            <img
              src={AminSheikhImage}
              alt="Amin Sheikh"
              className="team-image"
            />
          </div>
          <h2 className="member-name">Amin Sheikh</h2>
          <p className="member-role">Data Engineer & Project Manager</p>
          <p className="member-description">
            Implements risk score analysis into workflow pipeline. After graduation, plans to work as a Data Analyst at AT&T.
          </p>
        </div>
      </div>

      <h1 className="advisors-title">Our Advisors</h1>
      
      <div className="advisor-cards-container">
        {/* Amir Herzberg */}
        <div className="advisor-card">
          <div className="image-container">
            <img
              src={AmirHerzbergImage}
              alt="Professor Herzberg"
              className="team-image"
            />
          </div>
          <h2 className="member-name">Professor Herzberg</h2>
          <p className="advisor-role">Faculty Advisor</p>
          <p className="advisor-description">
            Comcast Professor for Cybersecurity Innovation at UConn's School of Computing.
            Expert in internet security, applied cryptography, and privacy with a Ph.D. from Technion (Israel).
            Former researcher at IBM Research and professor at Bar Ilan University.
            Provides academic guidance and ensures the project meets educational objectives.
          </p>
        </div>

        {/* Mike Knas */}
        <div className="advisor-card">
          <div className="image-container">
            <img
              src={MikeKnasImage}
              alt="Mike Knas"
              className="team-image"
            />
          </div>
          <h2 className="member-name">Mike Knas</h2>
          <p className="advisor-role">Industry Mentor</p>
          <p className="advisor-description">
            Assistant Vice President of Emerging Technology & Innovation at The Hartford.
            Brings expertise in emerging technologies, design thinking, and patented solutions to bridge academic research with real-world applications.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;