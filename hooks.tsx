import {useSetAtom} from 'jotai';
import {
  BoundingBoxes2DAtom,
  BoundingBoxes3DAtom,
  BoundingBoxMasksAtom,
  BumpSessionAtom,
  ErrorMessageAtom,
  HoverEnteredAtom,
  LinesAtom,
  PointsAtom,
  RequestJsonAtom,
  ResponseJsonAtom,
} from './atoms';

export function useResetState() {
  const setBoundingBoxes2D = useSetAtom(BoundingBoxes2DAtom);
  const setBoundingBoxMasks = useSetAtom(BoundingBoxMasksAtom);
  const setBoundingBoxes3D = useSetAtom(BoundingBoxes3DAtom);
  const setPoints = useSetAtom(PointsAtom);
  const setBumpSession = useSetAtom(BumpSessionAtom);
  const setRequestJson = useSetAtom(RequestJsonAtom);
  const setResponseJson = useSetAtom(ResponseJsonAtom);
  const setErrorMessage = useSetAtom(ErrorMessageAtom);
  const setHoverEntered = useSetAtom(HoverEnteredAtom);
  const setLines = useSetAtom(LinesAtom);

  return () => {
    setBoundingBoxes2D([]);
    setBoundingBoxMasks([]);
    setBoundingBoxes3D([]);
    setPoints([]);
    setLines([]);
    setRequestJson('');
    setResponseJson('');
    setErrorMessage('');
    setHoverEntered(false);
    setBumpSession((prev) => prev + 1);
  };
}