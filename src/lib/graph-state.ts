/**
 * Graph state helpers — activeNodes / activeLinks / ensureNode / ensureLink,
 * reachability-based collapse.
 * Ported from the prototype logic.
 */

export type NodeId = string;

export interface GraphNode {
  id: NodeId;
  type: 'seed' | 'main' | 'question' | 'project' | 'research' | 'tag' | 'next';
  // ... more fields from Sanity
}

export interface GraphLink {
  source: NodeId;
  target: NodeId;
}

/**
 * Ensures a node is in the active set.
 * Returns true if it was newly added.
 */
export function ensureNode(
  active: Map<NodeId, GraphNode>,
  node: GraphNode
): boolean {
  if (active.has(node.id)) return false;
  active.set(node.id, node);
  return true;
}

/**
 * Ensures a link is present.
 */
export function ensureLink(
  links: GraphLink[],
  source: NodeId,
  target: NodeId
): void {
  if (links.some((l) => l.source === source && l.target === target)) return;
  links.push({ source, target });
}

/**
 * Collapse: remove nodes that are no longer reachable from the seed
 * through currently expanded branches.
 * (Full implementation follows prototype reachability-check.)
 */
export function collapseUnreachable(
  activeNodes: Map<NodeId, GraphNode>,
  activeLinks: GraphLink[],
  expandedRoots: Set<NodeId>
): void {
  // TODO: BFS / DFS from seed + expanded roots, prune the rest
}
