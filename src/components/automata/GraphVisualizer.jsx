import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ── Custom State Node ──────────────────────────────────────────────────────
const StateNode = ({ data }) => {
  const { label, active, isAccept, isStart, isReject } = data;

  let border, bg, shadow;
  if (active && isReject) {
    bg     = '#7F1D1D';
    border = '3px solid #EF4444';
    shadow = '0 0 16px rgba(239,68,68,0.55)';
  } else if (active && isAccept) {
    bg     = '#6366F1';
    border = '4px double #22C55E';
    shadow = '0 0 16px rgba(99,102,241,0.6)';
  } else if (active) {
    bg     = '#6366F1';
    border = '2px solid #818CF8';
    shadow = '0 0 16px rgba(99,102,241,0.6)';
  } else if (isAccept) {
    bg     = '#1F2937';
    border = '4px double #22C55E';
    shadow = 'none';
  } else {
    bg     = '#1F2937';
    border = '2px solid #374151';
    shadow = 'none';
  }

  return (
    <div style={{
      width: 50, height: 50, borderRadius: '50%',
      background: bg, border, boxShadow: shadow,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      color: '#F9FAFB', fontFamily: 'Inter', fontSize: 14,
      position: 'relative', transition: 'all 0.25s ease'
    }}>
      <Handle type="target" position={Position.Top}    style={{ visibility: 'hidden' }} />
      {label}
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      {isStart && (
        <div style={{
          position: 'absolute', left: -28, top: '50%',
          transform: 'translateY(-50%)', fontSize: 12, color: '#9CA3AF'
        }}>
          ▶
        </div>
      )}
    </div>
  );
};

// ── Custom PDA Edge (multiline labels + self-loop support) ─────────────────
const PdaEdge = ({
  id, source, target,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  data, markerEnd, style
}) => {
  const { rawLabel = '', isActive = false } = data || {};
  const isSelfLoop = source === target;

  let edgePath, labelX, labelY;

  if (isSelfLoop) {
    // Draw an arch above the node using the target (top) handle position
    const loopW = 32;
    const loopH = 55;
    const sx = targetX - loopW;
    const ex = targetX + loopW;
    const cy = targetY;
    edgePath = `M ${sx},${cy} C ${sx},${cy - loopH - 20} ${ex},${cy - loopH - 20} ${ex},${cy}`;
    labelX = targetX;
    labelY = cy - loopH - 18;
  } else {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition
    });
  }

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background:  isActive ? '#0C4A6E' : '#1F2937',
            color:       isActive ? '#A5F3FC' : '#E5E7EB',
            border:      `1px solid ${isActive ? '#67E8F9' : '#374151'}`,
            borderRadius: 4,
            padding:     '2px 6px',
            fontSize:    11,
            fontFamily:  'monospace',
            whiteSpace:  'pre',
            textAlign:   'center',
            lineHeight:  1.5,
            pointerEvents: 'none'
          }}
          className="nodrag nopan"
        >
          {rawLabel}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes = { stateNode: StateNode };
const edgeTypes = { pdaEdge: PdaEdge };

// ── GraphVisualizer ────────────────────────────────────────────────────────
const GraphVisualizer = ({ automaton, activeNode, activeEdge, rejectNodes }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Rebuild graph when automaton structure or activeEdge changes
  useEffect(() => {
    if (!automaton) return;

    const { states, startState, acceptStates } = automaton;
    const usePda = Array.isArray(automaton.edges);

    const SPACING_X = 150;
    const SPACING_Y = 150;
    const COLS = Math.max(3, Math.ceil(Math.sqrt(states.size)));

    // Rebuild nodes (positions preserved via posMap)
    setNodes(nds => {
      const posMap = {};
      nds.forEach(n => { posMap[n.id] = n.position; });

      return Array.from(states).map((state, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const pos = posMap[state] || { x: col * SPACING_X + 50, y: row * SPACING_Y + 50 };
        const isNodeActive = Array.isArray(activeNode)  ? activeNode.includes(state)  : state === activeNode;
        const isNodeReject = Array.isArray(rejectNodes) ? rejectNodes.includes(state) : state === rejectNodes;
        return {
          id: state, type: 'stateNode', position: pos,
          data: {
            label:    state,
            isStart:  state === startState,
            isAccept: acceptStates.has(state),
            active:   isNodeActive,
            isReject: isNodeActive && isNodeReject
          }
        };
      });
    });

    // Rebuild edges
    const newEdges = [];

    if (usePda) {
      // PDA mode — edges array with pre-formatted multiline labels
      automaton.edges.forEach(({ from, to, label }) => {
        const key = `${from}->${to}`;
        const isAct = !!(activeEdge && activeEdge.from === from && activeEdge.to === to);
        newEdges.push({
          id:    key,
          source: from,
          target: to,
          type:  'pdaEdge',
          data:  { rawLabel: label, isActive: isAct },
          markerEnd: { type: MarkerType.ArrowClosed, color: isAct ? '#67E8F9' : '#9CA3AF' },
          style: { stroke: isAct ? '#67E8F9' : '#9CA3AF', strokeWidth: isAct ? 3 : 2 },
          animated: isAct
        });
      });
    } else {
      // DFA / NFA mode — transition object
      const { transition } = automaton;
      const edgeMap = new Map();
      for (const fromState in transition) {
        for (const symbol in transition[fromState]) {
          const targets = Array.isArray(transition[fromState][symbol])
            ? transition[fromState][symbol]
            : [transition[fromState][symbol]];
          for (const toState of targets) {
            const key = `${fromState}->${toState}`;
            if (edgeMap.has(key)) edgeMap.get(key).labels.push(symbol);
            else edgeMap.set(key, { from: fromState, to: toState, labels: [symbol] });
          }
        }
      }
      for (const [key, { from, to, labels }] of edgeMap) {
        const isAct = Array.isArray(activeNode) ? activeNode.includes(from) : activeNode === from;
        newEdges.push({
          id: key, source: from, target: to,
          label: labels.join(', '),
          markerEnd: { type: MarkerType.ArrowClosed, color: '#9CA3AF' },
          style: { stroke: '#9CA3AF', strokeWidth: 2 },
          labelStyle: { fill: '#F9FAFB', fontSize: 14, fontFamily: 'Inter' },
          labelBgStyle: { fill: '#1F2937' },
          animated: isAct
        });
      }
    }

    setEdges(newEdges);
  }, [automaton, activeEdge]); // include activeEdge so PDA edges initialise correctly

  // Update node active / reject state without rebuilding positions
  useEffect(() => {
    setNodes(nds => nds.map(n => {
      const isNodeActive = Array.isArray(activeNode)  ? activeNode.includes(n.id)  : n.id === activeNode;
      const isNodeReject = Array.isArray(rejectNodes) ? rejectNodes.includes(n.id) : n.id === rejectNodes;
      return { ...n, data: { ...n.data, active: isNodeActive, isReject: isNodeActive && isNodeReject } };
    }));
  }, [activeNode, rejectNodes]);

  // Update edge highlight for PDA mode (cheap — no positional rebuild)
  useEffect(() => {
    setEdges(eds => eds.map(e => {
      if (e.type !== 'pdaEdge') return e;
      const isAct = !!(activeEdge && activeEdge.from === e.source && activeEdge.to === e.target);
      return {
        ...e,
        data:      { ...e.data, isActive: isAct },
        markerEnd: { type: MarkerType.ArrowClosed, color: isAct ? '#67E8F9' : '#9CA3AF' },
        style:     { stroke: isAct ? '#67E8F9' : '#9CA3AF', strokeWidth: isAct ? 3 : 2 },
        animated:  isAct
      };
    }));
  }, [activeEdge]);

  const onNodesChange = useCallback(changes => setNodes(nds => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback(changes => setEdges(eds => applyEdgeChanges(changes, eds)), []);

  return (
    <div className="graph-container" style={{ height: '100%', borderRadius: 0, border: 'none' }}>
      <style>{`
        .react-flow__controls {
          background: #1F2937;
          border: 1px solid #374151;
          border-radius: 6px;
          box-shadow: none;
        }
        .react-flow__controls-button {
          background: #1F2937;
          border-bottom: 1px solid #374151;
          color: #D1D5DB;
          fill: #D1D5DB;
        }
        .react-flow__controls-button:hover {
          background: #374151;
        }
        .react-flow__controls-button svg {
          fill: #D1D5DB;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background color="#374151" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default GraphVisualizer;
