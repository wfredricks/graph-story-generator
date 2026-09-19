/**
 * Generation loop — the top-level orchestrator that ties together
 * context assembly, prompt building, generation, evaluation, and revision.
 * @style effect
 */

import type {
  GenerationRequest,
  GenerationResponse,
  LlmProvider,
  Iteration,
} from './types.js';
import { assembleContext } from './context.js';
import { buildPrompt, buildRevisionPrompt } from './prompt.js';
import { generate } from './generator.js';
import { evaluate } from './evaluator.js';
import { reflect } from './reflector.js';
import { persistDraft } from './drafts.js';

/**
 * Run the full generation loop:
 *   assembleContext → buildPrompt → generate → evaluate (Haiku)
 *   → (reflect → buildRevisionPrompt → generate → evaluate)*
 *   → persist → return
 *
 * @param provider — LLM for generation (Sonnet/Opus)
 * @param evaluator — LLM for goal evaluation (Haiku — fast + cheap)
 * @style effect
 */
export async function runGenerationLoop(
  request: GenerationRequest,
  provider: LlmProvider,
  evaluator: LlmProvider,
): Promise<GenerationResponse> {
  const maxIterations = request.maxIterations ?? 3;

  // Step 1: assemble graph context
  const context = await assembleContext(request.graphEndpoint, request.queries);

  // Step 2: build initial prompt and generate
  const prompt = buildPrompt(
    context,
    request.backstory ?? [],
    request.goals,
    request.expectedLength,
    request.audience,
  );

  let draft = await generate(prompt, context, provider, 1);
  const iterations: Iteration[] = [];

  // Step 3: evaluate (Haiku) → reflect → revise loop
  for (let i = 0; i < maxIterations; i++) {
    const evaluation = await evaluate(draft, request.goals, context, request.expectedLength, evaluator);

    const reflection = evaluation.deficiencyCount > 0 || evaluation.lengthStatus !== 'pass'
      ? reflect(evaluation, draft, context)
      : '';

    iterations.push({
      version: draft.version,
      evaluation,
      reflection,
    });

    // All goals pass and length is good — converge
    if (evaluation.deficiencyCount === 0 && evaluation.lengthStatus === 'pass') {
      break;
    }

    // Last iteration — don't revise, just record
    if (i === maxIterations - 1) {
      break;
    }

    // Revise
    const revisionPrompt = buildRevisionPrompt(
      draft.content,
      reflection,
      context,
      request.goals,
    );
    draft = await generate(revisionPrompt, context, provider, draft.version + 1);
  }

  const lastEval = iterations.at(-1)?.evaluation;
  const converged = lastEval
    ? lastEval.deficiencyCount === 0 && lastEval.lengthStatus === 'pass'
    : false;

  const response: GenerationResponse = {
    draft,
    context,
    trail: {
      iterations,
      finalVersion: draft.version,
      converged,
    },
    request,
  };

  // Persist the result
  await persistDraft(response);

  return response;
}
