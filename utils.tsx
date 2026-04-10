export function getSvgPathFromStroke(stroke: number[][]): string {
  if (stroke.length === 0) return '';

  const first = stroke[0];
  if (!first) return '';

  const d = stroke.reduce(
    (acc, point, i, arr) => {
      const x0 = point[0] ?? 0;
      const y0 = point[1] ?? 0;
      const next = arr[(i + 1) % arr.length];
      const x1 = next?.[0] ?? 0;
      const y1 = next?.[1] ?? 0;
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', first[0] ?? 0, first[1] ?? 0, 'Q'] as (string | number)[],
  );

  d.push('Z');
  return d.join(' ');
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
