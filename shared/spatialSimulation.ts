import {
  AnalyzeRequestBody,
  AnalyzeResponseBody,
  BoundingBox2DType,
  BoundingBox3DType,
  BoundingBoxMaskType,
  DetectTypes,
  PointingType,
} from '../Types';

const MIN_ITEMS = 2;
const MAX_ITEMS = 10;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const hashText = (input: string) => {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const makeRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const round = (value: number, precision = 4) => {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
};

const normalizeTarget = (target: string) => {
  const cleaned = target
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s,-]/gi, '')
    .replace(/\s+/g, ' ');
  return cleaned || 'item';
};

const buildLabels = (target: string, count: number) => {
  const tokens = normalizeTarget(target)
    .split(/[\s,]+/)
    .filter((token) => token.length > 2)
    .slice(0, 4);

  const base = tokens.length > 0 ? tokens : ['item'];

  return Array.from({length: count}, (_, index) => {
    const token = base[index % base.length] ?? 'item';
    return `${token}-${index + 1}`;
  });
};

const createMaskDataUrl = (seed: number, index: number) => {
  const rng = makeRng(seed + index * 31);
  const cx = Math.round(12 + rng() * 40);
  const cy = Math.round(12 + rng() * 40);
  const rx = Math.round(10 + rng() * 14);
  const ry = Math.round(10 + rng() * 14);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="black" /><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white" /></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const create2DItems = (
  target: string,
  rng: () => number,
  count: number,
): BoundingBox2DType[] => {
  const labels = buildLabels(target, count);
  return Array.from({length: count}, (_, index) => {
    const width = 0.12 + rng() * 0.2;
    const height = 0.1 + rng() * 0.2;
    const x = rng() * (1 - width);
    const y = rng() * (1 - height);

    return {
      x: round(clamp(x, 0, 0.95)),
      y: round(clamp(y, 0, 0.95)),
      width: round(clamp(width, 0.05, 0.5)),
      height: round(clamp(height, 0.05, 0.5)),
      label: labels[index],
      score: round(0.56 + rng() * 0.4, 3),
    };
  });
};

const createMaskItems = (
  target: string,
  rng: () => number,
  seed: number,
  count: number,
): BoundingBoxMaskType[] => {
  return create2DItems(target, rng, count).map((item, index) => ({
    ...item,
    imageData: createMaskDataUrl(seed, index),
  }));
};

const createPointItems = (
  target: string,
  rng: () => number,
  count: number,
): PointingType[] => {
  const labels = buildLabels(target, count);
  return Array.from({length: count}, (_, index) => ({
    point: {
      x: round(clamp(0.08 + rng() * 0.84, 0, 1)),
      y: round(clamp(0.08 + rng() * 0.84, 0, 1)),
    },
    label: labels[index],
    score: round(0.62 + rng() * 0.35, 3),
  }));
};

const create3DItems = (
  target: string,
  rng: () => number,
  count: number,
): BoundingBox3DType[] => {
  const labels = buildLabels(target, count);
  return Array.from({length: count}, (_, index) => {
    const centerX = round(-0.9 + rng() * 1.8, 3);
    const centerY = round(-0.6 + rng() * 1.2, 3);
    const centerZ = round(1 + rng() * 3.6, 3);
    const length = round(0.2 + rng() * 0.7, 3);
    const width = round(0.2 + rng() * 0.7, 3);
    const height = round(0.2 + rng() * 0.7, 3);
    const rotX = round((-0.3 + rng() * 0.6) * 0.3, 3);
    const rotY = round((-0.4 + rng() * 0.8) * 0.4, 3);
    const rotZ = round(-0.5 + rng() * 1.0, 3);

    return {
      box_3d: [centerX, centerY, centerZ, length, width, height, rotX, rotY, rotZ] as [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
      ],
      label: labels[index],
      score: round(0.52 + rng() * 0.4, 3),
    };
  });
};

const confidenceFromTemperature = (temperature: number) => {
  if (temperature <= 0.33) {
    return 'high' as const;
  }
  if (temperature <= 0.66) {
    return 'medium' as const;
  }
  return 'low' as const;
};

const buildCount = (mode: DetectTypes, rng: () => number) => {
  const baseByMode: Record<DetectTypes, number> = {
    '2D bounding boxes': 6,
    'Segmentation masks': 5,
    Points: 7,
    '3D bounding boxes': 4,
  };
  const spread = mode === '3D bounding boxes' ? 2 : 4;
  return clamp(
    baseByMode[mode] + Math.round((rng() - 0.5) * spread),
    MIN_ITEMS,
    MAX_ITEMS,
  );
};

export function simulateSpatialAnalysis(
  payload: AnalyzeRequestBody,
): AnalyzeResponseBody {
  const seed = hashText(
    [
      payload.detectType,
      payload.model,
      payload.target,
      payload.prompt,
      payload.temperature.toFixed(3),
      payload.lines.length,
      payload.thinkingEnabled ? 'think' : 'no-think',
    ].join('|'),
  );

  const rng = makeRng(seed);
  const count = buildCount(payload.detectType, rng);

  const note = payload.thinkingEnabled
    ? 'Modo analitico ativo: respostas mais conservadoras para reduzir falso-positivo.'
    : 'Modo rapido ativo: respostas mais objetivas para iteracao veloz.';

  const latencyMs = Math.round(220 + rng() * 540 + payload.lines.length * 8);

  const base = {
    requestId: `req_${seed.toString(16)}`,
    generatedAt: new Date().toISOString(),
    model: payload.model,
    latencyMs,
  };

  const makeSummary = (itemCount: number) => ({
    target: normalizeTarget(payload.target),
    itemCount,
    confidenceBand: confidenceFromTemperature(payload.temperature),
    note,
  });

  if (payload.detectType === '2D bounding boxes') {
    const items = create2DItems(payload.target, rng, count);
    return {...base, detectType: '2D bounding boxes' as const, summary: makeSummary(items.length), items};
  }

  if (payload.detectType === 'Segmentation masks') {
    const items = createMaskItems(payload.target, rng, seed, count);
    return {...base, detectType: 'Segmentation masks' as const, summary: makeSummary(items.length), items};
  }

  if (payload.detectType === 'Points') {
    const items = createPointItems(payload.target, rng, count);
    return {...base, detectType: 'Points' as const, summary: makeSummary(items.length), items};
  }

  const items = create3DItems(payload.target, rng, count);
  return {...base, detectType: '3D bounding boxes' as const, summary: makeSummary(items.length), items};
}