import {useAtom} from 'jotai';
import React from 'react';
import {ActiveColorAtom} from './atoms';
import {drawColors} from './consts';

export function Palette() {
  const [activeColor, setActiveColor] = useAtom(ActiveColorAtom);

  return (
    <div className="palette" role="radiogroup" aria-label="Cores de anotacao">
      {drawColors.map((color) => (
        <button
          key={color}
          type="button"
          className={`palette__swatch ${activeColor === color ? 'is-active' : ''}`}
          style={{'--swatch': color} as React.CSSProperties}
          onClick={() => setActiveColor(color)}
          role="radio"
          aria-checked={activeColor === color}
          aria-label={`Selecionar cor ${color}`}
        />
      ))}
    </div>
  );
}