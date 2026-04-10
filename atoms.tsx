import {atom} from 'jotai';
import {
  defaultPromptDrafts,
  defaultTargets,
  drawColors,
  exampleImages,
  modelOptions,
} from './consts';
import type {
  BoundingBox2DType,
  BoundingBox3DType,
  BoundingBoxMaskType,
  DetectTypes,
  PointingType,
  SpatialModel,
} from './Types';

export const ImageSrcAtom = atom<string | null>(exampleImages[0]?.src ?? null);
export const SelectedExampleIdAtom = atom(exampleImages[0]?.id ?? '');
export const IsUploadedImageAtom = atom(false);

export const BoundingBoxes2DAtom = atom<BoundingBox2DType[]>([]);
export const BoundingBoxMasksAtom = atom<BoundingBoxMaskType[]>([]);
export const PointsAtom = atom<PointingType[]>([]);
export const BoundingBoxes3DAtom = atom<BoundingBox3DType[]>([]);

export const PromptDraftsAtom = atom<Record<DetectTypes, string>>({
  ...defaultPromptDrafts,
});

export const TargetsAtom = atom<Record<DetectTypes, string>>({
  ...defaultTargets,
});

export const RevealOnHoverModeAtom = atom(true);
export const DrawModeAtom = atom(false);
export const ActiveColorAtom = atom<string>(drawColors[0] ?? '#0B1220');
export const LinesAtom = atom<[[number, number][], string][]>([]);

export const TemperatureAtom = atom(0.4);
export const DetectTypeAtom = atom<DetectTypes>('2D bounding boxes');
export const SelectedModelAtom = atom<SpatialModel>(
  modelOptions[0]?.id ?? ('vision-core-v2' as const),
);
export const IsThinkingEnabledAtom = atom(false);
export const FovAtom = atom(75);

export const RequestJsonAtom = atom('');
export const ResponseJsonAtom = atom('');
export const ErrorMessageAtom = atom('');

export const HoverEnteredAtom = atom(false);
export const IsLoadingAtom = atom(false);

export const BumpSessionAtom = atom(0);
export const InitFinishedAtom = atom(true);