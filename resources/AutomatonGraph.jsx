import { useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import StateNode from './nodes/StateNode';
import TransitionEdge from './edges/TransitionEdge';

const nodeTypes = { stateNode: StateNode };
const edgeTypes = { transition: TransitionEdge };

/**
 * Converts an Automaton object to React Flow nodes and edges.
 */
function automatonToFlow(automaton, prevNodes) {
  if (!automaton) return { nodes: [], edges: [] };

  const { states, transitions, startState, acceptStates } = automaton;
  const SPACING_X = 220;
  const SPACING_Y = 160;
  const COLS = Math.max(3, Math.ceil(Math.sqrt(states.length)));

  // Keep existing positions when possible (for drag persistence)
  const posMap = {};
  for (const n of prevNodes) posMap[n.id] = n.position;

  const nodes = states.map((state, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const isStart = state === startState;
    const isAccept = acceptStates.includes(state);

    let stateType = 'normal';
    if (isStart && isAccept) stateType = 'startAccept';
    else if (isStart) stateType = 'start';
    else if (isAccept) stateType = 'accept';

    return {
      id: state,
      type: 'stateNode',
      data: { label: state, stateType },
      position: posMap[state] ?? { x: col * SPACING_X + 50, y: row * SPACING_Y + 50 },
    };
  });

  const edgeMap = new Map();

  for (const [fromState, symbolMap] of Object.entries(transitions)) {
    for (const [symbol, targets] of Object.entries(symbolMap)) {
      for (const toState of targets) {
        const key = `${fromState}->${toState}`;
        if (edgeMap.has(key)) {
          edgeMap.get(key).labels.push(symbol);
        } else {
          edgeMap.set(key, { from: fromState, to: toState, labels: [symbol] });
        }
      }
    }
  }

  const edges = [];
  for (const [key, { from, to, labels }] of edgeMap) {
    const isSelfLoop = from === to;
    edges.push({
      id: key,
      source: from,
      target: to,
      type: 'transition',
      sourceHandle: isSelfLoop ? 'top-src' : undefined,
      targetHandle: isSelfLoop ? 'top' : undefined,
      data: { label: labels.join(', '), isSelfLoop },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#999',
        width: 16,
        height: 16,
      },
      style: { stroke: '#999', strokeWidth: 1.8 },
      animated: labels.includes('ε'),
    });
  }

  return { nodes, edges };
}

export default function AutomatonGraph({ automaton }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const prevNodesRef = useRef([]);

  useEffect(() => {
    if (!automaton) {
      setNodes([]);
      setEdges([]);
      prevNodesRef.current = [];
      return;
    }
    const { nodes: newNodes, edges: newEdges } = automatonToFlow(automaton, prevNodesRef.current);
    prevNodesRef.current = newNodes;
    setNodes(newNodes);
    setEdges(newEdges);
  }, [automaton, setNodes, setEdges]);

  if (!automaton) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <span className="text-3xl" role="img" aria-label="Search">🔍</span>
        <span className="text-sm font-medium">Enter a regex and click Generate to see the ε-NFA.</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
        attributionPosition="bottom-left"
        minZoom={0.2}
        maxZoom={2}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background color="#d0d0d0" gap={24} size={1.5} variant="dots" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
