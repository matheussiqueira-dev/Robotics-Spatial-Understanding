import { describe, expect, it } from 'vitest';
import { simulateSpatialAnalysis } from '../shared/spatialSimulation';
import { validateAnalyzeResponse } from '../services/validators';
import type { AnalyzeRequestBody, DetectTypes } from '../Types';

const basePayload: AnalyzeRequestBody = {
  detectType: '2D bounding boxes',
  model: 'vision-core-v2',
  target: 'caixas e pecas',
  prompt: 'Retorne objetos principais',
  temperature: 0.4,
  thinkingEnabled: true,
  fov: 75,
  imageDataUrl: 'data:image/png;base64,ZmFrZQ==',
  lines: [],
};

// ─── simulateSpatialAnalysis ─────────────────────────────────────────────────

describe('simulateSpatialAnalysis', () => {
  it('returns stable deterministic output for identical input', () => {
    const first = simulateSpatialAnalysis(basePayload);
    const second = simulateSpatialAnalysis(basePayload);

    expect(first.requestId).toBe(second.requestId);
    expect(first.summary.itemCount).toBe(second.summary.itemCount);
    expect(first.items).toEqual(second.items);
  });

  it('produces different results for different targets', () => {
    const a = simulateSpatialAnalysis({ ...basePayload, target: 'alpha' });
    const b = simulateSpatialAnalysis({ ...basePayload, target: 'beta' });
    expect(a.requestId).not.toBe(b.requestId);
  });

  it('sets summary.confidenceBand to high when temperature <= 0.33', () => {
    const result = simulateSpatialAnalysis({ ...basePayload, temperature: 0.1 });
    expect(result.summary.confidenceBand).toBe('high');
  });

  it('sets summary.confidenceBand to medium for mid-range temperature', () => {
    const result = simulateSpatialAnalysis({ ...basePayload, temperature: 0.5 });
    expect(result.summary.confidenceBand).toBe('medium');
  });

  it('sets summary.confidenceBand to low when temperature > 0.66', () => {
    const result = simulateSpatialAnalysis({ ...basePayload, temperature: 0.9 });
    expect(result.summary.confidenceBand).toBe('low');
  });

  it('item count is within MIN_ITEMS and MAX_ITEMS bounds', () => {
    const detectTypes: DetectTypes[] = [
      '2D bounding boxes',
      'Segmentation masks',
      'Points',
      '3D bounding boxes',
    ];
    for (const detectType of detectTypes) {
      const result = simulateSpatialAnalysis({ ...basePayload, detectType });
      expect(result.summary.itemCount).toBeGreaterThanOrEqual(2);
      expect(result.summary.itemCount).toBeLessThanOrEqual(10);
    }
  });

  it('includes thinking note when thinkingEnabled is true', () => {
    const result = simulateSpatialAnalysis({
      ...basePayload,
      thinkingEnabled: true,
    });
    expect(result.summary.note).toContain('analitico');
  });

  it('includes fast note when thinkingEnabled is false', () => {
    const result = simulateSpatialAnalysis({
      ...basePayload,
      thinkingEnabled: false,
    });
    expect(result.summary.note).toContain('rapido');
  });

  // ── 2D bounding boxes ──────────────────────────────────────────────────────

  describe('2D bounding boxes', () => {
    it('items have normalised coordinates in [0, 1]', () => {
      const result = simulateSpatialAnalysis({
        ...basePayload,
        detectType: '2D bounding boxes',
      });
      for (const item of result.items) {
        const box = item as { x: number; y: number; width: number; height: number };
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x).toBeLessThanOrEqual(1);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeLessThanOrEqual(1);
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
    });

    it('item scores are in [0, 1]', () => {
      const result = simulateSpatialAnalysis({
        ...basePayload,
        detectType: '2D bounding boxes',
      });
      for (const item of result.items) {
        expect((item as { score: number }).score).toBeGreaterThanOrEqual(0);
        expect((item as { score: number }).score).toBeLessThanOrEqual(1);
      }
    });
  });

  // ── Segmentation masks ────────────────────────────────────────────────────

  describe('Segmentation masks', () => {
    it('each item contains a data URI imageData field', () => {
      const result = simulateSpatialAnalysis({
        ...basePayload,
        detectType: 'Segmentation masks',
      });
      for (const item of result.items) {
        expect((item as { imageData: string }).imageData).toMatch(/^data:image\//);
      }
    });
  });

  // ── Points ────────────────────────────────────────────────────────────────

  describe('Points', () => {
    it('items have a normalised point object', () => {
      const result = simulateSpatialAnalysis({
        ...basePayload,
        detectType: 'Points',
      });
      for (const item of result.items) {
        const pt = item as { point: { x: number; y: number } };
        expect(pt.point.x).toBeGreaterThanOrEqual(0);
        expect(pt.point.x).toBeLessThanOrEqual(1);
        expect(pt.point.y).toBeGreaterThanOrEqual(0);
        expect(pt.point.y).toBeLessThanOrEqual(1);
      }
    });
  });

  // ── 3D bounding boxes ─────────────────────────────────────────────────────

  describe('3D bounding boxes', () => {
    it('items have a 9-element box_3d array', () => {
      const result = simulateSpatialAnalysis({
        ...basePayload,
        detectType: '3D bounding boxes',
        model: 'vision-depth-v1',
      });
      for (const item of result.items) {
        const box3d = (item as { box_3d: number[] }).box_3d;
        expect(Array.isArray(box3d)).toBe(true);
        expect(box3d.length).toBe(9);
        for (const val of box3d) {
          expect(typeof val).toBe('number');
          expect(Number.isFinite(val)).toBe(true);
        }
      }
    });
  });
});

// ─── validateAnalyzeResponse ──────────────────────────────────────────────────

describe('validateAnalyzeResponse', () => {
  it('accepts a valid simulated 2D response', () => {
    const response = simulateSpatialAnalysis(basePayload);
    const parsed = validateAnalyzeResponse(response, '2D bounding boxes');
    expect(parsed.detectType).toBe('2D bounding boxes');
    expect(parsed.items.length).toBeGreaterThan(0);
  });

  it('accepts a valid simulated segmentation response', () => {
    const response = simulateSpatialAnalysis({
      ...basePayload,
      detectType: 'Segmentation masks',
    });
    const parsed = validateAnalyzeResponse(response, 'Segmentation masks');
    expect(parsed.detectType).toBe('Segmentation masks');
    expect(parsed.items.length).toBeGreaterThan(0);
  });

  it('accepts a valid simulated points response', () => {
    const response = simulateSpatialAnalysis({
      ...basePayload,
      detectType: 'Points',
    });
    const parsed = validateAnalyzeResponse(response, 'Points');
    expect(parsed.detectType).toBe('Points');
    expect(parsed.items.length).toBeGreaterThan(0);
  });

  it('accepts a valid simulated 3D response', () => {
    const response = simulateSpatialAnalysis({
      ...basePayload,
      detectType: '3D bounding boxes',
    });
    const parsed = validateAnalyzeResponse(response, '3D bounding boxes');
    expect(parsed.detectType).toBe('3D bounding boxes');
    expect(parsed.items.length).toBeGreaterThan(0);
  });

  it('throws when value is not an object', () => {
    expect(() => validateAnalyzeResponse('not-an-object', '2D bounding boxes')).toThrow(
      /invalida/i,
    );
  });

  it('throws when requestId is missing', () => {
    const broken = { ...simulateSpatialAnalysis(basePayload), requestId: undefined };
    expect(() => validateAnalyzeResponse(broken, '2D bounding boxes')).toThrow(
      /invalida/i,
    );
  });

  it('throws when detectType does not match expectedDetectType', () => {
    const response = simulateSpatialAnalysis({
      ...basePayload,
      detectType: '2D bounding boxes',
    });
    expect(() => validateAnalyzeResponse(response, 'Points')).toThrow(/invalida/i);
  });

  it('throws on malformed 2D bounding box items', () => {
    const malformed = {
      ...simulateSpatialAnalysis(basePayload),
      items: [{ label: 'broken' }],
    };
    expect(() => validateAnalyzeResponse(malformed, '2D bounding boxes')).toThrow(
      /invalida/i,
    );
  });

  it('throws on malformed segmentation mask items (missing imageData)', () => {
    const base = simulateSpatialAnalysis({
      ...basePayload,
      detectType: 'Segmentation masks',
    });
    const malformed = {
      ...base,
      items: [{ x: 0.1, y: 0.1, width: 0.2, height: 0.2, label: 'a', score: 0.9 }],
    };
    expect(() => validateAnalyzeResponse(malformed, 'Segmentation masks')).toThrow(
      /invalida/i,
    );
  });

  it('throws on malformed point items (missing point.x)', () => {
    const base = simulateSpatialAnalysis({
      ...basePayload,
      detectType: 'Points',
    });
    const malformed = {
      ...base,
      items: [{ point: { y: 0.5 }, label: 'a', score: 0.9 }],
    };
    expect(() => validateAnalyzeResponse(malformed, 'Points')).toThrow(/invalida/i);
  });

  it('throws on malformed 3D box items (wrong length)', () => {
    const base = simulateSpatialAnalysis({
      ...basePayload,
      detectType: '3D bounding boxes',
    });
    const malformed = {
      ...base,
      items: [{ box_3d: [1, 2, 3], label: 'a', score: 0.8 }],
    };
    expect(() => validateAnalyzeResponse(malformed, '3D bounding boxes')).toThrow(
      /invalida/i,
    );
  });

  it('throws when summary is absent', () => {
    const broken = { ...simulateSpatialAnalysis(basePayload), summary: undefined };
    expect(() => validateAnalyzeResponse(broken, '2D bounding boxes')).toThrow(
      /invalida/i,
    );
  });

  it('throws when items is not an array', () => {
    const broken = { ...simulateSpatialAnalysis(basePayload), items: 'bad' };
    expect(() => validateAnalyzeResponse(broken, '2D bounding boxes')).toThrow(
      /invalida/i,
    );
  });
});
