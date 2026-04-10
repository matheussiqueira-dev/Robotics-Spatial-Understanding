# Robotics Spatial Understanding

![CI](https://github.com/matheussiqueira-dev/Robotics-Spatial-Understanding/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node 20+](https://img.shields.io/badge/Node-20%2B-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)

Plataforma fullstack para analise espacial de cenas roboticas. Interface web moderna com API dedicada para inferencia visual de objetos em 2D, segmentacao por instancia, pontos de interesse e caixas delimitadoras 3D.

---

## Visao geral

O sistema apoia operacoes de robotica aplicada — picking, inventario visual, inspecao e manipulacao assistida — com foco em:

- Iteracao rapida de prompt e parametros de analise
- Visualizacao tecnica clara das deteccoes sobre a imagem
- Contrato de API estavel, versionado e com validacao rigorosa
- Arquitetura preparada para substituicao do simulador por motores de inferencia reais

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend  (React 19 + Vite + TypeScript)                   │
│                                                             │
│  ┌───────────┬───────────────────┬──────────────────────┐  │
│  │ TopBar    │ Content Viewer    │ Inspector (JSON)     │  │
│  │ SideCtrls │ (Canvas + SVG)    │ Request / Response   │  │
│  │ Examples  │ Overlays          │                      │  │
│  │ DetectSel │ DrawMode          │                      │  │
│  │ Prompt    │                   │                      │  │
│  └───────────┴───────────────────┴──────────────────────┘  │
│              │                                              │
│  ┌───────────▼────────────────────────────────────────────┐ │
│  │ Jotai Atoms (state)                                    │ │
│  │ image · detections · ui · config · session            │ │
│  └───────────┬────────────────────────────────────────────┘ │
│              │                                              │
│  ┌───────────▼────────────────────────────────────────────┐ │
│  │ services/spatialApi.ts  (HTTP client + fallback)       │ │
│  │ services/validators.ts  (runtime type guards)          │ │
│  └───────────┬────────────────────────────────────────────┘ │
└──────────────┼──────────────────────────────────────────────┘
               │ Vite proxy /api → :8787
┌──────────────▼──────────────────────────────────────────────┐
│  Backend  (Express 5 + Zod + Helmet)                        │
│                                                             │
│  POST /api/v1/spatial/analyze                               │
│  GET  /api/v1/health                                        │
│                                                             │
│  • Zod schema validation                                    │
│  • Per-IP rate limiting (80 req/min)                        │
│  • Content-Security-Policy via Helmet                       │
│  • Structured JSON logging                                  │
│  • simulateSpatialAnalysis  (shared/spatialSimulation.ts)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Modos de deteccao

| Modo | Saida | Uso tipico |
|---|---|---|
| **2D Bounding Boxes** | `[x, y, w, h]` normalizado 0-1 | Picking, contagem |
| **Segmentation Masks** | Caixa + mascara SVG por instancia | Inspeccao, separacao |
| **Points** | Ponto `(x, y)` normalizado | Planejamento de garra |
| **3D Bounding Boxes** | `[cx,cy,cz, l,w,h, rx,ry,rz]` | Manipulacao assistida |

---

## Stack

**Frontend:** React 19, TypeScript 5.8, Vite 6, Jotai, perfect-freehand
**Backend:** Express 5, Zod, Helmet, CORS
**Qualidade:** Vitest, ESLint (typescript-eslint strict), Prettier, GitHub Actions CI

---

## Estrutura do projeto

```
.
├── App.tsx                  # Layout principal
├── Content.tsx              # Viewer de imagem + overlays de deteccao
├── Prompt.tsx               # Painel de configuracao e execucao
├── TopBar.tsx               # Cabecalho e controles globais
├── SideControls.tsx         # Upload e modo de anotacao
├── DetectTypeSelector.tsx   # Seletor de modo de deteccao
├── ExampleImages.tsx        # Cenarios de exemplo (SVG procedural)
├── ExtraModeControls.tsx    # Toolbar de anotacao
├── Palette.tsx              # Seletor de cor para anotacoes
├── ErrorBoundary.tsx        # React error boundary
├── atoms.tsx                # Estado global (Jotai)
├── hooks.tsx                # useResetState
├── Types.tsx                # Tipos de dominio (union discriminada)
├── consts.tsx               # Templates, exemplos e opcoes
├── utils.tsx                # Utilitarios puros
├── services/
│   ├── spatialApi.ts        # Cliente HTTP com fallback local
│   └── validators.ts        # Guards de runtime
├── shared/
│   └── spatialSimulation.ts # Simulador deterministico (RNG com seed)
├── server/
│   ├── index.ts             # API Express
│   └── logger.ts            # Logger JSON estruturado
├── tests/
│   ├── spatial.test.ts      # Testes de simulacao e validacao
│   └── utils.test.ts        # Testes de utilitarios
└── .github/
    └── workflows/ci.yml     # Pipeline CI (Node 20 e 22)
```

---

## Instalacao e execucao

### Pre-requisitos

- Node.js 20+ (ver `.nvmrc`)
- npm 10+

### Passos

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variaveis de ambiente
cp .env.example .env.local

# 3. Rodar frontend + API em paralelo
npm run dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:8787/api/v1/health

### Atalhos com Makefile

```bash
make install       # npm install
make dev           # frontend + backend
make build         # build de producao
make type-check    # tsc --noEmit
make lint          # eslint
make fmt           # prettier --write
make test          # vitest run
make coverage      # vitest run --coverage
make ci            # type-check + lint + fmt:check + test + build
```

---

## Fluxo de analise

```
1. Selecionar imagem (upload ou cenario de exemplo)
         │
         ▼
2. Escolher modo de deteccao
         │
         ▼
3. Configurar: modelo, alvo, prompt, temperatura, FOV
         │
         ▼
4. (Opcional) Anotar sobre a imagem
         │
         ▼
5. Executar analise → POST /api/v1/spatial/analyze
         │
         ▼
6. Resposta validada → overlays na imagem + JSON no inspector
```

---

## Variaveis de ambiente

| Variavel | Padrao | Descricao |
|---|---|---|
| `VITE_SPATIAL_API_BASE_URL` | `/api/v1` | Base da API no frontend |
| `VITE_SPATIAL_API_TIMEOUT_MS` | `15000` | Timeout da requisicao HTTP (ms) |
| `VITE_ENABLE_LOCAL_FALLBACK` | `true` | Ativa simulador local se API falhar |
| `VITE_SPATIAL_API_PROXY_TARGET` | `http://localhost:8787` | Alvo do proxy Vite |
| `PORT` | `8787` | Porta do servidor Express |
| `SPATIAL_ALLOWED_ORIGIN` | `*` | Origem permitida no CORS |

---

## Scripts

| Comando | Descricao |
|---|---|
| `npm run dev` | Frontend + backend em paralelo |
| `npm run dev:web` | Apenas frontend |
| `npm run dev:api` | Apenas backend |
| `npm run build` | Build de producao |
| `npm run preview` | Preview do build |
| `npm run type-check` | Verificacao de tipos TypeScript |
| `npm run lint` | ESLint (typescript-eslint strict) |
| `npm run lint:fix` | ESLint com correcao automatica |
| `npm run fmt` | Prettier (formatar) |
| `npm run fmt:check` | Prettier (verificar) |
| `npm test` | Vitest (execucao unica) |
| `npm run test:watch` | Vitest modo watch |
| `npm run test:coverage` | Vitest com relatorio de cobertura |

---

## Deploy

### Frontend

```bash
npm run build
# Publicar dist/ em Vercel, Netlify, Cloudflare Pages ou S3+CDN
```

### Backend

```bash
# Container ou PaaS Node 20+
# Expor /api/v1/* via HTTPS
# Definir VITE_SPATIAL_API_BASE_URL para a URL publica da API
```

---

## Melhorias futuras

- Autenticacao com RBAC para ambientes multiusuario
- Persistencia de sessoes e historico de analises
- Observabilidade completa (traces distribuidos, metricas Prometheus)
- Suite de testes de integracao da API e E2E com Playwright
- Integracao com motores de inferencia reais em ambiente produtivo

---

## Autoria

Desenvolvido por **Matheus Siqueira**

- Website: [matheussiqueira.dev](https://www.matheussiqueira.dev/)
- GitHub: [@matheussiqueira-dev](https://github.com/matheussiqueira-dev)
- Repositorio: [Robotics-Spatial-Understanding](https://github.com/matheussiqueira-dev/Robotics-Spatial-Understanding)

---

## Licenca

[MIT](LICENSE)
