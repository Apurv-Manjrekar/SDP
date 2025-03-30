import { Layout } from "antd";
import { Routes, Route, useLocation } from "react-router-dom";
import Logo from "./components/Logo/Logo";
import MenuList from "./components/MenuList/MenuList";
import Home from "./pages/Home";
import StaticDashboard from "./pages/StaticDashboard";
import DynamicSimulation from "./pages/DynamicSimulation";
import LearnMore from "./pages/LearnMore";
import AboutUs from './pages/AboutUs';
import WhatIsDifferentialPrivacy from "./pages/WhatIsDifferentialPrivacy";
import WhyDifferentialPrivacy from "./pages/WhyDifferentialPrivacy";
import DifferentEpsilon from "./pages/DifferentEpsilon";
import "./index.css";
import "./App.css";


const { Header, Sider, Content } = Layout;

const App = () => {
  const location = useLocation();
  const renderHeaderContent = () => {
    console.log("Current Route:", location.pathname);
    if (location.pathname === "/") {
      return <h1>Welcome to the Home Page</h1>;
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
    if (location.pathname.includes("/why-differential-privacy")) {
      return <h1>Why Differential Privacy?</h1>;
    }
    if (location.pathname.includes("/different-epsilon")) {
      return <h1>The Impact of Epsilon on Risk Scores</h1>;
    }
    return <h1>My Application</h1>;
  };

  return (
    <Layout>
      <Sider className="sidebar" width={'250px'}>
        <div className="logo-container">
          <Logo />
        </div>
        <MenuList />
      </Sider>
      <Layout>
        <Content className="content">
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
            <Route path="/why-differential-privacy" element={<WhyDifferentialPrivacy />} />
            <Route path="/different-epsilon" element={<DifferentEpsilon />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;