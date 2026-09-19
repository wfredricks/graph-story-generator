/**
 * Draft persistence — file-based storage for generation responses.
 * @style effect
 */

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { GenerationResponse, DraftSummary } from './types.js';

const DRAFTS_DIR = join(process.cwd(), 'data', 'drafts');

async function ensureDir(): Promise<void> {
  await mkdir(DRAFTS_DIR, { recursive: true });
}

/**
 * Persist a generation response. Returns the draft ID.
 * @style effect
 */
export async function persistDraft(response: GenerationResponse): Promise<string> {
  await ensureDir();
  const id = response.draft.id;
  const path = join(DRAFTS_DIR, `${id}.json`);
  await writeFile(path, JSON.stringify(response, null, 2), 'utf-8');
  return id;
}

/**
 * Load a persisted generation response by draft ID.
 * @style effect
 */
export async function loadDraft(draftId: string): Promise<GenerationResponse | null> {
  try {
    const path = join(DRAFTS_DIR, `${draftId}.json`);
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as GenerationResponse;
  } catch {
    return null;
  }
}

/**
 * List all persisted draft summaries.
 * @style effect
 */
export async function listDrafts(): Promise<DraftSummary[]> {
  await ensureDir();
  const files = await readdir(DRAFTS_DIR);
  const summaries: DraftSummary[] = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await readFile(join(DRAFTS_DIR, file), 'utf-8');
      const resp = JSON.parse(raw) as GenerationResponse;
      const passCount = resp.trail.iterations.at(-1)?.evaluation.passCount ?? 0;
      const total = resp.request.goals.length;
      summaries.push({
        id: resp.draft.id,
        version: resp.draft.version,
        createdAt: resp.draft.createdAt,
        goalsSummary: `${passCount}/${total} goals passed`,
      });
    } catch {
      // Skip corrupted files
    }
  }

  return summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
