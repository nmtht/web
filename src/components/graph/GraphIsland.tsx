/**
 * Graph island — client-only React component.
 * Mounts D3-force simulation and HTML nodes (no foreignObject).
 * Full logic ported from prototype; this is the skeleton.
 */
import { useEffect, useRef } from 'react';

export default function GraphIsland() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // TODO: import d3-force, graph-state, nodes, etc.
    // - seed node "name what's next."
    // - click → THAT! / THINK / NEXT
    // - reachability collapse
    // - HTML nodes with absolute positioning + transform
    // - SVG only for links
    // - drum expansion in-place
    console.info('[GraphIsland] mounted — ready for D3 port');
  }, []);

  return (
    <div
      ref={containerRef}
      id="graph-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
      }}
    >
      {/* SVG layer for links only */}
      <svg
        id="graphSvg"
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
      >
        <g id="viewport">
          <g id="linksLayer" />
        </g>
      </svg>
      {/* HTML nodes layer — positioned by D3 ticks */}
      <div id="nodesLayer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
    </div>
  );
}
