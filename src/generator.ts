/**
 * LLM generation — effect function that calls the LLM provider
 * and returns a Draft.
 * @style effect
 */

import { randomUUID } from 'node:crypto';
import type { Draft, GraphContext, LlmProvider } from './types.js';
import { extractCitations } from './citations.js';

/**
 * Generate a draft by calling the LLM with the given prompt.
 * Extracts citations and computes word count from the response.
 * @style effect
 */
export async function generate(
  prompt: string,
  context: GraphContext,
  provider: LlmProvider,
  version: number = 1,
): Promise<Draft> {
  const content = await provider.generate(prompt);
  const citations = extractCitations(content, context);
  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;

  return {
    id: randomUUID(),
    version,
    content,
    citations,
    wordCount,
    createdAt: new Date().toISOString(),
  };
}
