import { DETECT_TYPES, MODEL_IDS } from './Types';
import type { DetectTypes, ExampleImage, PromptTemplate, SpatialModel } from './Types';

export const drawColors = [
  '#0B1220',
  '#FFFFFF',
  '#E5484D',
  '#E28C17',
  '#49A078',
  '#2D7FF9',
  '#7A5AF8',
  '#12B3A8',
];

export const segmentationColors = [
  '#E5484D',
  '#2D7FF9',
  '#49A078',
  '#E28C17',
  '#7A5AF8',
  '#12B3A8',
  '#F97316',
  '#D946EF',
  '#84CC16',
  '#F43F5E',
];

export const segmentationColorsRgb: [number, number, number][] = segmentationColors.map(
  (hex) => {
    const normalized = hex.replace('#', '');
    return [
      parseInt(normalized.slice(0, 2), 16),
      parseInt(normalized.slice(2, 4), 16),
      parseInt(normalized.slice(4, 6), 16),
    ] as [number, number, number];
  },
);

export const modelOptions: { id: SpatialModel; label: string; hint: string }[] = [
  {
    id: MODEL_IDS[0],
    label: 'Vision Core v2',
    hint: 'Equilibrado para qualidade e latencia.',
  },
  {
    id: MODEL_IDS[1],
    label: 'Vision Lite v1',
    hint: 'Mais rapido para iteracao de prompt.',
  },
  {
    id: MODEL_IDS[2],
    label: 'Vision Depth v1',
    hint: 'Mais foco em consistencia de caixas 3D.',
  },
];

export const promptTemplates: Record<DetectTypes, PromptTemplate> = {
  '2D bounding boxes': {
    title: 'Deteccao 2D',
    helper:
      'Retorna caixas normalizadas no intervalo 0-1 para objetos encontrados na cena.',
    targetLabel: 'Objetos-alvo',
    targetPlaceholder: 'Ex: pallets, parafusos, caixas',
    promptPlaceholder:
      'Instrucao extra opcional. Ex: priorize objetos parcialmente ocluidos.',
  },
  'Segmentation masks': {
    title: 'Segmentacao',
    helper: 'Retorna caixa, mascara e rotulo para cada instancia detectada.',
    targetLabel: 'Classes para segmentar',
    targetPlaceholder: 'Ex: pecas azuis e cabos vermelhos',
    promptPlaceholder:
      'Ex: use rotulos tecnicos e descarte componentes menores que 2% da imagem.',
  },
  Points: {
    title: 'Pontos de interesse',
    helper:
      'Retorna pontos normalizados no intervalo 0-1 para referencia de manipulacao.',
    targetLabel: 'Pontos desejados',
    targetPlaceholder: 'Ex: centro de cada ferramenta',
    promptPlaceholder: 'Ex: priorize pontos com menor risco de colisao para a garra.',
  },
  '3D bounding boxes': {
    title: 'Deteccao 3D',
    helper: 'Retorna caixa 3D no formato [cx, cy, cz, l, w, h, rx, ry, rz].',
    targetLabel: 'Objetos para 3D',
    targetPlaceholder: 'Ex: caixas empilhadas e carrinhos',
    promptPlaceholder: 'Ex: prefira orientacoes alinhadas ao eixo principal da esteira.',
  },
};

export const defaultTargets: Record<DetectTypes, string> = {
  '2D bounding boxes': 'caixas e componentes',
  'Segmentation masks': 'objetos prioritarios',
  Points: 'pontos de pega',
  '3D bounding boxes': 'itens volumetricos',
};

export const defaultPromptDrafts: Record<DetectTypes, string> = {
  '2D bounding boxes':
    'Retorne ate 20 resultados com rotulos curtos e sem duplicar objetos.',
  'Segmentation masks':
    'Forneca mascaras consistentes, priorizando objetos com boa visibilidade.',
  Points: 'Retorne no maximo 12 pontos com rotulos claros para manipulacao.',
  '3D bounding boxes':
    'Retorne caixas estaveis para planejamento de movimento sem colisao.',
};

export const detectTypeOptions = [...DETECT_TYPES];

export const lineOptions = {
  size: 8,
  thinning: 0,
  smoothing: 0,
  streamline: 0,
  simulatePressure: false,
};

const makeRng = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const encodeSvg = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const buildScene = (
  seed: number,
  id: string,
  name: string,
  description: string,
  palette: [string, string, string],
): ExampleImage => {
  const rng = makeRng(seed);
  const blocks = Array.from({ length: 8 })
    .map(() => {
      const x = Math.round(rng() * 560 + 20);
      const y = Math.round(rng() * 320 + 20);
      const w = Math.round(rng() * 70 + 26);
      const h = Math.round(rng() * 64 + 24);
      const opacity = (0.2 + rng() * 0.45).toFixed(2);
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${palette[2]}" opacity="${opacity}" />`;
    })
    .join('');

  const points = Array.from({ length: 14 })
    .map(() => {
      const cx = Math.round(rng() * 620 + 10);
      const cy = Math.round(rng() * 400 + 10);
      const r = (rng() * 2 + 1).toFixed(1);
      const opacity = (0.45 + rng() * 0.5).toFixed(2);
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF" opacity="${opacity}" />`;
    })
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette[0]}" />
          <stop offset="100%" stop-color="${palette[1]}" />
        </linearGradient>
      </defs>
      <rect width="640" height="420" fill="url(#g)" />
      <rect x="34" y="34" width="572" height="352" rx="22" fill="rgba(7, 12, 22, 0.36)" stroke="rgba(255,255,255,0.2)" />
      ${blocks}
      ${points}
      <text x="38" y="398" fill="rgba(255,255,255,0.88)" font-size="22" font-family="Segoe UI, Tahoma, sans-serif">${name}</text>
    </svg>
  `;

  return {
    id,
    name,
    description,
    src: encodeSvg(svg),
  };
};

export const exampleImages: ExampleImage[] = [
  buildScene(
    11,
    'warehouse-bay',
    'Warehouse Bay',
    'Esteira com caixas e pecas em area de picking.',
    ['#112A46', '#1F5F8B', '#7AD3F5'],
  ),
  buildScene(
    23,
    'assembly-table',
    'Assembly Table',
    'Mesa de montagem com componentes de tamanhos variados.',
    ['#42275A', '#734B6D', '#E47B8E'],
  ),
  buildScene(
    37,
    'agro-sorting',
    'Agro Sorting',
    'Linha de triagem com itens organicos em bandejas.',
    ['#355C3C', '#4E944F', '#CFE8A9'],
  ),
  buildScene(
    49,
    'lab-bench',
    'Lab Bench',
    'Bancada tecnica com ferramentas de calibracao.',
    ['#1A1F36', '#2E3A59', '#9BB4FF'],
  ),
  buildScene(
    61,
    'retail-shelf',
    'Retail Shelf',
    'Prateleira com embalagens para inventario visual.',
    ['#4A2311', '#8C4A25', '#FFD7A0'],
  ),
  buildScene(
    73,
    'mobile-robot',
    'Mobile Robot View',
    'Visao frontal de robô em corredor logístico.',
    ['#132A13', '#31572C', '#A4D4AE'],
  ),
];
