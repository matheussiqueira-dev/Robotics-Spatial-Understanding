import {useAtom} from 'jotai';
import getStroke from 'perfect-freehand';
import {useMemo, useState} from 'react';
import {
  BoundingBoxes2DAtom,
  BoundingBoxes3DAtom,
  BoundingBoxMasksAtom,
  DetectTypeAtom,
  ErrorMessageAtom,
  FovAtom,
  HoverEnteredAtom,
  ImageSrcAtom,
  IsLoadingAtom,
  IsThinkingEnabledAtom,
  LinesAtom,
  PointsAtom,
  PromptDraftsAtom,
  RequestJsonAtom,
  ResponseJsonAtom,
  SelectedModelAtom,
  TargetsAtom,
  TemperatureAtom,
} from './atoms';
import {lineOptions, modelOptions, promptTemplates} from './consts';
import {AnalyzeRequestBody, SpatialModel} from './Types';
import {requestSpatialAnalysis} from './services/spatialApi';
import {getSvgPathFromStroke, loadImage} from './utils';

const MAX_IMAGE_SIZE = 960;

export function Prompt() {
  const [detectType] = useAtom(DetectTypeAtom);
  const [targets, setTargets] = useAtom(TargetsAtom);
  const [promptDrafts, setPromptDrafts] = useAtom(PromptDraftsAtom);
  const [selectedModel, setSelectedModel] = useAtom(SelectedModelAtom);
  const [temperature, setTemperature] = useAtom(TemperatureAtom);
  const [isThinkingEnabled, setIsThinkingEnabled] = useAtom(IsThinkingEnabledAtom);
  const [fov, setFov] = useAtom(FovAtom);

  const [imageSrc] = useAtom(ImageSrcAtom);
  const [lines] = useAtom(LinesAtom);
  const [isLoading, setIsLoading] = useAtom(IsLoadingAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);

  const [, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [, setBoundingBoxMasks] = useAtom(BoundingBoxMasksAtom);
  const [, setPoints] = useAtom(PointsAtom);
  const [, setBoundingBoxes3D] = useAtom(BoundingBoxes3DAtom);

  const [, setRequestJson] = useAtom(RequestJsonAtom);
  const [, setResponseJson] = useAtom(ResponseJsonAtom);
  const [errorMessage, setErrorMessage] = useAtom(ErrorMessageAtom);

  const [responseTime, setResponseTime] = useState<string | null>(null);

  const template = promptTemplates[detectType];

  const canSubmit = useMemo(
    () => Boolean(imageSrc) && !isLoading,
    [imageSrc, isLoading],
  );

  const clearResults = () => {
    setBoundingBoxes2D([]);
    setBoundingBoxMasks([]);
    setPoints([]);
    setBoundingBoxes3D([]);
  };

  const composeImagePayload = async () => {
    if (!imageSrc) {
      throw new Error('Selecione uma imagem para continuar.');
    }

    const sourceImage = await loadImage(imageSrc);
    const scale = Math.min(
      1,
      MAX_IMAGE_SIZE / sourceImage.width,
      MAX_IMAGE_SIZE / sourceImage.height,
    );

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(sourceImage.width * scale));
    canvas.height = Math.max(1, Math.floor(sourceImage.height * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Falha ao inicializar contexto do canvas.');
    }

    context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

    if (lines.length > 0) {
      for (const line of lines) {
        const stroke = getStroke(
          line[0].map(([x, y]) => [x * canvas.width, y * canvas.height, 0.5]),
          lineOptions,
        );
        const path = new Path2D(getSvgPathFromStroke(stroke));
        context.fillStyle = line[1];
        context.fill(path);
      }
    }

    return canvas.toDataURL('image/png');
  };

  const handleSend = async () => {
    if (!canSubmit) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setRequestJson('');
    setResponseJson('');
    setResponseTime(null);
    clearResults();

    const startedAt = performance.now();

    try {
      const imageDataUrl = await composeImagePayload();
      const payload: AnalyzeRequestBody = {
        detectType,
        model: selectedModel,
        target: targets[detectType],
        prompt: promptDrafts[detectType],
        temperature,
        thinkingEnabled: isThinkingEnabled,
        fov,
        imageDataUrl,
        lines,
      };

      const payloadForInspector = {
        ...payload,
        imageDataUrl: '<REDACTED_IMAGE_DATA>',
      };
      setRequestJson(JSON.stringify(payloadForInspector, null, 2));

      const response = await requestSpatialAnalysis(payload);
      setResponseJson(JSON.stringify(response, null, 2));

      if (response.detectType === '2D bounding boxes') {
        setBoundingBoxes2D(response.items);
      } else if (response.detectType === 'Segmentation masks') {
        setBoundingBoxMasks(response.items);
      } else if (response.detectType === 'Points') {
        setPoints(response.items);
      } else {
        setBoundingBoxes3D(response.items);
      }

      setHoverEntered(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Nao foi possivel concluir a analise.';
      setErrorMessage(message);
      setResponseJson(
        JSON.stringify(
          {
            error: {
              message,
            },
          },
          null,
          2,
        ),
      );
    } finally {
      const duration = ((performance.now() - startedAt) / 1000).toFixed(2);
      setResponseTime(`${duration}s`);
      setIsLoading(false);
    }
  };

  return (
    <section className="panel section-card prompt-card">
      <div className="section-title">Comando de analise</div>

      <div className="field-grid">
        <label className="field">
          <span>Modelo</span>
          <select
            value={selectedModel}
            onChange={(event) =>
              setSelectedModel(event.target.value as SpatialModel)
            }
            disabled={isLoading}>
            {modelOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <small>{modelOptions.find((option) => option.id === selectedModel)?.hint}</small>
        </label>

        <label className="field">
          <span>{template.targetLabel}</span>
          <input
            type="text"
            value={targets[detectType]}
            placeholder={template.targetPlaceholder}
            onChange={(event) => {
              const value = event.target.value;
              setTargets((current) => ({
                ...current,
                [detectType]: value,
              }));
            }}
            disabled={isLoading}
          />
        </label>
      </div>

      <label className="field">
        <span>Prompt adicional</span>
        <textarea
          rows={3}
          value={promptDrafts[detectType]}
          placeholder={template.promptPlaceholder}
          onChange={(event) => {
            const value = event.target.value;
            setPromptDrafts((current) => ({
              ...current,
              [detectType]: value,
            }));
          }}
          disabled={isLoading}
        />
      </label>

      <div className="field-grid compact">
        <label className="field">
          <span>Temperatura</span>
          <div className="range-field">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(event) => setTemperature(Number(event.target.value))}
              disabled={isLoading}
            />
            <output>{temperature.toFixed(2)}</output>
          </div>
        </label>

        {detectType === '3D bounding boxes' ? (
          <label className="field">
            <span>FOV</span>
            <div className="range-field">
              <input
                type="range"
                min="35"
                max="105"
                step="1"
                value={fov}
                onChange={(event) => setFov(Number(event.target.value))}
                disabled={isLoading}
              />
              <output>{fov}°</output>
            </div>
          </label>
        ) : null}
      </div>

      <label className="toggle-field" htmlFor="thinking-mode">
        <input
          id="thinking-mode"
          type="checkbox"
          checked={isThinkingEnabled}
          onChange={(event) => setIsThinkingEnabled(event.target.checked)}
          disabled={isLoading}
        />
        <span>Habilitar modo analitico (respostas mais conservadoras)</span>
      </label>

      <div className="actions-row">
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleSend}
          disabled={!canSubmit}>
          {isLoading ? 'Analisando...' : 'Executar analise'}
        </button>

        <div className="metrics">
          {responseTime ? <span>Tempo total: {responseTime}</span> : <span>Sem execucoes recentes</span>}
        </div>
      </div>

      {isLoading ? (
        <p role="status" aria-live="polite" className="sr-only">
          Analise em andamento…
        </p>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="error-banner">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
