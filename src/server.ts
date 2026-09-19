/**
 * Graph Story Generator — Hono REST API server.
 * @style effect (top-level application shell)
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import type { GenerationRequest, LlmProvider } from './types.js';
import { assembleContext } from './context.js';
import { runGenerationLoop } from './loop.js';
import { loadDraft, listDrafts } from './drafts.js';
import { evaluate } from './evaluator.js';
import { extractCitations } from './citations.js';

// ─── LLM provider (Bedrock default, pluggable) ────────────────────────────

function createBedrockProvider(modelIdEnv: string = 'GSG_MODEL_ID', defaultModel: string = 'us.anthropic.claude-sonnet-4-20250514-v1:0'): LlmProvider {
  return {
    async generate(prompt: string): Promise<string> {
      const { BedrockRuntimeClient, InvokeModelCommand } = await import(
        '@aws-sdk/client-bedrock-runtime'
      );
      const client = new BedrockRuntimeClient({ region: process.env['AWS_REGION'] ?? 'us-east-1' });
      const modelId = process.env[modelIdEnv] ?? defaultModel;

      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 8192,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const response = await client.send(command);
      const body = JSON.parse(new TextDecoder().decode(response.body));
      return body.content?.[0]?.text ?? '';
    },
  };
}

// ─── App ───────────────────────────────────────────────────────────────────

const app = new Hono();
app.use('/*', cors());
const provider = createBedrockProvider('GSG_MODEL_ID', 'us.anthropic.claude-sonnet-4-20250514-v1:0');
const evaluator = createBedrockProvider('GSG_EVAL_MODEL_ID', 'us.anthropic.claude-3-haiku-20240307-v1:0');

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', version: '0.1.0' }));

// POST /api/generate — full generation loop
app.post('/api/generate', async (c) => {
  const request = (await c.req.json()) as GenerationRequest;

  if (!request.graphEndpoint || !request.queries?.length || !request.goals?.length) {
    return c.json({ error: 'graphEndpoint, queries, and goals are required' }, 400);
  }

  try {
    const response = await runGenerationLoop(request, provider, evaluator);
    return c.json(response);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// POST /api/context — assemble context only (no generation)
app.post('/api/context', async (c) => {
  const { graphEndpoint, queries } = (await c.req.json()) as Pick<GenerationRequest, 'graphEndpoint' | 'queries'>;

  if (!graphEndpoint || !queries?.length) {
    return c.json({ error: 'graphEndpoint and queries are required' }, 400);
  }

  try {
    const context = await assembleContext(graphEndpoint, queries);
    return c.json(context);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// POST /api/evaluate — evaluate an externally written draft
app.post('/api/evaluate', async (c) => {
  const { graphEndpoint, queries, content, goals, expectedLength } = await c.req.json();

  if (!graphEndpoint || !queries?.length || !content || !goals?.length) {
    return c.json({ error: 'graphEndpoint, queries, content, and goals are required' }, 400);
  }

  try {
    const context = await assembleContext(graphEndpoint, queries);
    const citations = extractCitations(content, context);
    const wordCount = content.split(/\s+/).filter((w: string) => w.length > 0).length;
    const draft = {
      id: 'external',
      version: 1,
      content,
      citations,
      wordCount,
      createdAt: new Date().toISOString(),
    };
    const result = await evaluate(draft, goals, context, expectedLength, evaluator);
    return c.json({ evaluation: result, citations, wordCount });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// GET /api/drafts — list all persisted drafts
app.get('/api/drafts', async (c) => {
  const drafts = await listDrafts();
  return c.json(drafts);
});

// GET /api/drafts/:id — load a specific draft
app.get('/api/drafts/:id', async (c) => {
  const id = c.req.param('id');
  const response = await loadDraft(id);
  if (!response) return c.json({ error: 'Draft not found' }, 404);
  return c.json(response);
});

// ─── Start ─────────────────────────────────────────────────────────────────

const port = parseInt(process.env['GSG_PORT'] ?? '4446', 10);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Graph Story Generator listening on http://localhost:${port}`);
});

export { app };
