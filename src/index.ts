/**
 * Graph Story Generator — public API exports.
 */

// Types
export type {
  QuerySpec,
  ExpectedLength,
  AudienceSpec,
  GenerationRequest,
  ContextNode,
  ContextEdge,
  GraphContext,
  Citation,
  Draft,
  GoalResult,
  EvaluationResult,
  Iteration,
  RevisionTrail,
  GenerationResponse,
  DraftSummary,
  LlmProvider,
} from './types.js';

// Pure functions
export { buildPrompt, buildRevisionPrompt } from './prompt.js';
export { extractCitations } from './citations.js';
export { evaluate } from './evaluator.js';
export { reflect } from './reflector.js';
export { buildContextSummary } from './context.js';

// Effect functions
export { assembleContext } from './context.js';
export { generate } from './generator.js';
export { runGenerationLoop } from './loop.js';
export { persistDraft, loadDraft, listDrafts } from './drafts.js';
