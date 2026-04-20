import { useEffect, useState, useCallback, useMemo, memo } from 'react';
/* eslint-disable react-hooks/set-state-in-effect */
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
const StateNode = memo(({ data }) => {
  const { label, active, isAccept, isStart, isReject, isDead = false, activeCount = 0 } = data;
  const isMultiActive = active && activeCount > 1;

  let border, bg, shadow;
  if (isDead) {
    bg = '#111827';
    border = '2px dashed #6B7280';
    shadow = active ? '0 0 12px rgba(107,114,128,0.45)' : 'none';
  } else if (active && isReject) {
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
    shadow = isMultiActive ? '0 0 22px rgba(56,189,248,0.85)' : '0 0 16px rgba(99,102,241,0.6)';
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
      position: 'relative', transition: 'all 0.25s ease',
      animation: isMultiActive ? 'multiActivePulse 1.2s ease-in-out infinite' : 'none'
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
});

// ── Custom PDA Edge (multiline labels + self-loop support) ─────────────────
const PdaEdge = memo(({
  id, source, target,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  data, markerEnd, style
}) => {
  const { rawLabel = '', isActive = false, curvature = 0, isEpsilon = false, leadsToAccept = false } = data || {};
  const isSelfLoop = source === target;

  let edgePath, labelX, labelY;

  if (isSelfLoop) {
    // Draw a loop that leaves and returns to the same node boundary.
    // targetX/targetY is near the top handle; infer node center from that.
    const nodeRadius = 25;
    const centerX = targetX;
    const centerY = targetY + nodeRadius;

    const startAngle = (235 * Math.PI) / 180; // upper-left boundary point
    const endAngle = (305 * Math.PI) / 180;   // upper-right boundary point

    const sx = centerX + nodeRadius * Math.cos(startAngle);
    const sy = centerY + nodeRadius * Math.sin(startAngle);
    const ex = centerX + nodeRadius * Math.cos(endAngle);
    const ey = centerY + nodeRadius * Math.sin(endAngle);

    const c1x = sx - 8;
    const c1y = sy - 34;
    const c2x = ex + 8;
    const c2y = ey - 34;

    edgePath = `M ${sx},${sy} C ${c1x},${c1y} ${c2x},${c2y} ${ex},${ey}`;
    labelX = centerX;
    labelY = Math.min(c1y, c2y) - 4;
  } else {
    const mappedCurvature = curvature === 0
      ? 0.25
      : Math.sign(curvature) * Math.min(0.88, 0.3 + Math.abs(curvature) / 80);
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      curvature: mappedCurvature
    });

    if (curvature !== 0) {
      labelY += Math.sign(curvature) * 16;
    }
  }

  const epsilonTokens = String(rawLabel)
    .split(/(\n|\s*,\s*)/)
    .map(part => {
      const trimmed = part.trim();
      return {
        text: part,
        isEpsilonToken: trimmed === 'ε'
      };
    });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background:  isEpsilon ? '#111827' : (isActive && leadsToAccept ? '#14532D' : (isActive ? '#0C4A6E' : '#1F2937')),
            color:       isActive && leadsToAccept ? '#DCFCE7' : (isActive ? '#A5F3FC' : '#E5E7EB'),
            border:      `1px solid ${isActive && leadsToAccept ? '#22C55E' : (isEpsilon ? '#34D399' : (isActive ? '#67E8F9' : '#374151'))}`,
            borderRadius: 4,
            padding:     '4px 8px',
            fontSize:    11,
            fontFamily:  'monospace',
            whiteSpace:  'pre-wrap',
            maxWidth:    180,
            boxShadow:   isActive && leadsToAccept
              ? '0 0 0 1px rgba(34,197,94,0.4), 0 0 14px rgba(34,197,94,0.28)'
              : (isEpsilon ? '0 0 0 1px rgba(52,211,153,0.25)' : 'none'),
            textAlign:   'center',
            lineHeight:  1.5,
            pointerEvents: 'none'
          }}
          className="nodrag nopan"
        >
          {epsilonTokens.map((token, idx) => (
            <span
              key={`${id}-token-${idx}`}
              style={token.isEpsilonToken ? { color: '#86EFAC', fontStyle: 'italic', fontWeight: 700 } : undefined}
            >
              {token.text}
            </span>
          ))}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

const nodeTypes = { stateNode: StateNode };
const edgeTypes = { pdaEdge: PdaEdge };

const getDeterministicJitter = (state, axis = 'x') => {
  const seed = `${state}:${axis}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 11);
};

// ── GraphVisualizer ────────────────────────────────────────────────────────
const GraphVisualizer = ({ automaton, activeNode, activeEdge, activeEdges, rejectNodes, fadeInactiveEdges = false }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const activeNodeCount = Array.isArray(activeNode) ? activeNode.length : (activeNode ? 1 : 0);

  const isNfaMode = useMemo(() => {
    if (!automaton || Array.isArray(automaton.edges) || !automaton.transition) return false;

    for (const fromState in automaton.transition) {
      for (const symbol in automaton.transition[fromState]) {
        const targets = automaton.transition[fromState][symbol];
        if (symbol === 'ε') return true;
        if (Array.isArray(targets) && targets.length > 1) return true;
      }
    }

    return false;
  }, [automaton]);

  const isEdgeActive = useCallback((from, to, labels = []) => {
    if (Array.isArray(activeEdges) && activeEdges.length > 0) {
      return activeEdges.some(edge => (
        edge.from === from
        && edge.to === to
        && (!edge.symbol || labels.includes(edge.symbol))
      ));
    }

    if (!activeEdge) return false;
    return activeEdge.from === from && activeEdge.to === to && (!activeEdge.symbol || labels.includes(activeEdge.symbol));
  }, [activeEdge, activeEdges]);

  // Rebuild graph when automaton structure or activeEdge changes
  useEffect(() => {
    if (!automaton || !automaton.states || !automaton.startState) {
      console.error('Invalid automaton structure');
      setNodes([]);
      setEdges([]);
      return;
    }

    const statesSet = automaton.states instanceof Set
      ? automaton.states
      : Array.isArray(automaton.states)
        ? new Set(automaton.states)
        : null;

    if (!statesSet) {
      console.error('States must be a Set or an Array');
      setNodes([]);
      setEdges([]);
      return;
    }

    if (typeof automaton.validate === 'function') {
      const result = automaton.validate();
      if (!result?.isValid) {
        console.error(result?.error || 'Invalid automaton');
        setNodes([]);
        setEdges([]);
        return;
      }
    }

    const { startState } = automaton;
    const states = statesSet;
    const acceptStates = automaton.acceptStates instanceof Set
      ? automaton.acceptStates
      : new Set(automaton.acceptStates || []);
    const usePda = Array.isArray(automaton.edges);

    if (!states || states.size === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    if (!usePda && !automaton.transition) {
      console.error('Missing transition table');
      setNodes([]);
      setEdges([]);
      return;
    }

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
        const defaultPos = state === 'DEAD'
          ? {
              x: (COLS - 1) * SPACING_X + 120,
              y: Math.ceil(states.size / COLS) * SPACING_Y + 90
            }
          : {
              x: col * SPACING_X + 50 + getDeterministicJitter(state, 'x'),
              y: row * SPACING_Y + 50 + getDeterministicJitter(state, 'y')
            };
        const pos = posMap[state] ?? defaultPos;
        return {
          id: state, type: 'stateNode', position: pos,
          data: {
            label:    state,
            isStart:  state === startState,
            isAccept: acceptStates.has(state),
            active:   false,
            isReject: false,
            isDead: state === 'DEAD',
            activeCount: 0
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
        const labels = [label];
        const isAct = false;
        const leadsToAccept = acceptStates.has(to);
        const edgeOpacity = 1;
        newEdges.push({
          id:    key,
          source: from,
          target: to,
          type:  'pdaEdge',
          data:  { rawLabel: label, isActive: isAct, labels, isEpsilon: label === 'ε', leadsToAccept },
          markerEnd: { type: MarkerType.ArrowClosed, color: isAct ? (leadsToAccept ? '#22C55E' : '#67E8F9') : '#9CA3AF' },
          style: {
            stroke: isAct ? (leadsToAccept ? '#22C55E' : '#67E8F9') : '#9CA3AF',
            strokeWidth: isAct ? (leadsToAccept ? 4 : 3) : 2,
            filter: isAct && leadsToAccept ? 'drop-shadow(0 0 6px rgba(34,197,94,0.5))' : 'none',
            opacity: edgeOpacity
          },
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
            if (!edgeMap.has(key)) {
              edgeMap.set(key, { from: fromState, to: toState, labels: [symbol] });
            } else {
              const entry = edgeMap.get(key);
              if (!entry.labels.includes(symbol)) {
                entry.labels.push(symbol);
              }
            }
          }
        }
      }
      for (const [key, { from, to, labels }] of edgeMap) {
        const isAct = false;
        const leadsToAccept = acceptStates.has(to);
        const edgeOpacity = 1;

        if (from === to) {
          newEdges.push({
            id: key,
            source: from,
            target: to,
            type: 'pdaEdge',
            data: {
              rawLabel: labels.join(',\n'),
              labels,
              isActive: isAct,
              curvature: 0,
              isEpsilon: labels.includes('ε'),
              leadsToAccept
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: isAct ? (leadsToAccept ? '#22C55E' : '#67E8F9') : '#9CA3AF' },
            style: {
              stroke: isAct ? (leadsToAccept ? '#22C55E' : '#67E8F9') : '#9CA3AF',
              strokeWidth: isAct ? (leadsToAccept ? 4 : 3) : 2,
              filter: isAct && leadsToAccept ? 'drop-shadow(0 0 6px rgba(34,197,94,0.5))' : 'none',
              opacity: edgeOpacity
            },
            animated: isAct
          });
          continue;
        }

        const isReverse = edgeMap.has(`${to}->${from}`);
        const offset = isReverse ? (from < to ? 52 : -52) : (Math.abs(getDeterministicJitter(`${from}:${to}`, 'curve')) % 2 === 0 ? 22 : -22);

        newEdges.push({
          id: key,
          source: from,
          target: to,
          type: 'pdaEdge',
          data: {
            rawLabel: labels.join(',\n'),
            labels,
            isActive: isAct,
            curvature: offset,
            isEpsilon: labels.includes('ε'),
            leadsToAccept
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: isAct ? (leadsToAccept ? '#22C55E' : '#67E8F9') : '#9CA3AF' },
          style: {
            stroke: isAct ? (leadsToAccept ? '#22C55E' : '#67E8F9') : '#9CA3AF',
            strokeWidth: isAct ? (leadsToAccept ? 4 : 3) : 2,
            filter: isAct
              ? (leadsToAccept ? 'drop-shadow(0 0 6px rgba(34,197,94,0.5))' : 'drop-shadow(0 0 6px rgba(103,232,249,0.45))')
              : 'none',
            opacity: edgeOpacity
          },
          labelStyle: { fill: '#F9FAFB', fontSize: 14, fontFamily: 'Inter' },
          labelBgStyle: {
            fill: '#1F2937',
            padding: 4,
            borderRadius: 4
          },
          animated: isAct
        });
      }
    }

    setEdges(newEdges);
  }, [automaton]);

  // Update node active / reject state without rebuilding positions
  useEffect(() => {
    setNodes(nds => nds.map(n => {
      const isNodeActive = Array.isArray(activeNode)  ? activeNode.includes(n.id)  : n.id === activeNode;
      const isNodeReject = Array.isArray(rejectNodes) ? rejectNodes.includes(n.id) : n.id === rejectNodes;
      return {
        ...n,
        data: {
          ...n.data,
          active: isNodeActive,
          isReject: isNodeReject,
          activeCount: activeNodeCount
        }
      };
    }));
  }, [activeNode, rejectNodes, activeNodeCount]);

  // Update edge highlight for PDA mode (cheap — no positional rebuild)
  useEffect(() => {
    setEdges(eds => eds.map(e => {
      if (e.type !== 'pdaEdge') return e;
      const labels = Array.isArray(e.data?.labels) ? e.data.labels : [];
      const isAct = isEdgeActive(e.source, e.target, labels);
      const leadsToAccept = !!e.data?.leadsToAccept;
      return {
        ...e,
        data:      { ...e.data, isActive: isAct },
        markerEnd: { type: MarkerType.ArrowClosed, color: isAct ? (leadsToAccept ? '#22C55E' : '#67E8F9') : '#9CA3AF' },
        style: {
          stroke: isAct ? (leadsToAccept ? '#22C55E' : '#67E8F9') : '#9CA3AF',
          strokeWidth: isAct ? (leadsToAccept ? 4 : 3) : 2,
          filter: isAct
            ? (leadsToAccept ? 'drop-shadow(0 0 6px rgba(34,197,94,0.5))' : 'drop-shadow(0 0 6px rgba(103,232,249,0.45))')
            : 'none',
          opacity: fadeInactiveEdges && Array.isArray(activeEdges) && activeEdges.length > 0 && !isAct ? 0.2 : 1
        },
        animated:  isAct
      };
    }));
  }, [activeEdge, activeEdges, isEdgeActive, fadeInactiveEdges]);

  const onNodesChange = useCallback(changes => setNodes(nds => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback(changes => setEdges(eds => applyEdgeChanges(changes, eds)), []);

  return (
    <div className="graph-container" style={{ height: '100%', borderRadius: 0, border: 'none' }}>
      <style>{`
        @keyframes multiActivePulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
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
      {isNfaMode && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            zIndex: 20,
            background: 'rgba(8,47,73,0.9)',
            color: '#7DD3FC',
            border: '1px solid rgba(125,211,252,0.45)',
            borderRadius: 999,
            fontSize: 11,
            letterSpacing: 0.6,
            fontWeight: 700,
            padding: '4px 10px'
          }}
        >
          NFA MODE
        </div>
      )}
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

export default memo(GraphVisualizer);
