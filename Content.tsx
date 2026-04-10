import {useAtom} from 'jotai';
import getStroke from 'perfect-freehand';
import {Fragment, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActiveColorAtom,
  BoundingBoxes2DAtom,
  BoundingBoxes3DAtom,
  BoundingBoxMasksAtom,
  DetectTypeAtom,
  DrawModeAtom,
  FovAtom,
  HoverEnteredAtom,
  ImageSrcAtom,
  LinesAtom,
  PointsAtom,
  RevealOnHoverModeAtom,
} from './atoms';
import {lineOptions, segmentationColorsRgb} from './consts';
import {BoundingBox3DType} from './Types';
import {getSvgPathFromStroke} from './utils';

const BOX_STROKE = '#2D7FF9';

export function Content() {
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [boundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [boundingBoxes3D] = useAtom(BoundingBoxes3DAtom);
  const [boundingBoxMasks] = useAtom(BoundingBoxMasksAtom);
  const [points] = useAtom(PointsAtom);
  const [detectType] = useAtom(DetectTypeAtom);
  const [revealOnHover] = useAtom(RevealOnHoverModeAtom);
  const [hoverEntered, setHoverEntered] = useAtom(HoverEnteredAtom);
  const [drawMode] = useAtom(DrawModeAtom);
  const [lines, setLines] = useAtom(LinesAtom);
  const [activeColor] = useAtom(ActiveColorAtom);
  const [fov] = useAtom(FovAtom);

  const [hoveredBox, setHoveredBox] = useState<number | null>(null);
  const [containerDims, setContainerDims] = useState({width: 0, height: 0});
  const [mediaDims, setMediaDims] = useState({width: 1, height: 1});

  const stageRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const isPointerDownRef = useRef(false);

  useEffect(() => {
    if (!stageRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setContainerDims({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const viewport = useMemo(() => {
    if (!containerDims.width || !containerDims.height) {
      return {width: 1, height: 1};
    }

    const mediaRatio = mediaDims.width / mediaDims.height;
    const containerRatio = containerDims.width / containerDims.height;

    if (mediaRatio < containerRatio) {
      return {
        width: containerDims.height * mediaRatio,
        height: containerDims.height,
      };
    }

    return {
      width: containerDims.width,
      height: containerDims.width / mediaRatio,
    };
  }, [containerDims, mediaDims]);

  /**
   * Determines which detection box the pointer is over using the normalised
   * coordinates already stored in state — no DOM query needed.
   * Items are sorted by area (ascending) so the smallest, most precise box
   * wins when items overlap.
   */
  const updateHoveredBox = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;

    const bounds = overlayRef.current.getBoundingClientRect();
    const nx = (event.clientX - bounds.left) / viewport.width;
    const ny = (event.clientY - bounds.top) / viewport.height;

    type BoxEntry = {index: number; area: number};

    const candidates: BoxEntry[] = [];

    if (detectType === '2D bounding boxes') {
      boundingBoxes2D.forEach((b, i) => {
        if (nx >= b.x && nx <= b.x + b.width && ny >= b.y && ny <= b.y + b.height) {
          candidates.push({index: i, area: b.width * b.height});
        }
      });
    } else if (detectType === 'Segmentation masks') {
      boundingBoxMasks.forEach((b, i) => {
        if (nx >= b.x && nx <= b.x + b.width && ny >= b.y && ny <= b.y + b.height) {
          candidates.push({index: i, area: b.width * b.height});
        }
      });
    }

    candidates.sort((a, b) => a.area - b.area);
    setHoveredBox(candidates[0]?.index ?? null);
  };

  const appendStrokePoint = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!overlayRef.current || !isPointerDownRef.current) {
      return;
    }

    const bounds = overlayRef.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / viewport.width;
    const y = (event.clientY - bounds.top) / viewport.height;

    setLines((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const updated = [...prev];
      const lastLine = updated[updated.length - 1];
      if (!lastLine) return prev;
      updated[updated.length - 1] = [[...lastLine[0], [x, y]], lastLine[1]];
      return updated;
    });
  };

  const beginStroke = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drawMode || !overlayRef.current) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    isPointerDownRef.current = true;

    const bounds = overlayRef.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / viewport.width;
    const y = (event.clientY - bounds.top) / viewport.height;

    setLines((prev) => [...prev, [[[x, y]], activeColor]]);
  };

  const endStroke = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drawMode) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    isPointerDownRef.current = false;
  };

  return (
    <section className="panel viewer-panel">
      <div className="viewer-stage" ref={stageRef}>
        {!imageSrc ? (
          <div className="viewer-placeholder">
            <h2>Nenhuma imagem selecionada</h2>
            <p>Carregue um arquivo local ou escolha um dos cenarios de exemplo.</p>
          </div>
        ) : null}

        {imageSrc ? (
          <img
            src={imageSrc}
            className="viewer-image"
            alt="Cena robotica carregada para analise espacial"
            onLoad={(event) => {
              setMediaDims({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              });
            }}
          />
        ) : null}

        <div
          ref={overlayRef}
          className={`viewer-overlay ${hoverEntered ? 'hide-boxes' : ''} ${drawMode ? 'drawing' : ''}`}
          style={{
            width: viewport.width,
            height: viewport.height,
          }}
          onPointerEnter={(event) => {
            if (revealOnHover && !drawMode) {
              setHoverEntered(true);
              updateHoveredBox(event);
            }
          }}
          onPointerMove={(event) => {
            if (revealOnHover && !drawMode) {
              setHoverEntered(true);
              updateHoveredBox(event);
            }
            appendStrokePoint(event);
          }}
          onPointerLeave={(event) => {
            if (revealOnHover && !drawMode) {
              setHoverEntered(false);
              updateHoveredBox(event);
            }
            isPointerDownRef.current = false;
          }}
          onPointerDown={beginStroke}
          onPointerUp={endStroke}>
          {(lines.length > 0 || detectType === '3D bounding boxes') && (
            <svg className="viewer-svg" aria-hidden>
              {lines.map(([pointsLine, color], index) => (
                <path
                  key={`line-${index}`}
                  d={getSvgPathFromStroke(
                    getStroke(
                      pointsLine.map(([x, y]) => [
                        x * viewport.width,
                        y * viewport.height,
                        0.5,
                      ]),
                      lineOptions,
                    ),
                  )}
                  fill={color}
                />
              ))}

              {detectType === '3D bounding boxes'
                ? boundingBoxes3D.map((box, index) => (
                    <Fragment key={`box3d-${index}`}>
                      <Box3D
                        box={box}
                        fov={fov}
                        mediaDims={mediaDims}
                        viewport={viewport}
                      />
                    </Fragment>
                  ))
                : null}
            </svg>
          )}

          {detectType === '2D bounding boxes'
            ? boundingBoxes2D.map((box, index) => (
                <div
                  key={`box2d-${index}`}
                  role="img"
                  aria-label={`${box.label}, confianca ${Math.round(box.score * 100)}%`}
                  className={`overlay-bbox bbox ${index === hoveredBox ? 'reveal' : ''}`}
                  style={{
                    top: `${box.y * 100}%`,
                    left: `${box.x * 100}%`,
                    width: `${box.width * 100}%`,
                    height: `${box.height * 100}%`,
                  }}>
                  <span className="bbox-label">
                    {box.label} ({Math.round(box.score * 100)}%)
                  </span>
                </div>
              ))
            : null}

          {detectType === 'Segmentation masks'
            ? boundingBoxMasks.map((box, index) => (
                <div
                  key={`mask-${index}`}
                  role="img"
                  aria-label={`Mascara: ${box.label}, confianca ${Math.round(box.score * 100)}%`}
                  className={`overlay-bbox bbox ${index === hoveredBox ? 'reveal' : ''}`}
                  style={{
                    top: `${box.y * 100}%`,
                    left: `${box.x * 100}%`,
                    width: `${box.width * 100}%`,
                    height: `${box.height * 100}%`,
                  }}>
                  <BoxMask box={box} index={index} />
                  <span className="bbox-label">
                    {box.label} ({Math.round(box.score * 100)}%)
                  </span>
                </div>
              ))
            : null}

          {detectType === 'Points'
            ? points.map((item, index) => (
                <div
                  key={`point-${index}`}
                  role="img"
                  aria-label={`Ponto: ${item.label}, confianca ${Math.round(item.score * 100)}%`}
                  className="point-marker"
                  style={{
                    left: `${item.point.x * 100}%`,
                    top: `${item.point.y * 100}%`,
                  }}>
                  <span className="point-label">
                    {item.label} ({Math.round(item.score * 100)}%)
                  </span>
                </div>
              ))
            : null}
        </div>
      </div>
    </section>
  );
}

function Box3D({
  box,
  fov,
  mediaDims,
  viewport,
}: {
  box: BoundingBox3DType;
  fov: number;
  mediaDims: {width: number; height: number};
  viewport: {width: number; height: number};
}) {
  const corners = useMemo(() => {
    const [cx, cy, cz, l, w, h, rx, ry, rz] = box.box_3d;

    const crx = Math.cos(rx);
    const srx = Math.sin(rx);
    const cry = Math.cos(ry);
    const sry = Math.sin(ry);
    const crz = Math.cos(rz);
    const srz = Math.sin(rz);

    const result: [number, number, number][] = [];

    for (let k = -1; k <= 1; k += 2) {
      for (let j = -1; j <= 1; j += 2) {
        for (let i = -1; i <= 1; i += 2) {
          let x = (i * l) / 2;
          let y = (j * w) / 2;
          let z = (k * h) / 2;

          let dy = y * crx - z * srx;
          let dz = y * srx + z * crx;
          y = dy;
          z = dz;

          let dx = x * cry + z * sry;
          dz = -x * sry + z * cry;
          x = dx;
          z = dz;

          dx = x * crz - y * srz;
          dy = x * srz + y * crz;
          x = dx;
          y = dy;

          result.push([x + cx, y + cy, z + cz]);
        }
      }
    }

    return result;
  }, [box.box_3d]); // eslint-disable-line react-hooks/exhaustive-deps

  const projectedCorners = useMemo(() => {
    if (!corners) {
      return null;
    }

    const fovRad = (fov * Math.PI) / 180;
    const focalLength = mediaDims.width / 2 / Math.tan(fovRad / 2);
    const centerX = mediaDims.width / 2;
    const centerY = mediaDims.height / 2;

    return corners.map(([x, y, z]) => {
      if (z <= 0.1) {
        return null;
      }

      const scale = focalLength / z;
      const u = x * scale + centerX;
      const v = y * scale + centerY;
      return [u, v];
    });
  }, [corners, fov, mediaDims]);

  if (!projectedCorners) {
    return null;
  }

  const edges: [number, number][] = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];

  const scaleX = viewport.width / mediaDims.width;
  const scaleY = viewport.height / mediaDims.height;

  return (
    <g>
      {edges.map(([start, end], index) => {
        const p1 = projectedCorners[start];
        const p2 = projectedCorners[end];
        if (!p1 || !p2) {
          return null;
        }

        return (
          <line
            key={`line-${index}`}
            x1={p1[0] * scaleX}
            y1={p1[1] * scaleY}
            x2={p2[0] * scaleX}
            y2={p2[1] * scaleY}
            stroke={BOX_STROKE}
            strokeWidth={2}
          />
        );
      })}
      <text
        x={16}
        y={22}
        fill="#EAF2FF"
        fontSize="12"
        fontWeight={600}
        stroke="#0B1220"
        strokeWidth="0.4">
        {box.label}
      </text>
    </g>
  );
}

function BoxMask({
  box,
  index,
}: {
  box: {imageData: string};
  index: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Fallback cast is safe: literal [0,0,0] must be tuple not number[]
  const rgb: [number, number, number] =
    segmentationColorsRgb[index % segmentationColorsRgb.length] ??
    ([0, 0, 0] as [number, number, number]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const context = canvasRef.current.getContext('2d');
    if (!context) {
      return;
    }

    const image = new Image();
    image.src = box.imageData;
    image.onload = () => {
      if (!canvasRef.current) {
        return;
      }

      canvasRef.current.width = image.width;
      canvasRef.current.height = image.height;

      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, image.width, image.height);

      for (let cursor = 0; cursor < pixels.data.length; cursor += 4) {
        // noUncheckedIndexedAccess: guard the TypedArray read; the write side
        // is always valid for Uint8ClampedArray.
        const srcAlpha = pixels.data[cursor] ?? 0;
        pixels.data[cursor + 3] = srcAlpha;
        pixels.data[cursor] = rgb[0];
        pixels.data[cursor + 1] = rgb[1];
        pixels.data[cursor + 2] = rgb[2];
      }

      context.putImageData(pixels, 0, 0);
    };
  }, [box.imageData, rgb]);

  return <canvas ref={canvasRef} className="mask-canvas" />;
}
