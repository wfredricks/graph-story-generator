/**
 * Graph Story Generator — domain types.
 * All value-objects, no stateful classes.
 */

// ─── Request types ─────────────────────────────────────────────────────────

export interface QuerySpec {
  labels: string[];
  filter?: Record<string, string | number | boolean>;
  hops?: number; // default 1
  role?: 'throughline' | 'color'; // default 'color'
}

export type ExpectedLength =
  | { kind: 'words'; count: number }
  | { kind: 'pages'; count: number }
  | { kind: 'qualitative'; size: 'short-scene' | 'full-scene' | 'full-chapter' };

export interface AudienceSpec {
  label?: string;
  properties?: Record<string, string>;
}

export interface GenerationRequest {
  graphEndpoint: string;
  queries: QuerySpec[];
  backstory?: string[];
  goals: string[];
  expectedLength?: ExpectedLength;
  audience?: AudienceSpec;
  maxIterations?: number; // default 3
}

// ─── Context types ─────────────────────────────────────────────────────────

export interface ContextNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
  connections: Array<{
    nodeId: string;
    nodeLabel: string;
    relType: string;
    direction: 'out' | 'in';
  }>;
}

export interface ContextEdge {
  fromId: string;
  toId: string;
  type: string;
}

export interface GraphContext {
  nodes: ContextNode[];
  edges: ContextEdge[];
  summary: string; // organized markdown: throughline first, then color
  throughlineNodeIds: string[]; // nodes from throughline queries
  colorNodeIds: string[]; // nodes from color queries
}

// ─── Draft types ───────────────────────────────────────────────────────────

export interface Citation {
  nodeId: string;
  nodeLabel: string;
  textSpan: string;
}

export interface Draft {
  id: string;
  version: number;
  content: string;
  citations: Citation[];
  wordCount: number;
  createdAt: string; // ISO-8601
}

// ─── Evaluation types ──────────────────────────────────────────────────────

export interface GoalResult {
  text: string;
  status: 'pass' | 'deficient';
  deficiency?: string;
  relevantNodeIds: string[];
}

export interface EvaluationResult {
  goals: GoalResult[];
  passCount: number;
  deficiencyCount: number;
  lengthStatus: 'pass' | 'over' | 'under';
}

// ─── Revision types ────────────────────────────────────────────────────────

export interface Iteration {
  version: number;
  evaluation: EvaluationResult;
  reflection: string;
}

export interface RevisionTrail {
  iterations: Iteration[];
  finalVersion: number;
  converged: boolean;
}

// ─── Response types ────────────────────────────────────────────────────────

export interface GenerationResponse {
  draft: Draft;
  context: GraphContext;
  trail: RevisionTrail;
  request: GenerationRequest;
}

export interface DraftSummary {
  id: string;
  version: number;
  createdAt: string;
  goalsSummary: string;
}

// ─── LLM provider interface ───────────────────────────────────────────────

export interface LlmProvider {
  generate(prompt: string): Promise<string>;
}
