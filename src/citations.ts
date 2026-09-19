/**
 * Citation extraction — scans generated text for [nodeId] references
 * and maps them to graph nodes from the context.
 * @style pure
 */

import type { Citation, GraphContext } from './types.js';

/**
 * Extract inline citations from generated content.
 *
 * Looks for [nodeId] patterns in the text and matches them against
 * nodes in the graph context. Returns a Citation for each match.
 * @style pure
 */
export function extractCitations(content: string, context: GraphContext): Citation[] {
  const nodeIndex = new Map(context.nodes.map((n) => [n.id, n]));
  const citations: Citation[] = [];
  const seen = new Set<string>();

  // Match [nodeId] patterns — node IDs can contain letters, digits, hyphens, dots, underscores
  const pattern = /\[([a-zA-Z0-9._-]+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const nodeId = match[1]!;
    const node = nodeIndex.get(nodeId);
    if (!node) continue; // Not a known graph node — skip

    // Extract surrounding text as the span (±80 chars)
    const start = Math.max(0, match.index - 80);
    const end = Math.min(content.length, match.index + match[0].length + 80);
    const textSpan = content.slice(start, end).trim();

    // Deduplicate by nodeId — keep first occurrence's span
    if (!seen.has(nodeId)) {
      seen.add(nodeId);
      citations.push({
        nodeId,
        nodeLabel: node.labels[0] ?? 'unknown',
        textSpan,
      });
    }
  }

  return citations;
}
