import type { AnalyzeRequestBody, AnalyzeResponseBody } from '../Types';
import { simulateSpatialAnalysis } from '../shared/spatialSimulation';
import { safeJsonParse } from '../utils';
import { validateAnalyzeResponse } from './validators';

const API_BASE = (import.meta.env.VITE_SPATIAL_API_BASE_URL ?? '/api/v1').replace(
  /\/$/,
  '',
);
const API_TIMEOUT_MS = Number(import.meta.env.VITE_SPATIAL_API_TIMEOUT_MS ?? 15000);
const ENABLE_LOCAL_FALLBACK = import.meta.env.VITE_ENABLE_LOCAL_FALLBACK !== 'false';

const getErrorMessage = (payload: unknown, status: number) => {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const candidate = (payload as { error?: unknown }).error;
    if (typeof candidate === 'string') {
      return candidate;
    }
    if (
      candidate &&
      typeof candidate === 'object' &&
      'message' in candidate &&
      typeof (candidate as { message?: unknown }).message === 'string'
    ) {
      return (candidate as { message: string }).message;
    }
  }

  return `Falha na API (${status}).`;
};

export async function requestSpatialAnalysis(
  request: AnalyzeRequestBody,
): Promise<AnalyzeResponseBody> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/spatial/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    const text = await response.text();
    const parsed = safeJsonParse(text);

    if (!response.ok) {
      throw new Error(getErrorMessage(parsed, response.status));
    }

    return validateAnalyzeResponse(parsed, request.detectType);
  } catch (error) {
    if (!ENABLE_LOCAL_FALLBACK) {
      throw error;
    }

    const simulated = simulateSpatialAnalysis(request);
    return {
      ...simulated,
      summary: {
        ...simulated.summary,
        note: `${simulated.summary.note} (fallback local ativado)`,
      },
    };
  } finally {
    window.clearTimeout(timeout);
  }
}
