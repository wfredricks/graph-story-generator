/**
 * Reflection — analyzes evaluation deficiencies and produces
 * a structured revision guide referencing specific graph nodes.
 * @style pure
 */

import type { EvaluationResult, Draft, GraphContext } from './types.js';

/**
 * Analyze deficiencies and produce a reflection for revision.
 *
 * The reflection tells the reviser:
 * - Which goals failed and why
 * - Which graph nodes are under-represented
 * - Specific suggestions for addressing each deficiency
 * - Length adjustment guidance if needed
 *
 * @style pure
 */
export function reflect(
  evaluation: EvaluationResult,
  draft: Draft,
  context: GraphContext,
): string {
  const lines: string[] = ['# Revision Guidance\n'];

  // Goal deficiencies
  const deficient = evaluation.goals.filter((g) => g.status === 'deficient');
  if (deficient.length > 0) {
    lines.push(`## Deficient Goals (${deficient.length})\n`);
    for (const goal of deficient) {
      lines.push(`### Goal: "${goal.text}"`);
      lines.push(`**Deficiency:** ${goal.deficiency}`);

      // Find the actual node data for under-represented nodes
      if (goal.relevantNodeIds.length > 0) {
        const citedIds = new Set(draft.citations.map((c) => c.nodeId));
        const uncited = goal.relevantNodeIds.filter((id) => !citedIds.has(id));

        if (uncited.length > 0) {
          lines.push('**Under-represented graph nodes:**');
          for (const nodeId of uncited.slice(0, 8)) {
            const node = context.nodes.find((n) => n.id === nodeId);
            if (node) {
              const name = (node.properties['name'] as string) ?? nodeId;
              const label = node.labels.join(', ');
              lines.push(`- **${name}** [${label}] — weave this into the narrative through character experience or observable detail`);
            } else {
              lines.push(`- ${nodeId} — reference this node in the narrative`);
            }
          }
        }
      }
      lines.push('');
    }
  }

  // Length guidance
  if (evaluation.lengthStatus !== 'pass') {
    lines.push('## Length Adjustment\n');
    if (evaluation.lengthStatus === 'under') {
      lines.push(`The draft is ${draft.wordCount} words — under the target. Expand scenes, add sensory detail, or develop character moments to reach the target length.`);
    } else {
      lines.push(`The draft is ${draft.wordCount} words — over the target. Tighten prose, remove redundant exposition, or merge similar passages.`);
    }
    lines.push('');
  }

  // Passing goals (for context — don't break these)
  const passing = evaluation.goals.filter((g) => g.status === 'pass');
  if (passing.length > 0) {
    lines.push('## Passing Goals (preserve these)\n');
    for (const goal of passing) {
      lines.push(`- ✅ "${goal.text}"`);
    }
  }

  return lines.join('\n');
}
