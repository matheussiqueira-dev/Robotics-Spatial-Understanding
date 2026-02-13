# Robotics Spatial Understanding

Plataforma fullstack para analise espacial de cenas roboticas, com interface web moderna e API dedicada para inferencia de dados visuais (2D, segmentacao, pontos e caixas 3D).

## Visao geral do projeto

O sistema foi estruturado para apoiar operacoes de robotica aplicada (picking, inventario visual, inspeccao e manipulacao assistida) com foco em:

- rapidez de iteracao de prompt e parametros
- visualizacao tecnica clara dos resultados
- contrato de API estavel e versionado
- arquitetura preparada para evolucao de modelos reais em producao

## Arquitetura e decisoes tecnicas

A solucao foi dividida em camadas para separar responsabilidades:

- `Frontend (React + Vite)`: experiencia do usuario, estado da aplicacao e visualizacao das deteccoes.
- `Service Layer`: cliente HTTP resiliente, validacao de contrato e fallback local controlado.
- `Backend API (Express)`: endpoint versionado `/api/v1/spatial/analyze`, validacao de payload com `zod`, controles basicos de seguranca e rate limiting por IP.
- `Shared Domain`: simulador deterministico para respostas e tipos de dominio compartilhados entre frontend e backend.

Principios aplicados:

- **SOLID**: responsabilidades isoladas por modulo.
- **DRY**: tipos e regras centrais reutilizados em `shared/`.
- **Clean Architecture (adaptada ao escopo)**: UI desacoplada de implementacao de inferencia.

## Stack e tecnologias

- Frontend: `React 19`, `TypeScript`, `Vite`, `Jotai`, `perfect-freehand`
- Backend: `Express`, `zod`, `helmet`, `cors`
- Qualidade: `Vitest`

## Estrutura do projeto

```text
.
|- App.tsx
|- Content.tsx
|- Prompt.tsx
|- TopBar.tsx
|- SideControls.tsx
|- DetectTypeSelector.tsx
|- ExampleImages.tsx
|- ExtraModeControls.tsx
|- Palette.tsx
|- atoms.tsx
|- consts.tsx
|- Types.tsx
|- hooks.tsx
|- utils.tsx
|- services/
|  |- spatialApi.ts
|  |- validators.ts
|- shared/
|  |- spatialSimulation.ts
|- server/
|  |- index.ts
|- tests/
|  |- spatial.test.ts
|- index.css
|- index.tsx
|- vite.config.ts
|- package.json
```

## Fluxo funcional

1. Usuario seleciona imagem (upload ou cenarios de exemplo).
2. Define modo de analise, alvo, prompt, modelo e parametros.
3. Frontend envia payload padronizado para `/api/v1/spatial/analyze`.
4. Backend valida entrada, processa e retorna estrutura consistente.
5. Frontend valida resposta e renderiza overlays com feedback de confianca e tempo.

## Seguranca, performance e confiabilidade

- Validacao de payload no backend com `zod`.
- Limite de taxa por IP para reduzir abuso.
- `helmet` e `cors` configurados na API.
- Timeout no cliente HTTP e fallback local opcional para alta disponibilidade em ambiente de desenvolvimento.
- Reducao de custo de renderizacao com dimensoes normalizadas e desenho incremental.

## Rastreabilidade e visibilidade online

As melhorias foram implementadas **sem remover mecanismos de rastreamento, indexacao ou descoberta**. Estruturas de metadata essenciais foram preservadas no fluxo da aplicacao.

## Instalacao e execucao

### Pre-requisitos

- Node.js 20+
- npm 10+

### Passos

1. Instalar dependencias:

```bash
npm install
```

2. Criar variaveis locais (baseado em `.env.example`):

```bash
cp .env.example .env.local
```

3. Rodar frontend + API em desenvolvimento:

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- API: `http://localhost:8787`

## Variaveis de ambiente

- `VITE_SPATIAL_API_BASE_URL`: base da API consumida no frontend (default: `/api/v1`)
- `VITE_SPATIAL_API_TIMEOUT_MS`: timeout de requisicao HTTP
- `VITE_ENABLE_LOCAL_FALLBACK`: ativa fallback local (`true`/`false`)
- `VITE_SPATIAL_API_PROXY_TARGET`: alvo do proxy do Vite para `/api`
- `PORT`: porta da API backend
- `SPATIAL_ALLOWED_ORIGIN`: origem permitida no CORS

## Scripts disponiveis

- `npm run dev`: sobe frontend e backend em paralelo
- `npm run dev:web`: sobe apenas frontend
- `npm run dev:api`: sobe apenas backend
- `npm run build`: build de producao do frontend
- `npm run preview`: preview do build
- `npm run test`: executa testes unitarios
- `npm run test:watch`: modo watch dos testes

## Deploy

### Frontend

- Gerar build com `npm run build`
- Publicar pasta `dist/` em provedor estatico (Vercel, Netlify, Cloudflare Pages, S3+CDN)

### Backend

- Publicar `server/index.ts` em ambiente Node (container, VM ou PaaS)
- Expor rota `/api/v1/*` com HTTPS
- Configurar `VITE_SPATIAL_API_BASE_URL` para a URL publica da API

## Boas praticas adotadas

- Contratos claros e tipados para request/response
- Componentes orientados a responsabilidade unica
- Estado global enxuto e previsivel
- UI responsiva com foco em legibilidade e acessibilidade
- Testes cobrindo regras centrais de simulacao e validacao

## Melhorias futuras

- Autenticacao com RBAC para ambientes multiusuario
- Persistencia de sessoes e historico de analises
- Observabilidade completa (logs estruturados, traces e metricas)
- Suite de testes de integracao da API e e2e da interface
- Integracao com motores de inferencia reais em ambiente produtivo

Autoria: Matheus Siqueira  
Website: https://www.matheussiqueira.dev/