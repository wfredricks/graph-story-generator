# Graph Story Generator — /dom

## Types

### QuerySpec (value-object)
```typescript
interface QuerySpec {
  labels: string[];
  filter?: Record<string, string | number | boolean>;
  hops?: number; // default 1
}
```

### GenerationRequest (value-object)
```typescript
interface GenerationRequest {
  graphEndpoint: string;
  queries: QuerySpec[];
  backstory?: string[];
  goals: string[];
  expectedLength?: ExpectedLength;
  audience?: AudienceSpec;
  maxIterations?: number; // default 3
}
```

### ExpectedLength (value-object)
```typescript
type ExpectedLength =
  | { kind: 'words'; count: number }
  | { kind: 'pages'; count: number }
  | { kind: 'qualitative'; size: 'short-scene' | 'full-scene' | 'full-chapter' };
```

### AudienceSpec (value-object)
```typescript
interface AudienceSpec {
  label?: string;       // e.g. 'audience.segment'
  properties?: Record<string, string>; // e.g. { id: 'aud-skeptics' }
}
```

### ContextNode (value-object)
```typescript
interface ContextNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
  connections: Array<{ nodeId: string; nodeLabel: string; relType: string; direction: 'out' | 'in' }>;
}
```

### ContextEdge (value-object)
```typescript
interface ContextEdge {
  fromId: string;
  toId: string;
  type: string;
}
```

### GraphContext (value-object)
```typescript
interface GraphContext {
  nodes: ContextNode[];
  edges: ContextEdge[];
  summary: string; // organized markdown grouped by label prefix
}
```

### Citation (value-object)
```typescript
interface Citation {
  nodeId: string;
  nodeLabel: string;
  textSpan: string;
}
```

### Draft (value-object)
```typescript
interface Draft {
  id: string;
  version: number;
  content: string;
  citations: Citation[];
  wordCount: number;
  createdAt: string; // ISO-8601
}
```

### GoalResult (value-object)
```typescript
interface GoalResult {
  text: string;
  status: 'pass' | 'deficient';
  deficiency?: string;
  relevantNodeIds: string[];
}
```

### EvaluationResult (value-object)
```typescript
interface EvaluationResult {
  goals: GoalResult[];
  passCount: number;
  deficiencyCount: number;
  lengthStatus: 'pass' | 'over' | 'under';
}
```

### Iteration (value-object)
```typescript
interface Iteration {
  version: number;
  evaluation: EvaluationResult;
  reflection: string;
}
```

### RevisionTrail (value-object)
```typescript
interface RevisionTrail {
  iterations: Iteration[];
  finalVersion: number;
  converged: boolean;
}
```

### GenerationResponse (value-object)
```typescript
interface GenerationResponse {
  draft: Draft;
  context: GraphContext;
  trail: RevisionTrail;
  request: GenerationRequest;
}
```

## Functions

### assembleContext (pure → effect at graph boundary)
```
(graphEndpoint: string, queries: QuerySpec[]) → GraphContext
```
Connects to the PolyGraph Viz API, executes queries, walks edges, assembles structured context. Produces the `summary` markdown grouped by label prefix. **Effect** at the fetch boundary; the assembly logic itself is pure.

### buildPrompt (pure)
```
(context: GraphContext, backstory: string[], goals: string[], length: ExpectedLength | undefined, audience: AudienceSpec | undefined) → string
```
Composes the LLM prompt from context, backstory, goals, length, and audience. No I/O.

### generate (effect)
```
(prompt: string) → Draft
```
Calls the LLM with the composed prompt. Returns a Draft with extracted citations and word count.

### extractCitations (pure)
```
(content: string, context: GraphContext) → Citation[]
```
Scans generated text for node references and maps them to graph nodes from the context. No I/O.

### evaluate (pure)
```
(draft: Draft, goals: string[], context: GraphContext, expectedLength: ExpectedLength | undefined) → EvaluationResult
```
Evaluates a draft against each goal using the graph context as ground truth. Checks length conformance. No I/O — the evaluation logic is a pure comparison. *(Note: if LLM-based evaluation is needed, this becomes effect; start pure, promote if required.)*

### reflect (pure)
```
(evaluation: EvaluationResult, draft: Draft, context: GraphContext) → string
```
Analyzes deficiencies and produces a reflection — what to fix and how, referencing specific graph nodes. No I/O.

### buildRevisionPrompt (pure)
```
(draft: Draft, reflection: string, context: GraphContext, goals: string[]) → string
```
Composes a revision prompt targeting specific deficiencies identified in the reflection. No I/O.

### runGenerationLoop (effect)
```
(request: GenerationRequest) → GenerationResponse
```
Orchestrates the full cycle: assembleContext → buildPrompt → generate → evaluate → (reflect → buildRevisionPrompt → generate → evaluate)* → persist. The top-level effect shell.

### persistDraft (effect)
```
(response: GenerationResponse) → string // draft ID
```
Writes the generation response to storage with version metadata.

### loadDraft (effect)
```
(draftId: string) → GenerationResponse | null
```
Reads a persisted generation response by ID.

### listDrafts (effect)
```
() → Array<{ id: string; version: number; createdAt: string; goalsSummary: string }>
```
Returns draft metadata for browsing.
