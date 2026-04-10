# Contribuindo com o projeto

Obrigado pelo interesse em contribuir! Este guia cobre o setup do ambiente, padroes de codigo e o fluxo de pull request.

---

## Ambiente de desenvolvimento

### Pre-requisitos

- **Node.js 20+** (use `.nvmrc` com `nvm use`)
- **npm 10+**

### Setup inicial

```bash
git clone https://github.com/matheussiqueira-dev/Robotics-Spatial-Understanding.git
cd Robotics-Spatial-Understanding
npm install
cp .env.example .env.local
npm run dev
```

---

## Fluxo de trabalho

### Gate de qualidade local

Antes de abrir um pull request, rode o gate completo:

```bash
make ci
# equivale a: type-check → lint → fmt:check → test → build
```

Ou passo a passo:

```bash
make type-check   # tsc --noEmit
make lint         # eslint
make fmt          # prettier --write (formatar)
make fmt-check    # prettier --check (verificar)
make test         # vitest run
make coverage     # vitest run --coverage
make build        # vite build
```

### Adicionar um novo recurso

1. Crie uma branch a partir de `main`:
   ```bash
   git checkout -b feat/nome-do-recurso
   ```
2. Escreva testes para a logica de dominio em `tests/`.
3. Implemente o recurso.
4. Execute `make ci` e corrija eventuais erros.
5. Abra um pull request descrevendo o que foi feito e por que.

---

## Padroes de codigo

### TypeScript

- `strict: true` habilitado — sem `any`, sem asercoes nao verificadas.
- Prefira **union discriminada** em vez de union simples quando o tipo
  de um campo depende de outro campo do mesmo objeto.
- Use `import type` para importacoes de tipo puro.

### Componentes React

- Cada componente tem responsabilidade unica.
- Estado global via **Jotai atoms** — evite prop drilling profundo.
- Nao use `useEffect` para sincronizar estado derivado; prefira `useMemo`.

### Testes

- Novos modulos em `shared/` e `services/` devem ter testes em `tests/`.
- Use `describe` para agrupar por modulo e `it` para casos individuais.
- Testes de componente React (se adicionados) ficam em `tests/components/`.

### Commits

Siga o formato **Conventional Commits**:

```
<tipo>(<escopo opcional>): <descricao curta>

<corpo opcional>
```

Tipos aceitos: `feat`, `fix`, `docs`, `chore`, `ci`, `perf`, `refactor`, `test`, `a11y`.

---

## Estrutura de tipos

Os tipos de dominio ficam em `Types.tsx`. O tipo `AnalyzeResponseBody` e uma
**union discriminada** — ao adicionar um novo `detectType`, atualize:

1. `DETECT_TYPES` em `Types.tsx`
2. O tipo `AnalyzeResponseBody` (nova variante)
3. `analyzeSchema` em `server/index.ts`
4. `simulateSpatialAnalysis` em `shared/spatialSimulation.ts`
5. `validateAnalyzeResponse` em `services/validators.ts`
6. O switch em `Prompt.tsx`

---

## Autoria

Projeto mantido por **Matheus Siqueira**
Site: [matheussiqueira.dev](https://www.matheussiqueira.dev/)
