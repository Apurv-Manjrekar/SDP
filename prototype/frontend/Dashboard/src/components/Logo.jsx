import React from 'react';
import { FireFilled } from '@ant-design/icons';
import HartfordLogo from "../assets/hartford-logo.png";
import UConnLogo from "../assets/uconn-logo.png";

const Logo = () => {
    return (
        <div>
            <div className="logo-icon">
                <img src={HartfordLogo} alt="Hartford" className="w-16 h-auto ml-1" />
                <img src={UConnLogo} alt="UConn" className="w-16 h-auto" />
            </div>
        </div>
    );
};

export default Logo;