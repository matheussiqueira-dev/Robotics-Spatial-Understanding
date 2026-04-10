import { useAtom } from 'jotai';
import { detectTypeOptions, promptTemplates } from './consts';
import { DetectTypeAtom, HoverEnteredAtom } from './atoms';

export function DetectTypeSelector() {
  const [detectType, setDetectType] = useAtom(DetectTypeAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);

  return (
    <section className="panel section-card">
      <div className="section-title">Modo de analise</div>
      <div className="detect-grid" role="tablist" aria-label="Modo de analise">
        {detectTypeOptions.map((label) => (
          <button
            key={label}
            type="button"
            className={`detect-card ${detectType === label ? 'is-active' : ''}`}
            role="tab"
            aria-selected={detectType === label}
            onClick={() => {
              setHoverEntered(false);
              setDetectType(label);
            }}>
            <span className="detect-card__title">{promptTemplates[label].title}</span>
            <span className="detect-card__helper">{promptTemplates[label].helper}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
