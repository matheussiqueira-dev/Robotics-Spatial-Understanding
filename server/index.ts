import cors from 'cors';
import express, {NextFunction, Request, Response} from 'express';
import helmet from 'helmet';
import {z} from 'zod';
import {simulateSpatialAnalysis} from '../shared/spatialSimulation';
import {AnalyzeRequestBody, DETECT_TYPES, MODEL_IDS} from '../Types';

const app = express();

const port = Number(process.env.PORT || 8787);
const allowedOrigin = process.env.SPATIAL_ALLOWED_ORIGIN || '*';

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

const rateLimitWindowMs = 60_000;
const maxRequestsPerWindow = 80;

const ipCounters = new Map<string, {count: number; resetAt: number}>();

const checkRateLimit = (ip: string) => {
  const now = Date.now();
  const item = ipCounters.get(ip);

  if (!item || now >= item.resetAt) {
    ipCounters.set(ip, {count: 1, resetAt: now + rateLimitWindowMs});
    return {allowed: true, remaining: maxRequestsPerWindow - 1};
  }

  if (item.count >= maxRequestsPerWindow) {
    return {allowed: false, remaining: 0};
  }

  item.count += 1;
  ipCounters.set(ip, item);
  return {allowed: true, remaining: maxRequestsPerWindow - item.count};
};

app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: {policy: 'cross-origin'},
    contentSecurityPolicy: false,
  }),
);
app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
  }),
);
app.use(express.json({limit: '8mb'}));

app.use((req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const result = checkRateLimit(ip);
  res.setHeader('X-RateLimit-Limit', String(maxRequestsPerWindow));
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

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[spatial-api] unhandled error', error);
  res.status(500).json({
    error: {
      message: 'Erro interno ao processar a requisicao.',
    },
  });
});

app.listen(port, () => {
  console.log(`[spatial-api] listening on http://localhost:${port}`);
});