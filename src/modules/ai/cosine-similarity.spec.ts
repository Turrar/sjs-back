import { cosineSimilarity } from './cosine-similarity';

describe('cosineSimilarity', () => {
  it('returns 1 for identical unit vectors', () => {
    const v = [1, 0, 0];
    expect(cosineSimilarity(v, v)).toBe(1);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it('returns 0 for length mismatch', () => {
    expect(cosineSimilarity([1], [1, 0])).toBe(0);
  });
});
