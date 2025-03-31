import { Layout } from "antd";
import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Logo from "./components/Logo/Logo";
import HartfordLogo from "./assets/hartford-logo.png";
import UConnLogo from "./assets/uconn-logo.png";
import MenuList from "./components/MenuList/MenuList";
import Home from "./pages/Home";
import StaticDashboard from "./pages/StaticDashboard";
import DynamicSimulation from "./pages/DynamicSimulation";
import LearnMore from "./pages/LearnMore";
import AboutUs from './pages/AboutUs';
import WhatIsDifferentialPrivacy from "./pages/WhatIsDifferentialPrivacy";
import TheHartfordInterest from "./pages/TheHartfordInterest";
import DifferentEpsilon from "./pages/DifferentEpsilon";
import "./index.css";
import "./App.css";


const { Header, Sider, Content } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const renderHeaderContent = () => {
    console.log("Current Route:", location.pathname);
    if (location.pathname === "/") {
      return <h1>Welcome to SDP Team #49's Differential Privacy Prototype!</h1>;
    }
    if (location.pathname.includes("/static-dashboard")) {
      return <h1>Static Dashboard</h1>;
    }
    if (location.pathname.includes("/dynamic-simulation")) {
      return <h1>Dynamic Simulation</h1>;
    }
    if (location.pathname.includes("/learn-more")) {
      return <h1>Learn More</h1>;
    }
    if (location.pathname.includes("/about-us")) {
      return <h1>About Us</h1>;
    }
    if (location.pathname.includes("/what-is-differential-privacy")) {
      return <h1>What is Differential Privacy?</h1>;
    }
    if (location.pathname.includes("/the-hartford-interest")) {
      return <h1>The Hartford's Interest in Differential Privacy</h1>;
    }
    if (location.pathname.includes("/different-epsilon")) {
      return <h1>The Impact of Epsilon on Risk Scores</h1>;
    }
    return <h1>My Application</h1>;
  };

  return (
    <Layout>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} className="sidebar" width={'250px'} trigger={null}>
        <div className="logo-container">
        <Logo collapsed={collapsed} />
        </div>
        <MenuList />
        <div className="collapse-button" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? ">" : "<"}
        </div>
      </Sider>
      <Layout>
        <Content className={`content ${collapsed ? "expanded" : ""}`}>
          <Header className="header">
            <div className="header-content">
              {renderHeaderContent()} {/* Dynamically render content based on the route */}
            </div>
          </Header>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/static-dashboard" element={<StaticDashboard />} />
            <Route path="/dynamic-simulation" element={<DynamicSimulation />} />
            <Route path="/learn-more" element={<LearnMore />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/what-is-differential-privacy" element={<WhatIsDifferentialPrivacy />} />
            <Route path="/the-hartford-interest" element={<TheHartfordInterest />} />
            <Route path="/different-epsilon" element={<DifferentEpsilon />} />
          </Routes>
          <div className="footer">
            <img src={HartfordLogo} alt="Hartford" className="info-img" />
            <img src={UConnLogo} alt="UConn" className="info-img" />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;