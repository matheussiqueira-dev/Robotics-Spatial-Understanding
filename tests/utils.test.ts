import { describe, expect, it } from 'vitest';
import { clamp, safeJsonParse, getSvgPathFromStroke } from '../utils';

describe('clamp', () => {
  it('returns the value when within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min when value is below', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('clamps to max when value is above', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns min when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('returns max when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
  });

  it('returns null for invalid JSON', () => {
    expect(safeJsonParse('not json')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(safeJsonParse('')).toBeNull();
  });

  it('parses a JSON array', () => {
    expect(safeJsonParse('[1,2,3]')).toEqual([1, 2, 3]);
  });
});

describe('getSvgPathFromStroke', () => {
  it('returns empty string for empty stroke', () => {
    expect(getSvgPathFromStroke([])).toBe('');
  });

  it('returns a non-empty path string for a single point', () => {
    const result = getSvgPathFromStroke([[10, 20]]);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/^M/);
  });

  it('returns a path string that closes with Z', () => {
    const result = getSvgPathFromStroke([
      [0, 0],
      [10, 0],
      [10, 10],
    ]);
    expect(result).toMatch(/Z$/);
  });
});
