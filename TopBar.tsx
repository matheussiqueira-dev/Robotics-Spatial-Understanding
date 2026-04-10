import { useAtom } from 'jotai';
import {
  DetectTypeAtom,
  HoverEnteredAtom,
  IsLoadingAtom,
  RevealOnHoverModeAtom,
} from './atoms';
import { useResetState } from './hooks';

export function TopBar() {
  const resetState = useResetState();
  const [revealOnHover, setRevealOnHoverMode] = useAtom(RevealOnHoverModeAtom);
  const [detectType] = useAtom(DetectTypeAtom);
  const [isLoading] = useAtom(IsLoadingAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);

  const supportsReveal =
    detectType === '2D bounding boxes' || detectType === 'Segmentation masks';

  return (
    <header className="topbar">
      <div className="topbar__titleWrap">
        <p className="kicker">Spatial Vision Platform</p>
        <h1>Robotics Spatial Understanding</h1>
        <p className="topbar__subtitle">
          Analise visual para pipelines roboticos com foco em clareza operacional.
        </p>
      </div>

      <div className="topbar__actions">
        {supportsReveal ? (
          <label className="toggle-field" htmlFor="toggle-reveal-hover">
            <input
              id="toggle-reveal-hover"
              type="checkbox"
              checked={revealOnHover}
              onChange={(event) => {
                if (event.target.checked) {
                  setHoverEntered(false);
                }
                setRevealOnHoverMode(event.target.checked);
              }}
            />
            <span>Revelar somente ao passar o cursor</span>
          </label>
        ) : null}

        <button
          type="button"
          className="btn btn--ghost"
          onClick={resetState}
          disabled={isLoading}>
          Reiniciar sessao
        </button>
      </div>
    </header>
  );
}
