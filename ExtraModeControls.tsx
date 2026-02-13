import {useAtom} from 'jotai';
import React from 'react';
import {DrawModeAtom, LinesAtom} from './atoms';
import {Palette} from './Palette';

export function ExtraModeControls() {
  const [drawMode, setDrawMode] = useAtom(DrawModeAtom);
  const [lines, setLines] = useAtom(LinesAtom);

  if (!drawMode) {
    return null;
  }

  return (
    <div className="draw-toolbar">
      <div className="draw-toolbar__left">
        <strong>Modo anotacao</strong>
        <span>{lines.length} traco(s) desenhado(s)</span>
      </div>

      <Palette />

      <div className="draw-toolbar__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setLines([])}
          disabled={lines.length === 0}>
          Limpar
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setDrawMode(false)}>
          Concluir
        </button>
      </div>
    </div>
  );
}