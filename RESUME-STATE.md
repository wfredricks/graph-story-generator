# Graph Story Generator — Resume State (2026-09-18 21:11 EDT)

## Status
- /biz climb COMPLETE — all docs approved
- /dom COMPLETE — 14 types (all value-objects), 11 functions (8 pure, 3 effect)
- SIG loaded — 78 nodes, 52 edges at `artifacts/graph-story-generator/sig/data/polygraph`
- Bill asked: "Can we drive this out to the function level?" — implementing the /dom functions
- IMPLEMENTATION IN PROGRESS:
  - ✅ src/types.ts — all 14 types + LlmProvider interface
  - ✅ src/context.ts — assembleContext (effect) + buildContextSummary (pure)
  - ✅ src/prompt.ts — buildPrompt + buildRevisionPrompt (pure)
  - ✅ src/citations.ts — extractCitations (pure)
  - ✅ src/evaluator.ts — evaluate (pure)
  - ✅ src/reflector.ts — reflect (pure)
  - ✅ src/generator.ts — generate (effect) + Bedrock provider
  - ✅ src/drafts.ts — persistDraft + loadDraft + listDrafts (effect)
  - ✅ src/loop.ts — runGenerationLoop (effect orchestrator)
  - ✅ src/server.ts — Hono REST API (5 endpoints)
  - ✅ src/index.ts — public exports
  - ALL FUNCTIONS IMPLEMENTED
  - NEXT: npm install, tsc --noEmit, test
- npm install NOT YET RUN

## /dom Functions to implement (from dom/DOMAIN.md)

### Pure functions (8):
1. `buildPrompt(context, backstory, goals, length, audience) → string`
2. `extractCitations(content, context) → Citation[]`
3. `evaluate(draft, goals, context, expectedLength) → EvaluationResult`
4. `reflect(evaluation, draft, context) → string`
5. `buildRevisionPrompt(draft, reflection, context, goals) → string`

### Effect functions (3 + 3 storage):
6. `assembleContext(graphEndpoint, queries) → GraphContext` — fetches from PolyGraph Viz API
7. `generate(prompt) → Draft` — LLM call
8. `runGenerationLoop(request) → GenerationResponse` — top-level orchestrator
9. `persistDraft(response) → string` — write to storage
10. `loadDraft(draftId) → GenerationResponse | null` — read from storage
11. `listDrafts() → DraftSummary[]` — list stored drafts

## Architecture
- Hono app (same stack as PolyGraph Viz)
- Reads graph from any PolyGraph Viz endpoint via REST API
- LLM via Bedrock (or pluggable)
- All types at `artifacts/graph-story-generator/dom/DOMAIN.md`
- All /biz docs at `artifacts/graph-story-generator/biz/`

## Running servers (nohup, may need restart)
- STORES SIG: port 4444
- Fountains SIG: port 4445
- Graph Story Generator SIG: NOT YET STARTED

## Key files
- `/biz`: artifacts/graph-story-generator/biz/{STORY,REQUIREMENTS,USE-CASES,FEATURES,BUSINESS-OBJECTS,INTEGRATION-STORY}.md
- `/dom`: artifacts/graph-story-generator/dom/DOMAIN.md
- SIG load script: artifacts/polygraph-viz/load-gsg-sig.mjs
- SIG data: artifacts/graph-story-generator/sig/data/polygraph
