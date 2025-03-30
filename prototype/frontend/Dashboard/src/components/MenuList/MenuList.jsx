import React from "react";
import { Menu } from "antd";
import { HomeOutlined, DatabaseOutlined, LineChartOutlined, InfoCircleOutlined, TeamOutlined, DotChartOutlined,
  WarningOutlined, DashboardOutlined, ControlOutlined, CompassOutlined, CloudServerOutlined, QuestionCircleOutlined, 
  BulbOutlined
 } from "@ant-design/icons";
import { Link } from "react-router-dom";
import "./MenuList.css";

const MenuList = () => {
  return (
    <Menu mode="inline" className="menu-list">
      <Menu.Item key="home" icon={<HomeOutlined />}>
        <Link to="/">Home</Link>
      </Menu.Item>

      <Menu.SubMenu key="static-dashboard" icon={<DashboardOutlined />} title="Static Dashboard">
        <Menu.Item key="map" icon={<CompassOutlined />}>
          <Link to="/static-dashboard/?view=map">Map</Link>
        </Menu.Item>
        <Menu.Item key="raw-vehicle-data" icon={<DatabaseOutlined />}>
          <Link to="/static-dashboard/?view=raw-vehicle-data">Raw Vehicle Data</Link>
        </Menu.Item>
        <Menu.Item key="dp-vehicle-data" icon={<CloudServerOutlined />}>
          <Link to="/static-dashboard/?view=dp-vehicle-data">DP Vehicle Data</Link>
        </Menu.Item>
        <Menu.Item key="risk-scores" icon={<WarningOutlined />}>
          <Link to="/static-dashboard/?view=risk-scores">Risk Scores</Link>
        </Menu.Item>
      </Menu.SubMenu>

      <Menu.SubMenu key="dynamic-simulation" icon={<DotChartOutlined />} title="Dynamic Simulation">
        <Menu.Item key="run-simulation" icon={<ControlOutlined />}>
          <Link to="/dynamic-simulation/?view=run-simulation">Run Simulation</Link>
        </Menu.Item>
        <Menu.Item key="raw-simulation-data" icon={<DatabaseOutlined />}>
          <Link to="/dynamic-simulation/?view=raw-simulation-data">Raw Simulation Data</Link>
        </Menu.Item>
        <Menu.Item key="dp-simulation-data" icon={<CloudServerOutlined />}>
          <Link to="/dynamic-simulation/?view=dp-simulation-data">DP Simulation Data</Link>
        </Menu.Item>
        <Menu.Item key="simulation-risk-scores" icon={<WarningOutlined />}>
          <Link to="/dynamic-simulation/?view=simulation-risk-scores">Simulation Risk Scores</Link>
        </Menu.Item>
      </Menu.SubMenu>

      <Menu.SubMenu key="differential-privacy" icon={<InfoCircleOutlined />} title="Differential Privacy">
        <Menu.Item key="why-differential-privacy" icon={<QuestionCircleOutlined />}>
        <Link to="/why-differential-privacy">Why Differential Privacy?</Link>
        </Menu.Item>
        <Menu.Item key="what-is-differential-privacy" icon={<BulbOutlined />}>
        <Link to="/what-is-differential-privacy">What is Differential Privacy?</Link>
        </Menu.Item>
      </Menu.SubMenu>

      <Menu.Item key="different-epsilon" icon={<LineChartOutlined />}>
        <Link to="/different-epsilon">Different Epsilon Data</Link>
      </Menu.Item>

      <Menu.Item key="about-us" icon={<TeamOutlined />}>
        <Link to="/about-us">About Us</Link>
      </Menu.Item>

    </Menu>
  );
};

export default MenuList;
