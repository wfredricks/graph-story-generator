# Graph Story Generator

Graph-constrained narrative generator — reads a [PolyGraph Viz](https://github.com/wfredricks/polygraph-viz) SIG, generates goal-evaluated drafts with citation tracking.

## What It Does

Point it at any PolyGraph graph endpoint. It assembles context by walking edges, generates a draft grounded in that context, evaluates the draft against your goals, and revises until the goals are met.

```
Graph (SIG) → Context Assembly → Generate (Sonnet) → Evaluate (Haiku) → Reflect → Revise → Done
```

Every claim in the output traces to a graph node. The LLM can't hallucinate facts that aren't in the graph — and when it does, the gap reveals what's missing from your data.

## Quick Start

```bash
# Install
npm install

# Set AWS credentials (Bedrock access required)
export AWS_PROFILE=your-profile    # or set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
export AWS_REGION=us-east-1        # optional, defaults to us-east-1

# Start the server
npx tsx src/server.ts
# → Graph Story Generator listening on http://localhost:4446
```

## Configuration

All configuration is via environment variables — no credentials in code.

| Variable | Default | Description |
|---|---|---|
| `GSG_PORT` | `4446` | Server port |
| `GSG_MODEL_ID` | `us.anthropic.claude-sonnet-4-20250514-v1:0` | Bedrock model for generation |
| `GSG_EVAL_MODEL_ID` | `us.anthropic.claude-3-haiku-20240307-v1:0` | Bedrock model for goal evaluation |
| `AWS_REGION` | `us-east-1` | AWS region |
| `AWS_PROFILE` | — | AWS credentials profile |

## API

### `POST /api/generate`

Full generation loop with evaluate/reflect/revise cycle.

```json
{
  "graphEndpoint": "http://localhost:4445",
  "queries": [
    { "labels": ["book.chapter"], "filter": { "number": 5 }, "hops": 1 },
    { "labels": ["science.mechanism"], "hops": 1 }
  ],
  "backstory": [
    "Noah's hands — thick, split at the knuckles from years of pitch work."
  ],
  "goals": [
    "The geological mechanism must be dramatized through character experience",
    "A skeptical geologist should find the science plausible"
  ],
  "expectedLength": { "kind": "qualitative", "size": "full-scene" },
  "maxIterations": 2
}
```

**Response** includes the final draft, inline `[nodeId]` citations, word count, evaluation trail, and the revision history.

### `POST /api/context`

Assemble graph context without generating — structured markdown ready for manual use or pasting into your own LLM session.

```json
{
  "graphEndpoint": "http://localhost:4445",
  "queries": [{ "labels": ["book.chapter"], "hops": 1 }]
}
```

### `POST /api/evaluate`

Evaluate an externally written draft against goals using graph context as ground truth. No generation — evaluation only.

```json
{
  "graphEndpoint": "http://localhost:4445",
  "queries": [{ "labels": ["science.mechanism"], "hops": 1 }],
  "content": "Your draft text here...",
  "goals": ["All claims should be grounded in graph data"]
}
```

### `GET /api/drafts`

List all persisted drafts with metadata.

### `GET /api/drafts/:id`

Load a specific draft with its full generation response (context, evaluation trail, citations).

## Architecture

```
┌──────────────────────────────────────────────────┐
│ Graph Story Generator (Hono, port 4446)          │
│                                                  │
│  assembleContext ──→ buildPrompt ──→ generate     │
│       (effect)         (pure)        (effect)    │
│                                       ↓          │
│                    ┌── evaluate ←── draft         │
│                    │    (Haiku)                   │
│                    ↓                              │
│              pass? ──yes──→ persist + return      │
│                │                                  │
│               no                                  │
│                ↓                                  │
│           reflect ──→ buildRevisionPrompt         │
│            (pure)          (pure)                 │
│                              ↓                   │
│                          generate (revised)       │
│                              ↓                   │
│                          evaluate (loop)          │
└──────────────────────────────────────────────────┘
         ↑ reads                    
┌────────┴─────────┐
│  PolyGraph Viz   │
│  (any endpoint)  │
└──────────────────┘
```

**Pure/effect split:** 8 pure functions, 3 effect functions (73/27). All 14 types are value-objects — no stateful classes.

| Function | Style | What it does |
|---|---|---|
| `buildPrompt` | pure | Compose LLM prompt from context + backstory + goals |
| `extractCitations` | pure | Scan text, map claims to graph nodes |
| `evaluate` | effect | Haiku-based semantic goal evaluation |
| `reflect` | pure | Analyze deficiencies, produce revision guidance |
| `buildRevisionPrompt` | pure | Compose targeted revision prompt |
| `buildContextSummary` | pure | Organize nodes into markdown by label prefix |
| `assembleContext` | effect | Fetch + walk graph edges from PolyGraph Viz API |
| `generate` | effect | Bedrock LLM call |
| `runGenerationLoop` | effect | Top-level orchestrator |
| `persistDraft` | effect | Write to local storage |
| `loadDraft` / `listDrafts` | effect | Read from local storage |

## PolyGraph Viz Integration

When running alongside [PolyGraph Viz](https://github.com/wfredricks/polygraph-viz), the **✦ button** in the Viz header opens a settings form and calls this API with the currently checked sidebar labels as context. Results display in an overlay with formatted text, citation highlights, and the evaluation trail.

## Graph as Quality Audit

A side effect of graph-constrained generation: **gaps in your graph reveal themselves.** When the graph doesn't include a fact (e.g., where Noah's ark landed), the LLM fills the gap from training data — and the error immediately shows what's missing from your SIG. Generate → spot errors → enrich graph → regenerate.

## License

MIT
