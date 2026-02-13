import {describe, expect, it} from 'vitest';
import {simulateSpatialAnalysis} from '../shared/spatialSimulation';
import {validateAnalyzeResponse} from '../services/validators';
import {AnalyzeRequestBody} from '../Types';

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

describe('simulateSpatialAnalysis', () => {
  it('returns stable deterministic payload for identical input', () => {
    const first = simulateSpatialAnalysis(basePayload);
    const second = simulateSpatialAnalysis(basePayload);

    expect(first.requestId).toBe(second.requestId);
    expect(first.summary.itemCount).toBe(second.summary.itemCount);
    expect(first.items).toEqual(second.items);
  });

  it('builds valid 3D payload shape', () => {
    const response = simulateSpatialAnalysis({
      ...basePayload,
      detectType: '3D bounding boxes',
      model: 'vision-depth-v1',
    });

    const firstItem = response.items[0] as {box_3d: number[]};
    expect(Array.isArray(firstItem.box_3d)).toBe(true);
    expect(firstItem.box_3d.length).toBe(9);
  });
});

describe('validateAnalyzeResponse', () => {
  it('accepts valid simulated response', () => {
    const response = simulateSpatialAnalysis(basePayload);
    const parsed = validateAnalyzeResponse(response, basePayload.detectType);

    expect(parsed.detectType).toBe(basePayload.detectType);
    expect(parsed.items.length).toBeGreaterThan(0);
  });

  it('throws on invalid item payload', () => {
    const malformed = {
      ...simulateSpatialAnalysis(basePayload),
      items: [{label: 'broken'}],
    };

    expect(() =>
      validateAnalyzeResponse(malformed, basePayload.detectType),
    ).toThrow(/invalida/i);
  });
});