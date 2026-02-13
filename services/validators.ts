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

const assertBetween = (value: number, min: number, max: number) =>
  value >= min && value <= max;

const assertBoundingBox = (
  value: unknown,
  requireMask: boolean,
): value is BoundingBox2DType | BoundingBoxMaskType => {
  if (!isObject(value)) {
    return false;
  }

  const x = value.x;
  const y = value.y;
  const width = value.width;
  const height = value.height;
  const label = value.label;
  const score = value.score;

  if (
    !isNumber(x) ||
    !isNumber(y) ||
    !isNumber(width) ||
    !isNumber(height) ||
    !isString(label) ||
    !isNumber(score)
  ) {
    return false;
  }

  const validBounds =
    assertBetween(x, 0, 1) &&
    assertBetween(y, 0, 1) &&
    assertBetween(width, 0, 1) &&
    assertBetween(height, 0, 1);

  if (!validBounds) {
    return false;
  }

  if (!requireMask) {
    return true;
  }

  return (
    isString(value.imageData) && value.imageData.startsWith('data:image/')
  );
};

const assertPoint = (value: unknown): value is PointingType => {
  if (!isObject(value) || !isObject(value.point)) {
    return false;
  }

  const x = value.point.x;
  const y = value.point.y;

  return (
    isNumber(x) &&
    isNumber(y) &&
    assertBetween(x, 0, 1) &&
    assertBetween(y, 0, 1) &&
    isString(value.label) &&
    isNumber(value.score)
  );
};

const assert3DBox = (value: unknown): value is BoundingBox3DType => {
  if (!isObject(value) || !Array.isArray(value.box_3d)) {
    return false;
  }

  return (
    value.box_3d.length === 9 &&
    value.box_3d.every((item) => isNumber(item)) &&
    isString(value.label) &&
    isNumber(value.score)
  );
};

export function validateAnalyzeResponse(
  value: unknown,
  expectedDetectType: DetectTypes,
): AnalyzeResponseBody {
  if (!isObject(value)) {
    throw new Error('Resposta invalida: payload nao e objeto.');
  }

  if (!isString(value.requestId) || !isString(value.generatedAt)) {
    throw new Error('Resposta invalida: identificadores ausentes.');
  }

  if (!isString(value.detectType) || value.detectType !== expectedDetectType) {
    throw new Error('Resposta invalida: detectType inesperado.');
  }

  if (!isString(value.model) || !isNumber(value.latencyMs)) {
    throw new Error('Resposta invalida: metadados obrigatorios ausentes.');
  }

  if (!isObject(value.summary)) {
    throw new Error('Resposta invalida: resumo ausente.');
  }

  if (
    !isString(value.summary.target) ||
    !isNumber(value.summary.itemCount) ||
    !isString(value.summary.confidenceBand) ||
    !isString(value.summary.note)
  ) {
    throw new Error('Resposta invalida: formato de resumo incorreto.');
  }

  if (!Array.isArray(value.items)) {
    throw new Error('Resposta invalida: items nao e lista.');
  }

  if (expectedDetectType === '2D bounding boxes') {
    if (!value.items.every((item) => assertBoundingBox(item, false))) {
      throw new Error('Resposta invalida: caixas 2D malformadas.');
    }
  } else if (expectedDetectType === 'Segmentation masks') {
    if (!value.items.every((item) => assertBoundingBox(item, true))) {
      throw new Error('Resposta invalida: mascaras malformadas.');
    }
  } else if (expectedDetectType === 'Points') {
    if (!value.items.every(assertPoint)) {
      throw new Error('Resposta invalida: pontos malformados.');
    }
  } else if (!value.items.every(assert3DBox)) {
    throw new Error('Resposta invalida: caixas 3D malformadas.');
  }

  return value as AnalyzeResponseBody;
}