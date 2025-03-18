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
    data: { label: 'Backend runs SUMO & processes results' },
  },
  {
    id: '3',
    position: { x: 500, y: 0 },
    data: { label: 'Frontend receives vehicle data & routes' },
  },
  {
    id: '4',
    position: { x: 250, y: 100 },
    data: { label: 'User clicks "Apply Differential Privacy"' },
  },
  {
    id: '5',
    position: { x: 500, y: 100 },
    data: { label: 'Backend applies DP to data & sends back' },
  },
  {
    id: '6',
    position: { x: 250, y: 200 },
    data: { label: 'User clicks "Calculate Risk Scores"' },
  },
  {
    id: '7',
    position: { x: 500, y: 200 },
    data: { label: 'Backend calculates risk & sends results' },
  },
];

const edges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e4-5', source: '4', target: '5' },
  { id: 'e6-7', source: '6', target: '7' },
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
