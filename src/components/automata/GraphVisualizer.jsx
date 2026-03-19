import React, { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Node to match TOC Lab visuals
const StateNode = ({ data }) => {
  const { label, active, isAccept, isStart } = data;
  
  return (
    <div style={{
      width: 50, height: 50, borderRadius: '50%',
      background: active ? '#6366F1' : '#1F2937',
      border: isAccept 
        ? `6px double ${active ? '#818CF8' : '#6B7280'}` 
        : `2px solid ${active ? '#818CF8' : '#374151'}`,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      color: '#F9FAFB', fontFamily: 'Inter', fontSize: 14,
      boxShadow: active ? '0 0 15px rgba(99, 102, 241, 0.4)' : 'none',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      {label}
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      {isStart && <div style={{position: 'absolute', left: -30, fontSize: 12, color: '#9CA3AF'}}>Start &rarr;</div>}
    </div>
  );
};

const nodeTypes = { stateNode: StateNode };

const GraphVisualizer = ({ automaton, activeNode }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Transform automaton properties to React Flow graphs
  useEffect(() => {
    if (!automaton) return;

    const { states, transition, startState, acceptStates } = automaton;
    const SPACING_X = 150;
    const SPACING_Y = 150;
    const COLS = Math.max(3, Math.ceil(Math.sqrt(states.size)));

    // Preserve node positions if they were manipulated
    setNodes(nds => {
      const posMap = {};
      nds.forEach(n => { posMap[n.id] = n.position; });

      return Array.from(states).map((state, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const position = posMap[state] || { x: col * SPACING_X + 50, y: row * SPACING_Y + 50 };
        return {
          id: state,
          type: 'stateNode',
          position,
          data: { 
            label: state, 
            isStart: state === startState,
            isAccept: acceptStates.has(state),
            active: Array.isArray(activeNode) ? activeNode.includes(state) : state === activeNode
          }
        };
      });
    });

    // Structure Edges
    const edgeMap = new Map();
    for (const fromState in transition) {
      for (const symbol in transition[fromState]) {
        // In NFA it's an array of targets, in DFA it's a string. We normalize it.
        const targets = Array.isArray(transition[fromState][symbol]) ? transition[fromState][symbol] : [transition[fromState][symbol]];
        
        for (const toState of targets) {
          const key = `${fromState}->${toState}`;
          if (edgeMap.has(key)) edgeMap.get(key).labels.push(symbol);
          else edgeMap.set(key, { from: fromState, to: toState, labels: [symbol] });
        }
      }
    }

    const newEdges = [];
    for (const [key, { from, to, labels }] of edgeMap) {
      const isActive = Array.isArray(activeNode) ? activeNode.includes(from) : activeNode === from;
      newEdges.push({
        id: key,
        source: from,
        target: to,
        label: labels.join(', '),
        markerEnd: { type: MarkerType.ArrowClosed, color: '#9CA3AF' },
        style: { stroke: '#9CA3AF', strokeWidth: 2 },
        labelStyle: { fill: '#F9FAFB', fontSize: 14, fontFamily: 'Inter' },
        labelBgStyle: { fill: '#1F2937' },
        // Add animated flow when active
        animated: isActive
      });
    }
    setEdges(newEdges);
  }, [automaton]); // Rebuilds ONLY when the raw automaton algorithm logic changes

  // Update active states cleanly
  useEffect(() => {
    setNodes(nds => nds.map(n => {
      const isNodeActive = Array.isArray(activeNode) ? activeNode.includes(n.id) : n.id === activeNode;
      return {
        ...n,
        data: { ...n.data, active: isNodeActive }
      };
    }));
  }, [activeNode]);

  const onNodesChange = useCallback(changes => setNodes(nds => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback(changes => setEdges(eds => applyEdgeChanges(changes, eds)), []);

  return (
    <div className="graph-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#374151" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default GraphVisualizer;
