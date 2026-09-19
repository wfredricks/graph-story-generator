/**
 * Load graph-story-generator /biz and /dom into a PolyGraph SIG.
 *
 * Creates nodes for requirements, use cases, features, business objects,
 * and /dom types + functions, with edges tracing the /biz climb.
 */

import { PolyGraph, LevelAdapter } from 'polygraph-db';

const DB_PATH = '/Users/williamfredricks/.openclaw/workspace/artifacts/graph-story-generator/sig/data/polygraph';

// ─── /biz nodes ────────────────────────────────────────────────────────────

const requirements = [
  { id: 'REQ-GSG-01', name: 'Graph Data Acquisition', desc: 'Accept graph endpoint URL and queries to pull source data.' },
  { id: 'REQ-GSG-02', name: 'Backstory Integration', desc: 'Accept zero or more authored backstory snippets.' },
  { id: 'REQ-GSG-03', name: 'Goal-Driven Generation', desc: 'Accept goals as evaluation criteria.' },
  { id: 'REQ-GSG-04', name: 'Context Assembly', desc: 'Walk graph edges to assemble structured context.' },
  { id: 'REQ-GSG-05', name: 'Draft Generation', desc: 'Generate draft grounded in graph data.' },
  { id: 'REQ-GSG-06', name: 'Goal Evaluation', desc: 'Evaluate draft against each goal, produce pass/deficiency list.' },
  { id: 'REQ-GSG-07', name: 'Reflection and Revision', desc: 'Reflect on deficiencies and revise the draft.' },
  { id: 'REQ-GSG-08', name: 'Iteration Control', desc: 'Iterate evaluate/revise until goals pass or max iterations.' },
  { id: 'REQ-GSG-09', name: 'Citation Tracking', desc: 'Track which graph nodes contributed to each section.' },
  { id: 'REQ-GSG-10', name: 'Graph-Agnostic Operation', desc: 'Operate against any PolyGraph Viz endpoint.' },
  { id: 'REQ-GSG-11', name: 'API-First', desc: 'All capabilities through REST API.' },
  { id: 'REQ-GSG-12', name: 'Draft Persistence', desc: 'Persist drafts with version history.' },
  { id: 'REQ-GSG-13', name: 'Output Length Control', desc: 'Accept expected output length, evaluate conformance.' },
];

const useCases = [
  { id: 'UC-GSG-01', name: 'Generate a Chapter from Graph Context', actor: 'Author' },
  { id: 'UC-GSG-02', name: 'Revise a Draft with Feedback', actor: 'Author' },
  { id: 'UC-GSG-03', name: 'Assemble Context Without Generating', actor: 'Author' },
  { id: 'UC-GSG-04', name: 'Evaluate an Externally Written Draft', actor: 'Author' },
  { id: 'UC-GSG-05', name: 'Generate for Multiple Audiences', actor: 'Author' },
  { id: 'UC-GSG-06', name: 'Browse Draft History', actor: 'Author' },
];

const features = [
  { id: 'F-GSG-01', name: 'Graph Context Assembly' },
  { id: 'F-GSG-02', name: 'Backstory Injection' },
  { id: 'F-GSG-03', name: 'Goal-Driven Draft Generation' },
  { id: 'F-GSG-04', name: 'Goal Evaluation' },
  { id: 'F-GSG-05', name: 'Reflective Revision Loop' },
  { id: 'F-GSG-06', name: 'Citation Tracking' },
  { id: 'F-GSG-07', name: 'Output Length Control' },
  { id: 'F-GSG-08', name: 'Audience Weighting' },
  { id: 'F-GSG-09', name: 'Context-Only Mode' },
  { id: 'F-GSG-10', name: 'External Draft Evaluation' },
  { id: 'F-GSG-11', name: 'Draft Versioning' },
  { id: 'F-GSG-12', name: 'REST API' },
  { id: 'F-GSG-13', name: 'Graph-Agnostic Discovery' },
];

const businessObjects = [
  { id: 'BO-GenerationRequest', name: 'GenerationRequest' },
  { id: 'BO-QuerySpec', name: 'QuerySpec' },
  { id: 'BO-GraphContext', name: 'GraphContext' },
  { id: 'BO-ContextNode', name: 'ContextNode' },
  { id: 'BO-Draft', name: 'Draft' },
  { id: 'BO-Citation', name: 'Citation' },
  { id: 'BO-Goal', name: 'Goal' },
  { id: 'BO-EvaluationResult', name: 'EvaluationResult' },
  { id: 'BO-RevisionTrail', name: 'RevisionTrail' },
  { id: 'BO-Iteration', name: 'Iteration' },
  { id: 'BO-GenerationResponse', name: 'GenerationResponse' },
  { id: 'BO-ExpectedLength', name: 'ExpectedLength' },
  { id: 'BO-AudienceSpec', name: 'AudienceSpec' },
  { id: 'BO-ContextEdge', name: 'ContextEdge' },
  { id: 'BO-GoalResult', name: 'GoalResult' },
];

// ─── /dom nodes ────────────────────────────────────────────────────────────

const domTypes = [
  { id: 'T-QuerySpec', name: 'QuerySpec', style: 'value-object' },
  { id: 'T-GenerationRequest', name: 'GenerationRequest', style: 'value-object' },
  { id: 'T-ExpectedLength', name: 'ExpectedLength', style: 'value-object' },
  { id: 'T-AudienceSpec', name: 'AudienceSpec', style: 'value-object' },
  { id: 'T-ContextNode', name: 'ContextNode', style: 'value-object' },
  { id: 'T-ContextEdge', name: 'ContextEdge', style: 'value-object' },
  { id: 'T-GraphContext', name: 'GraphContext', style: 'value-object' },
  { id: 'T-Citation', name: 'Citation', style: 'value-object' },
  { id: 'T-Draft', name: 'Draft', style: 'value-object' },
  { id: 'T-GoalResult', name: 'GoalResult', style: 'value-object' },
  { id: 'T-EvaluationResult', name: 'EvaluationResult', style: 'value-object' },
  { id: 'T-Iteration', name: 'Iteration', style: 'value-object' },
  { id: 'T-RevisionTrail', name: 'RevisionTrail', style: 'value-object' },
  { id: 'T-GenerationResponse', name: 'GenerationResponse', style: 'value-object' },
];

const domFunctions = [
  { id: 'FN-assembleContext', name: 'assembleContext', style: 'effect', sig: '(graphEndpoint, queries) → GraphContext' },
  { id: 'FN-buildPrompt', name: 'buildPrompt', style: 'pure', sig: '(context, backstory, goals, length, audience) → string' },
  { id: 'FN-generate', name: 'generate', style: 'effect', sig: '(prompt) → Draft' },
  { id: 'FN-extractCitations', name: 'extractCitations', style: 'pure', sig: '(content, context) → Citation[]' },
  { id: 'FN-evaluate', name: 'evaluate', style: 'pure', sig: '(draft, goals, context, expectedLength) → EvaluationResult' },
  { id: 'FN-reflect', name: 'reflect', style: 'pure', sig: '(evaluation, draft, context) → string' },
  { id: 'FN-buildRevisionPrompt', name: 'buildRevisionPrompt', style: 'pure', sig: '(draft, reflection, context, goals) → string' },
  { id: 'FN-runGenerationLoop', name: 'runGenerationLoop', style: 'effect', sig: '(request) → GenerationResponse' },
  { id: 'FN-persistDraft', name: 'persistDraft', style: 'effect', sig: '(response) → string' },
  { id: 'FN-loadDraft', name: 'loadDraft', style: 'effect', sig: '(draftId) → GenerationResponse | null' },
  { id: 'FN-listDrafts', name: 'listDrafts', style: 'effect', sig: '() → DraftSummary[]' },
];

// ─── Traceability edges ────────────────────────────────────────────────────

const edges = [
  // Requirements → Features
  { from: 'REQ-GSG-01', to: 'F-GSG-01', type: 'REALIZED_BY' },
  { from: 'REQ-GSG-02', to: 'F-GSG-02', type: 'REALIZED_BY' },
  { from: 'REQ-GSG-03', to: 'F-GSG-03', type: 'REALIZED_BY' },
  { from: 'REQ-GSG-04', to: 'F-GSG-01', type: 'REALIZED_BY' },
  { from: 'REQ-GSG-05', to: 'F-GSG-03', type: 'REALIZED_BY' },
  { from: 'REQ-GSG-06', to: 'F-GSG-04', type: 'REALIZED_BY' },
  { from: 'REQ-GSG-07', to: 'F-GSG-05', type: 'REALIZED_BY' },
  { from: 'REQ-GSG-08', to: 'F-GSG-05', type: 'REALIZED_BY' },
  { from: 'REQ-GSG-09', to: 'F-GSG-06', type: 'REALIZED_BY' },
  { from: 'REQ-GSG-10', to: 'F-GSG-13', type: 'REALIZED_BY' },
  { from: 'REQ-GSG-11', to: 'F-GSG-12', type: 'REALIZED_BY' },
  { from: 'REQ-GSG-12', to: 'F-GSG-11', type: 'REALIZED_BY' },
  { from: 'REQ-GSG-13', to: 'F-GSG-07', type: 'REALIZED_BY' },

  // Features → /dom functions
  { from: 'F-GSG-01', to: 'FN-assembleContext', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-02', to: 'FN-buildPrompt', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-03', to: 'FN-generate', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-03', to: 'FN-buildPrompt', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-04', to: 'FN-evaluate', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-05', to: 'FN-reflect', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-05', to: 'FN-buildRevisionPrompt', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-05', to: 'FN-runGenerationLoop', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-06', to: 'FN-extractCitations', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-07', to: 'FN-evaluate', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-08', to: 'FN-buildPrompt', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-09', to: 'FN-assembleContext', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-10', to: 'FN-evaluate', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-11', to: 'FN-persistDraft', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-11', to: 'FN-loadDraft', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-11', to: 'FN-listDrafts', type: 'IMPLEMENTED_BY' },
  { from: 'F-GSG-13', to: 'FN-assembleContext', type: 'IMPLEMENTED_BY' },

  // /dom functions → types (inputs/outputs)
  { from: 'FN-assembleContext', to: 'T-QuerySpec', type: 'CONSUMES' },
  { from: 'FN-assembleContext', to: 'T-GraphContext', type: 'PRODUCES' },
  { from: 'FN-buildPrompt', to: 'T-GraphContext', type: 'CONSUMES' },
  { from: 'FN-buildPrompt', to: 'T-ExpectedLength', type: 'CONSUMES' },
  { from: 'FN-buildPrompt', to: 'T-AudienceSpec', type: 'CONSUMES' },
  { from: 'FN-generate', to: 'T-Draft', type: 'PRODUCES' },
  { from: 'FN-extractCitations', to: 'T-Citation', type: 'PRODUCES' },
  { from: 'FN-extractCitations', to: 'T-GraphContext', type: 'CONSUMES' },
  { from: 'FN-evaluate', to: 'T-Draft', type: 'CONSUMES' },
  { from: 'FN-evaluate', to: 'T-GraphContext', type: 'CONSUMES' },
  { from: 'FN-evaluate', to: 'T-EvaluationResult', type: 'PRODUCES' },
  { from: 'FN-evaluate', to: 'T-GoalResult', type: 'PRODUCES' },
  { from: 'FN-reflect', to: 'T-EvaluationResult', type: 'CONSUMES' },
  { from: 'FN-reflect', to: 'T-Draft', type: 'CONSUMES' },
  { from: 'FN-buildRevisionPrompt', to: 'T-Draft', type: 'CONSUMES' },
  { from: 'FN-buildRevisionPrompt', to: 'T-GraphContext', type: 'CONSUMES' },
  { from: 'FN-runGenerationLoop', to: 'T-GenerationRequest', type: 'CONSUMES' },
  { from: 'FN-runGenerationLoop', to: 'T-GenerationResponse', type: 'PRODUCES' },
  { from: 'FN-runGenerationLoop', to: 'T-RevisionTrail', type: 'PRODUCES' },
  { from: 'FN-runGenerationLoop', to: 'T-Iteration', type: 'PRODUCES' },
  { from: 'FN-persistDraft', to: 'T-GenerationResponse', type: 'CONSUMES' },
  { from: 'FN-loadDraft', to: 'T-GenerationResponse', type: 'PRODUCES' },
];

// ─── Load ──────────────────────────────────────────────────────────────────

async function main() {
  const adapter = new LevelAdapter({ path: DB_PATH });
  const graph = new PolyGraph({ adapter });
  await graph.open();

  let nodeCount = 0;
  let edgeCount = 0;

  // Requirements
  for (const r of requirements) {
    await graph.createNode(['biz.requirement'], { reqId: r.id, name: r.name, description: r.desc }, r.id);
    nodeCount++;
  }

  // Use Cases
  for (const uc of useCases) {
    await graph.createNode(['biz.use_case'], { ucId: uc.id, name: uc.name, actor: uc.actor }, uc.id);
    nodeCount++;
  }

  // Features
  for (const f of features) {
    await graph.createNode(['biz.feature'], { ftId: f.id, name: f.name }, f.id);
    nodeCount++;
  }

  // Business Objects
  for (const bo of businessObjects) {
    await graph.createNode(['biz.business_object'], { name: bo.name }, bo.id);
    nodeCount++;
  }

  // /dom Types
  for (const t of domTypes) {
    await graph.createNode(['dom.type'], { name: t.name, style: t.style }, t.id);
    nodeCount++;
  }

  // /dom Functions
  for (const fn of domFunctions) {
    await graph.createNode(['dom.function'], { name: fn.name, style: fn.style, signature: fn.sig }, fn.id);
    nodeCount++;
  }

  // Edges
  for (const e of edges) {
    try {
      await graph.createRelationship(e.from, e.to, e.type, {});
      edgeCount++;
    } catch (err) {
      console.error(`  Edge failed: ${e.from} → ${e.to} (${e.type}): ${err.message}`);
    }
  }

  // Meta-label nodes for colors
  const labelColors = {
    'biz.requirement':      { baseHue: 30,  group: 'biz' },
    'biz.use_case':         { baseHue: 30,  group: 'biz' },
    'biz.feature':          { baseHue: 30,  group: 'biz' },
    'biz.business_object':  { baseHue: 30,  group: 'biz' },
    'dom.type':             { baseHue: 270, group: 'dom' },
    'dom.function':         { baseHue: 270, group: 'dom' },
  };

  const GOLDEN_ANGLE = 137.508;
  function hslToHex(h, s, l) {
    const sN = s/100, lN = l/100;
    const c = (1 - Math.abs(2*lN - 1)) * sN;
    const x = c * (1 - Math.abs(((h/60) % 2) - 1));
    const m = lN - c/2;
    let r=0,g=0,b=0;
    if (h<60) {r=c;g=x} else if (h<120) {r=x;g=c} else if (h<180) {g=c;b=x}
    else if (h<240) {g=x;b=c} else if (h<300) {r=x;b=c} else {r=c;b=x}
    const hex = v => Math.round((v+m)*255).toString(16).padStart(2,'0');
    return '#'+hex(r)+hex(g)+hex(b);
  }

  let colorIdx = 0;
  for (const [label, info] of Object.entries(labelColors)) {
    const hue = (info.baseHue + colorIdx * GOLDEN_ANGLE) % 360;
    const lit = 46 + (colorIdx % 3) * 7;
    const color = hslToHex(hue, 65, lit);
    const metaId = `meta-label-${label.replace(/\./g, '-')}`;
    await graph.createNode(['meta.label'], { forLabel: label, color }, metaId);
    nodeCount++;
    colorIdx++;
  }

  console.log(`SIG loaded: ${nodeCount} nodes, ${edgeCount} edges`);

  const stats = await graph.stats();
  console.log(`DB stats: ${stats.nodeCount} nodes, ${stats.relationshipCount} relationships`);

  await graph.close();
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
