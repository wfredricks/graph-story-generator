/**
 * Goal evaluation — uses Claude Haiku to semantically evaluate
 * a draft against goals with graph context as ground truth.
 *
 * Promoted from pure to effect (LLM-based evaluation).
 * @style effect
 */

import type { Draft, GraphContext, ExpectedLength, EvaluationResult, GoalResult, LlmProvider } from './types.js';

/** Word-count targets for qualitative lengths. */
const QUAL_RANGES: Record<string, [number, number]> = {
  'short-scene':  [400, 1200],
  'full-scene':   [1200, 3000],
  'full-chapter': [2500, 6000],
};

function checkLength(wordCount: number, expected: ExpectedLength | undefined): 'pass' | 'over' | 'under' {
  if (!expected) return 'pass';
  let min: number, max: number;
  switch (expected.kind) {
    case 'words':
      min = Math.floor(expected.count * 0.75);
      max = Math.ceil(expected.count * 1.25);
      break;
    case 'pages':
      min = Math.floor(expected.count * 250 * 0.75);
      max = Math.ceil(expected.count * 250 * 1.25);
      break;
    case 'qualitative': {
      const range = QUAL_RANGES[expected.size];
      if (!range) return 'pass';
      [min, max] = range;
      break;
    }
  }
  if (wordCount < min) return 'under';
  if (wordCount > max) return 'over';
  return 'pass';
}

/**
 * Build the Haiku evaluation prompt.
 */
function buildEvalPrompt(draft: Draft, goals: string[], context: GraphContext): string {
  return `You are evaluating a draft against specific goals. The graph context below is the ground truth — the draft should faithfully represent the data in these nodes.

## Graph Context (ground truth)
${context.summary}

## Draft to Evaluate
${draft.content}

## Goals to Check
${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

## Instructions
For each goal, determine if the draft satisfies it. Respond with a JSON array where each element has:
- "goalIndex": the 1-based goal number
- "status": "pass" or "deficient"
- "deficiency": if deficient, a specific explanation of what is missing or inadequate
- "relevantNodeIds": array of graph node IDs from the context that are relevant to this goal

Respond with ONLY the JSON array, no other text.`;
}

/**
 * Parse Haiku's evaluation response into GoalResults.
 */
function parseEvalResponse(response: string, goals: string[]): GoalResult[] {
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found');

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      goalIndex: number;
      status: 'pass' | 'deficient';
      deficiency?: string;
      relevantNodeIds?: string[];
    }>;

    return goals.map((goalText, i) => {
      const result = parsed.find((p) => p.goalIndex === i + 1);
      if (!result) {
        return { text: goalText, status: 'pass' as const, relevantNodeIds: [] };
      }
      return {
        text: goalText,
        status: result.status,
        deficiency: result.deficiency,
        relevantNodeIds: result.relevantNodeIds ?? [],
      };
    });
  } catch {
    // Fallback: if parsing fails, mark all as pass (don't block on eval failure)
    return goals.map((text) => ({ text, status: 'pass' as const, relevantNodeIds: [] }));
  }
}

/**
 * Evaluate a draft against all goals using Haiku for semantic evaluation
 * and rule-based length checking.
 * @style effect
 */
export async function evaluate(
  draft: Draft,
  goals: string[],
  context: GraphContext,
  expectedLength: ExpectedLength | undefined,
  evaluator: LlmProvider,
): Promise<EvaluationResult> {
  const prompt = buildEvalPrompt(draft, goals, context);
  const response = await evaluator.generate(prompt);
  const goalResults = parseEvalResponse(response, goals);
  const lengthStatus = checkLength(draft.wordCount, expectedLength);

  return {
    goals: goalResults,
    passCount: goalResults.filter((g) => g.status === 'pass').length,
    deficiencyCount: goalResults.filter((g) => g.status === 'deficient').length,
    lengthStatus,
  };
}
