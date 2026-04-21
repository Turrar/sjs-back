import { createHash } from 'crypto';

export function hashEmbeddingSource(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
