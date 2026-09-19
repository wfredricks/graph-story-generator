/**
 * Graph context assembly — fetches from a PolyGraph Viz endpoint,
 * walks edges, and builds structured context.
 *
 * assembleContext is the effect boundary; buildContextSummary is pure.
 * Supports throughline/color role separation.
 * @style effect (fetch) + pure (summary)
 */

import type { QuerySpec, GraphContext, ContextNode, ContextEdge } from './types.js';

// ─── Raw API response shapes (from PolyGraph Viz) ──────────────────────────

interface VizNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

interface VizEdge {
  id: string;
  type: string;
  fromId: string;
  toId: string;
  properties: Record<string, unknown>;
}

interface NodesByLabelResponse {
  labels: string[];
  nodes: VizNode[];
  edges: VizEdge[];
}

interface NeighborsResponse {
  nodeId: string;
  nodes: VizNode[];
  edges: VizEdge[];
}

// ─── Pure: render a node group to markdown ─────────────────────────────────

function renderNodeGroup(prefix: string, groupNodes: ContextNode[]): string {
  const lines: string[] = [];
  lines.push(`### ${prefix}\n`);
  for (const node of groupNodes) {
    const label = node.labels.join(', ');
    const name = (node.properties['name'] as string) ?? node.id;
    lines.push(`#### ${name} [${label}]`);
    for (const [key, value] of Object.entries(node.properties)) {
      if (key === 'code' || key === 'suppressed') continue;
      lines.push(`- **${key}:** ${String(value)}`);
    }
    if (node.connections.length > 0) {
      lines.push('- **Connections:**');
      for (const conn of node.connections) {
        const dir = conn.direction === 'out' ? '→' : '←';
        lines.push(`  - ${dir} [${conn.relType}] ${conn.nodeId} (${conn.nodeLabel})`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

function groupByPrefix(nodes: ContextNode[]): Map<string, ContextNode[]> {
  const groups = new Map<string, ContextNode[]>();
  for (const node of nodes) {
    const primary = node.labels[0] ?? 'unknown';
    const dot = primary.indexOf('.');
    const prefix = dot > 0 ? primary.slice(0, dot) : primary;
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix)!.push(node);
  }
  return groups;
}

// ─── Pure: build context summary with throughline/color separation ──────────

/** @style pure */
export function buildContextSummary(
  nodes: ContextNode[],
  throughlineIds: Set<string>,
  colorIds: Set<string>,
): string {
  const throughlineNodes = nodes.filter((n) => throughlineIds.has(n.id));
  const colorNodes = nodes.filter((n) => colorIds.has(n.id) && !throughlineIds.has(n.id));

  const lines: string[] = [];

  // Throughline section — the narrative backbone
  if (throughlineNodes.length > 0) {
    lines.push('# Narrative Foundation (Through Line)\n');
    lines.push('These nodes define the narrative arc. Build the story structure from this data.\n');
    for (const [prefix, groupNodes] of [...groupByPrefix(throughlineNodes).entries()].sort()) {
      lines.push(renderNodeGroup(prefix, groupNodes));
    }
  }

  // Color section — supporting detail
  if (colorNodes.length > 0) {
    lines.push('# Supporting Detail (Color)\n');
    lines.push('These nodes enrich the narrative with depth and texture. Weave them in to support the through line — do not let them steer the story.\n');
    for (const [prefix, groupNodes] of [...groupByPrefix(colorNodes).entries()].sort()) {
      lines.push(renderNodeGroup(prefix, groupNodes));
    }
  }

  // Fallback if no roles assigned (all nodes, legacy behavior)
  if (throughlineNodes.length === 0 && colorNodes.length === 0) {
    lines.push('# Graph Context\n');
    for (const [prefix, groupNodes] of [...groupByPrefix(nodes).entries()].sort()) {
      lines.push(renderNodeGroup(prefix, groupNodes));
    }
  }

  return lines.join('\n');
}

// ─── Effect: assemble context from PolyGraph Viz API ───────────────────────

/** @style effect */
export async function assembleContext(
  graphEndpoint: string,
  queries: QuerySpec[],
): Promise<GraphContext> {
  const allNodes = new Map<string, ContextNode>();
  const allEdges: ContextEdge[] = [];
  const seenEdges = new Set<string>();
  const throughlineIdSet = new Set<string>();
  const colorIdSet = new Set<string>();

  for (const query of queries) {
    const role = query.role ?? 'color';

    // Step 1: fetch nodes by label
    const labelsParam = query.labels.map(encodeURIComponent).join(',');
    const limit = 2000;
    const url = `${graphEndpoint}/api/nodes-by-label?labels=${labelsParam}&limit=${limit}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`nodes-by-label failed: ${resp.status} ${resp.statusText}`);
    }
    const data = (await resp.json()) as NodesByLabelResponse;

    // Apply property filters if specified
    let matchedNodes = data.nodes;
    if (query.filter) {
      matchedNodes = matchedNodes.filter((n) => {
        for (const [key, value] of Object.entries(query.filter!)) {
          if (String(n.properties[key]) !== String(value)) return false;
        }
        return true;
      });
    }

    // Step 2: walk hops for each matched node
    const hops = query.hops ?? 1;
    const frontier = new Set(matchedNodes.map((n) => n.id));
    const visited = new Set<string>();

    for (let hop = 0; hop <= hops; hop++) {
      for (const nodeId of frontier) {
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        if (hop < hops) {
          try {
            const nResp = await fetch(
              `${graphEndpoint}/api/neighbors/${encodeURIComponent(nodeId)}`,
            );
            if (nResp.ok) {
              const nData = (await nResp.json()) as NeighborsResponse;
              for (const n of nData.nodes) frontier.add(n.id);
              for (const e of nData.edges) {
                const edgeKey = `${e.fromId}:${e.type}:${e.toId}`;
                if (!seenEdges.has(edgeKey)) {
                  seenEdges.add(edgeKey);
                  allEdges.push({ fromId: e.fromId, toId: e.toId, type: e.type });
                }
              }
            }
          } catch {
            // Skip failed neighbor fetches
          }
        }
      }
    }

    // Collect all visited nodes and tag with role
    for (const n of data.nodes) {
      if (visited.has(n.id)) {
        if (!allNodes.has(n.id)) {
          allNodes.set(n.id, {
            id: n.id,
            labels: n.labels,
            properties: n.properties,
            connections: [],
          });
        }
        // Tag with role (throughline wins over color if both)
        if (role === 'throughline') {
          throughlineIdSet.add(n.id);
        } else {
          colorIdSet.add(n.id);
        }
      }
    }
  }

  // Build connection lists from edges
  for (const edge of allEdges) {
    const from = allNodes.get(edge.fromId);
    const to = allNodes.get(edge.toId);
    if (from && to) {
      from.connections.push({
        nodeId: edge.toId,
        nodeLabel: to.labels[0] ?? 'unknown',
        relType: edge.type,
        direction: 'out',
      });
      to.connections.push({
        nodeId: edge.fromId,
        nodeLabel: from.labels[0] ?? 'unknown',
        relType: edge.type,
        direction: 'in',
      });
    }
  }

  const nodes = [...allNodes.values()];
  const summary = buildContextSummary(nodes, throughlineIdSet, colorIdSet);

  return {
    nodes,
    edges: allEdges,
    summary,
    throughlineNodeIds: [...throughlineIdSet],
    colorNodeIds: [...colorIdSet],
  };
}
