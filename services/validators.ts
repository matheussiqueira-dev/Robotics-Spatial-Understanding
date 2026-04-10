import {
  AnalyzeResponseBody,
  BoundingBox2DType,
  BoundingBox3DType,
  BoundingBoxMaskType,
  DetectTypes,
  PointingType,
} from '../Types';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isBetween = (value: number, min: number, max: number) =>
  value >= min && value <= max;

const assertBoundingBox2D = (value: unknown): value is BoundingBox2DType => {
  if (!isObject(value)) return false;
  const {x, y, width, height, label, score} = value;
  return (
    isNumber(x) &&
    isNumber(y) &&
    isNumber(width) &&
    isNumber(height) &&
    isString(label) &&
    isNumber(score) &&
    isBetween(x, 0, 1) &&
    isBetween(y, 0, 1) &&
    isBetween(width, 0, 1) &&
    isBetween(height, 0, 1)
  );
};

const assertBoundingBoxMask = (value: unknown): value is BoundingBoxMaskType => {
  if (!assertBoundingBox2D(value)) return false;
  // Re-widen to Record so we can check the extra imageData field that
  // BoundingBox2DType does not declare.
  const rec = value as unknown as Record<string, unknown>;
  return isString(rec['imageData']) && rec['imageData'].startsWith('data:image/');
};

const assertPoint = (value: unknown): value is PointingType => {
  if (!isObject(value) || !isObject(value['point'])) return false;
  const {x, y} = value['point'];
  return (
    isNumber(x) &&
    isNumber(y) &&
    isBetween(x, 0, 1) &&
    isBetween(y, 0, 1) &&
    isString(value['label']) &&
    isNumber(value['score'])
  );
};

const assert3DBox = (value: unknown): value is BoundingBox3DType => {
  if (!isObject(value) || !Array.isArray(value['box_3d'])) return false;
  return (
    value['box_3d'].length === 9 &&
    (value['box_3d'] as unknown[]).every((item) => isNumber(item)) &&
    isString(value['label']) &&
    isNumber(value['score'])
  );
};

/**
 * Validates a raw API response against the expected `detectType` and returns a
 * fully-typed `AnalyzeResponseBody` discriminated-union value.
 *
 * Throws a descriptive `Error` on any shape mismatch so the caller can surface
 * the message directly without additional inspection.
 */
export function validateAnalyzeResponse(
  value: unknown,
  expectedDetectType: DetectTypes,
): AnalyzeResponseBody {
  if (!isObject(value)) {
    throw new Error('Resposta invalida: payload nao e objeto.');
  }

  if (!isString(value['requestId']) || !isString(value['generatedAt'])) {
    throw new Error('Resposta invalida: identificadores ausentes.');
  }

  if (
    !isString(value['detectType']) ||
    value['detectType'] !== expectedDetectType
  ) {
    throw new Error('Resposta invalida: detectType inesperado.');
  }

  if (!isString(value['model']) || !isNumber(value['latencyMs'])) {
    throw new Error('Resposta invalida: metadados obrigatorios ausentes.');
  }

  if (!isObject(value['summary'])) {
    throw new Error('Resposta invalida: resumo ausente.');
  }

  const summary = value['summary'];
  if (
    !isString(summary['target']) ||
    !isNumber(summary['itemCount']) ||
    !isString(summary['confidenceBand']) ||
    !isString(summary['note'])
  ) {
    throw new Error('Resposta invalida: formato de resumo incorreto.');
  }

  if (!Array.isArray(value['items'])) {
    throw new Error('Resposta invalida: items nao e lista.');
  }

  const items: unknown[] = value['items'];

  if (expectedDetectType === '2D bounding boxes') {
    if (!items.every(assertBoundingBox2D)) {
      throw new Error('Resposta invalida: caixas 2D malformadas.');
    }
    return value as AnalyzeResponseBody & {detectType: '2D bounding boxes'};
  }

  if (expectedDetectType === 'Segmentation masks') {
    if (!items.every(assertBoundingBoxMask)) {
      throw new Error('Resposta invalida: mascaras malformadas.');
    }
    return value as AnalyzeResponseBody & {detectType: 'Segmentation masks'};
  }

  if (expectedDetectType === 'Points') {
    if (!items.every(assertPoint)) {
      throw new Error('Resposta invalida: pontos malformados.');
    }
    return value as AnalyzeResponseBody & {detectType: 'Points'};
  }

  if (!items.every(assert3DBox)) {
    throw new Error('Resposta invalida: caixas 3D malformadas.');
  }
  return value as AnalyzeResponseBody & {detectType: '3D bounding boxes'};
}
