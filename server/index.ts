import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { simulateSpatialAnalysis } from '../shared/spatialSimulation';
import { DETECT_TYPES, MODEL_IDS, type AnalyzeRequestBody } from '../Types';
import { logger } from './logger';

const app = express();

const port = Number(process.env.PORT ?? 8787);
const allowedOrigin = process.env.SPATIAL_ALLOWED_ORIGIN ?? '*';

// ── Zod schemas ───────────────────────────────────────────────────────────────

const detectTypeSchema = z.enum(DETECT_TYPES);
const modelSchema = z.enum(MODEL_IDS);

const lineSchema = z.tuple([
  z.array(z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)])).max(1200),
  z.string().min(4).max(20),
]);

const analyzeSchema = z.object({
  detectType: detectTypeSchema,
  model: modelSchema,
  target: z.string().trim().min(1).max(160),
  prompt: z.string().trim().min(1).max(1800),
  temperature: z.number().min(0).max(1),
  thinkingEnabled: z.boolean(),
  fov: z.number().min(30).max(120),
  imageDataUrl: z
    .string()
    .startsWith('data:image/')
    .max(7_000_000, 'Imagem excede limite de tamanho permitido.'),
  lines: z.array(lineSchema).max(180),
});

// ── Rate limiter ──────────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 80;

const ipCounters = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (ip: string): { allowed: boolean; remaining: number } => {
  const now = Date.now();
  const entry = ipCounters.get(ip);

  if (!entry || now >= entry.resetAt) {
    ipCounters.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - entry.count };
};

// ── Middleware ────────────────────────────────────────────────────────────────

app.disable('x-powered-by');

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  }),
);

app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
  }),
);

app.use(express.json({ limit: '8mb' }));

/** Structured request logger — logs method, path and status after response. */
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = performance.now();
  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(performance.now() - start),
      ip: req.ip,
    });
  });
  next();
});

/** Per-IP rate limiter. */
app.use((req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip ?? 'unknown';
  const result = checkRateLimit(ip);

  res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));

  if (!result.allowed) {
    res.status(429).json({
      error: {
        message: 'Limite de requisicoes excedido. Tente novamente em instantes.',
      },
    });
    return;
  }

  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'spatial-analysis-api',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/spatial/analyze', (req: Request, res: Response) => {
  const parsed = analyzeSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        message: 'Payload invalido para analise espacial.',
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  const payload = parsed.data as AnalyzeRequestBody;
  const startTime = performance.now();
  const result = simulateSpatialAnalysis(payload);
  const elapsed = Math.round(performance.now() - startTime);

  res.json({
    ...result,
    latencyMs: result.latencyMs + elapsed,
  });
});

// ── Global error handler ──────────────────────────────────────────────────────

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('unhandled error', { message });
  res.status(500).json({
    error: { message: 'Erro interno ao processar a requisicao.' },
  });
});

// ── Boot ──────────────────────────────────────────────────────────────────────

app.listen(port, () => {
  logger.info('server started', { port, allowedOrigin });
});
