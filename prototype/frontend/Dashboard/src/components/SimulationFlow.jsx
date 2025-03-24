import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const nodes = [
  {
    id: '1',
    position: { x: 0, y: 0 },
    data: { label: 'User clicks "Run Simulation"' },
    type: 'input',
  },
  {
    id: '2',
    position: { x: 250, y: 0 },
    data: { label: 'Backend runs SUMO simulation with user inputs' },
  },
  {
    id: '3',
    position: { x: 500, y: 0 },
    data: { label: 'Backend saves simulated vehicle data to local storage' },
  },
  {
    id: '4',
    position: { x: 750, y: 0 },
    data: { label: 'Frontend fetches vehicle data and displays it to the frontend' },
  },
  {
    id: '5',
    position: { x: 250, y: 100 },
    data: { label: 'User clicks "Apply Differential Privacy"' },
  },
  {
    id: '6',
    position: { x: 500, y: 100 },
    data: { label: 'Backend applies DP with the selected epsilon and saves the new data to local storage' },
  },
  {
    id: '7',
    position: { x: 750, y: 100 },
    data: { label: 'Frontend fetches DP vehicle data and displays it to the frontend' },
  },
  {
    id: '8',
    position: { x: 500, y: 200 },
    data: { label: 'User clicks "Calculate Risk Scores"' },
  },
  {
    id: '9',
    position: { x: 750, y: 200 },
    data: { label: 'Backend calculates risk score for both original and DP data and saves both to local storage' },
  },
  {
    id: '10',
    position: { x: 1000, y: 200 },
    data: { label: 'Frontend fetches risk scores and displays them to the frontend' },
  }
];

const edges = [
  { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
  { id: 'e2-3', source: '2', target: '3', type: 'smoothstep' },
  { id: 'e3-4', source: '3', target: '4', type: 'smoothstep' },
  { id: 'e4-5', source: '4', target: '5', type: 'bezier' },
  { id: 'e5-6', source: '5', target: '6', type: 'smoothstep' },
  { id: 'e6-7', source: '6', target: '7', type: 'smoothstep' },
  { id: 'e7-8', source: '7', target: '8', type: 'bezier' },
  { id: 'e8-9', source: '8', target: '9', type: 'smoothstep' },
  { id: 'e9-10', source: '9', target: '10', type: 'smoothstep' },
];

const SimulationFlow = () => {
  return (
    <div style={{ height: 400, width: '100%', marginTop: '2rem', border: '1px solid black', backgroundColor: '#e0e0e0' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default SimulationFlow;
