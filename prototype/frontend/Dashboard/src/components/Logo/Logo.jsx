import React from 'react';
import { FireFilled } from '@ant-design/icons';
import HartfordLogo from "../../assets/hartford-logo.png";
import UConnLogo from "../../assets/uconn-logo.png";
import "./Logo.css";

const Logo = () => {
    return (
        <div>
            <div className="logo">
                <img src={HartfordLogo} alt="Hartford" className="logo-icon" />
                <img src={UConnLogo} alt="UConn" className="logo-icon" />
            </div>
        </div>
    );
};

export default Logo;