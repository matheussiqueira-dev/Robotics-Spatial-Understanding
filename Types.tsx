export const DETECT_TYPES = [
  '2D bounding boxes',
  'Segmentation masks',
  'Points',
  '3D bounding boxes',
] as const;

export type DetectTypes = (typeof DETECT_TYPES)[number];

export const MODEL_IDS = [
  'vision-core-v2',
  'vision-lite-v1',
  'vision-depth-v1',
] as const;

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
  box_3d: number[];
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

export type AnalyzeResponseBody = {
  requestId: string;
  generatedAt: string;
  detectType: DetectTypes;
  model: string;
  latencyMs: number;
  summary: AnalyzeSummary;
  items:
    | BoundingBox2DType[]
    | BoundingBoxMaskType[]
    | PointingType[]
    | BoundingBox3DType[];
};