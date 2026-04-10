export const DETECT_TYPES = [
  '2D bounding boxes',
  'Segmentation masks',
  'Points',
  '3D bounding boxes',
] as const;

export type DetectTypes = (typeof DETECT_TYPES)[number];

export const MODEL_IDS = ['vision-core-v2', 'vision-lite-v1', 'vision-depth-v1'] as const;

export type SpatialModel = (typeof MODEL_IDS)[number];

export type BoundingBox2DType = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  score: number;
};

export type BoundingBoxMaskType = BoundingBox2DType & {
  imageData: string;
};

export type PointingType = {
  point: {
    x: number;
    y: number;
  };
  label: string;
  score: number;
};

export type BoundingBox3DType = {
  box_3d: [number, number, number, number, number, number, number, number, number];
  label: string;
  score: number;
};

export type DrawLine = [[number, number][], string];

export type PromptTemplate = {
  title: string;
  helper: string;
  targetLabel: string;
  targetPlaceholder: string;
  promptPlaceholder: string;
};

export type ExampleImage = {
  id: string;
  name: string;
  description: string;
  src: string;
};

export type AnalyzeRequestBody = {
  detectType: DetectTypes;
  model: SpatialModel;
  target: string;
  prompt: string;
  temperature: number;
  thinkingEnabled: boolean;
  fov: number;
  imageDataUrl: string;
  lines: DrawLine[];
};

export type AnalyzeSummary = {
  target: string;
  itemCount: number;
  confidenceBand: 'low' | 'medium' | 'high';
  note: string;
};

/**
 * Shared metadata fields carried by every response variant.
 * Kept as a base type to avoid repetition across the discriminated union members.
 */
type AnalyzeResponseBase = {
  requestId: string;
  generatedAt: string;
  model: string;
  latencyMs: number;
  summary: AnalyzeSummary;
};

/**
 * Discriminated union keyed on `detectType`.
 * Narrowing on `response.detectType` yields the correct `items` array type
 * without any unsafe `as` casts.
 */
export type AnalyzeResponseBody =
  | (AnalyzeResponseBase & {
      detectType: '2D bounding boxes';
      items: BoundingBox2DType[];
    })
  | (AnalyzeResponseBase & {
      detectType: 'Segmentation masks';
      items: BoundingBoxMaskType[];
    })
  | (AnalyzeResponseBase & {
      detectType: 'Points';
      items: PointingType[];
    })
  | (AnalyzeResponseBase & {
      detectType: '3D bounding boxes';
      items: BoundingBox3DType[];
    });
