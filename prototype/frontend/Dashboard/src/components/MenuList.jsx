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
          <Link to="/static-dashboard">Raw Vehicle Data</Link>
        </Menu.Item>
        <Menu.Item key="dp-vehicle-data">DP Vehicle Data</Menu.Item>
        <Menu.Item key="risk-scores">Risk Scores</Menu.Item>
      </Menu.SubMenu>

      <Menu.SubMenu key="dynamic-simulation" icon={<HomeOutlined />} title="Dynamic Simulation">
        <Menu.Item key="run-simulation">
          <Link to="/dynamic-simulation">Run Simulation</Link>
        </Menu.Item>
        <Menu.Item key="raw-vehicle-data">Raw Vehicle Data</Menu.Item>
        <Menu.Item key="dp-vehicle-data">DP Vehicle Data</Menu.Item>
        <Menu.Item key="risk-scores">Risk Scores</Menu.Item>
      </Menu.SubMenu>

      <Menu.SubMenu key="differential-privacy" icon={<HomeOutlined />} title="Differential Privacy">
        <Menu.Item key="why-differential-privacy">
          Why Differential Privacy?
        </Menu.Item>
        <Menu.Item key="what-is-differential-privacy">
          What is Differential Privacy?
        </Menu.Item>
      </Menu.SubMenu>

      <Menu.Item key="about-us" icon={<HomeOutlined />}>
        About Us
      </Menu.Item>

    </Menu>
  );
};

export default MenuList;