import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const nodes = [
  {
    id: '1',
    position: { x: 0, y: 0 },
    data: { label: 'User opens Static Dashboard' },
    type: 'input',
  },
  {
    id: '2',
    position: { x: 250, y: 0 },
    data: { label: 'Frontend fetches vehicle data and displays it to the frontend' },
  },
  {
    id: '3',
    position: { x: 500, y: 0 },
    data: { label: 'Frontend fetches dp vehicle data and displays it to the frontend' },
  },
  {
    id: '4',
    position: { x: 750, y: 0 },
    data: { label: 'Frontend fetches risk score data and displays it to the frontend' },
  },
  {
    id: '5',
    position: { x: 250, y: 200 },
    data: { label: 'User chooses a specific vehicle' },
  },
  {
    id: '6',
    position: { x: 500, y: 200 },
    data: { label: 'Frontend fetches vehicle data for selected vehicle and displays it to the frontend' },
  },
  {
    id: '7',
    position: { x: 750, y: 200 },
    data: { label: 'Frontend fetches dp vehicle data for selected vehicle and displays it to the frontend' },
  },
  {
    id: '8',
    position: { x: 1000, y: 200 },
    data: { label: 'Frontend fetches risk score data for selected vehicle and displays it to the frontend' },
  },
  {
    id: '9',
    position: { x: 750, y: 400 },
    data: { label: 'Frontend fetches vehicle route for selected vehicle and displays it on frontend map' },
  },
];

const edges = [
  { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
  { id: 'e2-3', source: '2', target: '3', type: 'smoothstep' },
  { id: 'e3-4', source: '3', target: '4', type: 'smoothstep' },

  { id: 'e4-5', source: '4', target: '5', type: 'bezier' },

  { id: 'e5-6', source: '5', target: '6', type: 'smoothstep' },
  { id: 'e6-7', source: '6', target: '7', type: 'smoothstep' },
  { id: 'e7-8', source: '7', target: '8', type: 'smoothstep' },

  { id: 'e6-9', source: '6', target: '9', type: 'smoothstep' },
  { id: 'e7-9', source: '7', target: '9', type: 'smoothstep' },
];

const SimulationFlow = () => {
  return (
    <div style={{ height: '85%', width: '95%', marginTop: '2rem', border: '1px solid black', backgroundColor: '#e0e0e0' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.1} maxZoom={5}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default SimulationFlow;
