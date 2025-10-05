/**
 * Unit tests for matchRequest utilities
 *
 * Run with: npm test
 */

import { distanceToConfidence } from '../matchRequest.js';

describe('distanceToConfidence', () => {
  test('converts distance 0 to confidence 1.0 (perfect match)', () => {
    expect(distanceToConfidence(0)).toBe(1.0);
  });

  test('converts distance 1 to confidence 0.5 (moderate match)', () => {
    expect(distanceToConfidence(1)).toBe(0.5);
  });

  test('converts distance 2 to confidence 0.0 (no match)', () => {
    expect(distanceToConfidence(2)).toBe(0.0);
  });

  test('converts distance 0.5 to confidence 0.75', () => {
    expect(distanceToConfidence(0.5)).toBe(0.75);
  });

  test('converts distance 1.5 to confidence 0.25', () => {
    expect(distanceToConfidence(1.5)).toBe(0.25);
  });

  test('handles edge case: distance > 2 returns 0', () => {
    expect(distanceToConfidence(3)).toBe(0);
  });

  test('handles edge case: negative distance returns > 1 (clamped by Math.max)', () => {
    expect(distanceToConfidence(-1)).toBeGreaterThan(1);
  });
});

describe('match sorting', () => {
  test('matches should be sorted by rank (ascending)', () => {
    const matches = [
      { lostId: 'A', distance: 0.5, confidence: 0.75, rank: 2 },
      { lostId: 'B', distance: 0.3, confidence: 0.85, rank: 0 },
      { lostId: 'C', distance: 0.4, confidence: 0.80, rank: 1 },
    ];

    const sorted = matches.sort((a, b) => a.rank - b.rank);

    expect(sorted[0].lostId).toBe('B');
    expect(sorted[1].lostId).toBe('C');
    expect(sorted[2].lostId).toBe('A');
  });

  test('matches with lower distance should have higher confidence', () => {
    const distances = [0, 0.5, 1.0, 1.5, 2.0];
    const confidences = distances.map(distanceToConfidence);

    for (let i = 0; i < confidences.length - 1; i++) {
      expect(confidences[i]).toBeGreaterThanOrEqual(confidences[i + 1]);
    }
  });
});
