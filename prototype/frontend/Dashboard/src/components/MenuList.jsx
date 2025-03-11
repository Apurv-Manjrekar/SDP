import React from "react";
import { Menu } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const MenuList = () => {
  return (
    <Menu mode="inline" className="menu-list">
      <Menu.Item key="home" icon={<HomeOutlined />}>
        <Link to="/">Home</Link>
      </Menu.Item>

      <Menu.SubMenu key="static-dashboard" icon={<HomeOutlined />} title="Static Dashboard">
        <Menu.Item key="raw-vehicle-data">
          <Link to="/static-dashboard/?view=raw-vehicle-data">Raw Vehicle Data</Link>
        </Menu.Item>
        <Menu.Item key="dp-vehicle-data">
          <Link to="/static-dashboard/?view=dp-vehicle-data">DP Vehicle Data</Link>
        </Menu.Item>
        <Menu.Item key="risk-scores">
          <Link to="/static-dashboard/?view=risk-scores">Risk Scores</Link>
        </Menu.Item>
      </Menu.SubMenu>

      <Menu.SubMenu key="dynamic-simulation" icon={<HomeOutlined />} title="Dynamic Simulation">
        <Menu.Item key="run-simulation">
          <Link to="/dynamic-simulation/?view=run-simulation">Run Simulation</Link>
        </Menu.Item>
        <Menu.Item key="raw-simulation-data">
          <Link to="/dynamic-simulation/?view=raw-simulation-data">Raw Simulation Data</Link>
        </Menu.Item>
        <Menu.Item key="dp-simulation-data">
          <Link to="/dynamic-simulation/?view=dp-simulation-data">DP Simulation Data</Link>
        </Menu.Item>
        <Menu.Item key="simulation-risk-scores">
          <Link to="/dynamic-simulation/?view=simulation-risk-scores">Simulation Risk Scores</Link>
        </Menu.Item>
      </Menu.SubMenu>

      <Menu.SubMenu key="differential-privacy" icon={<HomeOutlined />} title="Differential Privacy">
        <Menu.Item key="why-differential-privacy">
        <Link to="/why-differential-privacy">Why Differential Privacy?</Link>
        </Menu.Item>
        <Menu.Item key="what-is-differential-privacy">
        <Link to="/what-is-differential-privacy">What is Differential Privacy?</Link>
        </Menu.Item>
      </Menu.SubMenu>

      <Menu.Item key="about-us" icon={<HomeOutlined />}>
        About Us
      </Menu.Item>

    </Menu>
  );
};

export default MenuList;
