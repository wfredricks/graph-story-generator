/**
 * Prompt composition — pure functions that build LLM prompts
 * from graph context, backstory, goals, and audience.
 * @style pure
 */

import type { GraphContext, ExpectedLength, AudienceSpec } from './types.js';

/** Convert ExpectedLength to a human-readable instruction. */
function lengthInstruction(length: ExpectedLength | undefined): string {
  if (!length) return '';
  switch (length.kind) {
    case 'words': return `Target length: approximately ${length.count} words.`;
    case 'pages': return `Target length: approximately ${length.count} page${length.count === 1 ? '' : 's'}.`;
    case 'qualitative':
      const sizes: Record<string, string> = {
        'short-scene': 'a short scene (500–1,000 words)',
        'full-scene': 'a full scene (1,500–2,500 words)',
        'full-chapter': 'a full chapter (3,000–5,000 words)',
      };
      return `Target length: ${sizes[length.size] ?? length.size}.`;
  }
}

/** Convert AudienceSpec to a prompt section. */
function audienceInstruction(audience: AudienceSpec | undefined): string {
  if (!audience) return '';
  const parts: string[] = ['## Audience'];
  if (audience.label) parts.push(`Write for the audience identified by: ${audience.label}`);
  if (audience.properties) {
    for (const [key, value] of Object.entries(audience.properties)) {
      parts.push(`- ${key}: ${value}`);
    }
  }
  parts.push('Tailor tone, emphasis, and assumed knowledge to this audience.');
  return parts.join('\n');
}

/**
 * Build the initial generation prompt.
 * @style pure
 */
export function buildPrompt(
  context: GraphContext,
  backstory: string[],
  goals: string[],
  length: ExpectedLength | undefined,
  audience: AudienceSpec | undefined,
): string {
  const sections: string[] = [];

  // The context summary already separates throughline from color with explicit instructions.
  // Reinforce the distinction in the system prompt.
  const hasThroughline = context.throughlineNodeIds.length > 0;

  if (hasThroughline) {
    sections.push('You are a graph-grounded narrative generator. The source data below is organized into two layers:\n\n1. **Narrative Foundation (Through Line)** — these nodes define the story arc. Build the structure, sequence, and dramatic spine from this data.\n2. **Supporting Detail (Color)** — these nodes provide texture and depth. Weave them in to enrich the through line, but never let them hijack the narrative direction.\n\nEvery substantive claim must trace to a node in the graph context. Use [nodeId] inline citations when referencing graph data.');
  } else {
    sections.push('You are a graph-grounded narrative generator. Your output must be faithful to the source data provided below. Every substantive claim must trace to a node in the graph context. Use [nodeId] inline citations when referencing graph data.');
  }

  // Graph context (already separated into throughline/color sections)
  sections.push(context.summary);

  // Backstory
  if (backstory.length > 0) {
    sections.push('## Backstory Snippets\nWeave these authored fragments naturally into the narrative:\n');
    for (const snippet of backstory) {
      sections.push(`> ${snippet}`);
    }
  }

  // Goals
  sections.push('## Goals\nThe output MUST satisfy each of these criteria:\n');
  for (let i = 0; i < goals.length; i++) {
    sections.push(`${i + 1}. ${goals[i]}`);
  }

  // Length
  const lenInstr = lengthInstruction(length);
  if (lenInstr) sections.push(`\n## Length\n${lenInstr}`);

  // Audience
  const audInstr = audienceInstruction(audience);
  if (audInstr) sections.push(audInstr);

  sections.push('\n## Output Format\nWrite the narrative now. Include [nodeId] citations inline where claims reference graph nodes.');

  return sections.join('\n\n');
}

/**
 * Build a revision prompt targeting specific deficiencies.
 * @style pure
 */
export function buildRevisionPrompt(
  currentContent: string,
  reflection: string,
  context: GraphContext,
  goals: string[],
): string {
  const sections: string[] = [];

  sections.push('You are revising a draft to address specific deficiencies. The graph context and goals are unchanged. Focus your revisions on the deficiencies identified below — do not rewrite sections that already pass.');

  sections.push('## Current Draft\n');
  sections.push(currentContent);

  sections.push('## Deficiency Analysis\n');
  sections.push(reflection);

  sections.push('## Graph Context (for reference)\n');
  sections.push(context.summary);

  sections.push('## Goals (all must pass)\n');
  for (let i = 0; i < goals.length; i++) {
    sections.push(`${i + 1}. ${goals[i]}`);
  }

  sections.push('\n## Output Format\nWrite the complete revised narrative. Include [nodeId] citations inline. Preserve sections that already meet the goals; revise only what the deficiency analysis identifies.');

  return sections.join('\n\n');
}
