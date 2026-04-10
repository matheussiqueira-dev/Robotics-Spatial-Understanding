import {useSetAtom} from 'jotai';
import {
  BoundingBoxes2DAtom,
  BoundingBoxes3DAtom,
  BoundingBoxMasksAtom,
  BumpSessionAtom,
  ErrorMessageAtom,
  HoverEnteredAtom,
  IsLoadingAtom,
  LinesAtom,
  PointsAtom,
  RequestJsonAtom,
  ResponseJsonAtom,
} from './atoms';

/**
 * Returns a stable callback that resets all transient UI and result state
 * back to its initial values, effectively starting a fresh analysis session.
 *
 * Config atoms (model, temperature, FOV, targets, prompt drafts) are
 * intentionally left intact so the user's settings survive a reset.
 */
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
  const setIsLoading = useSetAtom(IsLoadingAtom);
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
    setIsLoading(false);
    setBumpSession((prev) => prev + 1);
  };
}
