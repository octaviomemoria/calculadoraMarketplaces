# Integração Mercado Livre via Vercel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with checkpoints.

**Goal:** Adicionar OAuth seguro e consulta oficial de tarifas do Mercado Livre sem remover o export estático usado pelo frontend e pelo Android.

**Architecture:** O frontend continua em Next.js com output: "export". Funções Node independentes ficam em api/ na raiz e são publicadas pela Vercel. OAuth, estado PKCE e tokens ficam em Upstash Redis; o navegador recebe apenas um identificador opaco da conexão.

**Tech Stack:** TypeScript, Vercel Functions, @upstash/redis, Vitest, React, Zustand e API listing_prices do Mercado Livre.

## Global Constraints

- Nunca expor MERCADOLIVRE_CLIENT_SECRET, access token ou refresh token no bundle, resposta ou log.
- Manter output: "export" e capacitor.config.ts apontando para out/.
- Aceitar somente returnTo com origem igual a MERCADOLIVRE_FRONTEND_ORIGIN.
- Validar state, PKCE, método HTTP, preço, categoria e parâmetros logísticos.
- Usar sale_fee_amount como custo total retornado; sale_fee_details.fixed_fee é informativo e já está incluído.
- Preservar o cálculo manual e identificar “consultado no Mercado Livre” versus “estimativa manual”.
- Seguir RED → GREEN → refactor em cada unidade.

## Mapa de arquivos

- Criar src/lib/mercadolivre/types.ts: contratos de OAuth, Redis, conexão e tarifas.
- Criar src/lib/mercadolivre/config.ts: leitura e validação das variáveis server-side.
- Criar src/lib/mercadolivre/pkce.ts: state, verifier e challenge S256.
- Criar src/lib/mercadolivre/oauth.ts: URL de autorização, troca de código e refresh.
- Criar src/lib/mercadolivre/store.ts: interface e adaptador Upstash Redis.
- Criar src/lib/mercadolivre/connection.ts: ciclo de vida do estado/conexão/tokens.
- Criar src/lib/mercadolivre/fees.ts: validação, URL listing_prices e normalização.
- Criar src/lib/mercadolivre/http.ts: CORS, resposta JSON e leitura do identificador.
- Criar api/mercadolivre/auth.ts, callback.ts, status.ts, fees.ts e disconnect.ts.
- Criar src/components/mercadolivre/MercadoLivrePanel.tsx.
- Modificar src/app/produtos/detalhe/page.tsx, .env.local.example e README.md.
- Criar testes em src/__tests__/mercadolivre*.test.ts.

---

### Task 1: Contratos e configuração segura

**Files**

- Create: src/lib/mercadolivre/types.ts
- Create: src/lib/mercadolivre/config.ts
- Test: src/__tests__/mercadolivreConfig.test.ts

**Interface**

    export interface MercadoLivreConfig {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
      frontendOrigin: string;
      siteId: string;
    }

    export function loadMercadoLivreConfig(env?: NodeJS.ProcessEnv): MercadoLivreConfig;

- [ ] Escrever teste RED: carregar os cinco valores obrigatórios, aplicar MLB quando MERCADOLIVRE_SITE_ID faltar e rejeitar segredo ausente ou origem inválida.
- [ ] Rodar npm test -- src/__tests__/mercadolivreConfig.test.ts. Esperado: FAIL por módulo ausente.
- [ ] Implementar os tipos e loadMercadoLivreConfig; validar URL HTTP/HTTPS e manter todos os valores server-side.
- [ ] Rodar o mesmo teste. Esperado: PASS.
- [ ] Commitar com git add src/lib/mercadolivre src/__tests__/mercadolivreConfig.test.ts e git commit -m "feat: adicionar contratos da integracao Mercado Livre".

### Task 2: PKCE, OAuth e armazenamento persistente

**Files**

- Create: src/lib/mercadolivre/pkce.ts
- Create: src/lib/mercadolivre/oauth.ts
- Create: src/lib/mercadolivre/store.ts
- Create: src/lib/mercadolivre/connection.ts
- Test: src/__tests__/mercadolivreOAuth.test.ts
- Modify: package.json e package-lock.json

**Interfaces**

    export interface KeyValueStore {
      get<T>(key: string): Promise<T | null>;
      set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
      del(key: string): Promise<void>;
    }

    export function beginAuthorization(
      store: KeyValueStore,
      config: MercadoLivreConfig,
      returnTo?: string,
    ): Promise<{ url: string; state: string }>;

    export function completeAuthorization(
      store: KeyValueStore,
      config: MercadoLivreConfig,
      code: string,
      state: string,
    ): Promise<{ connectionId: string; returnTo: string }>;

    export function getValidAccessToken(
      store: KeyValueStore,
      config: MercadoLivreConfig,
      connectionId: string,
    ): Promise<string>;

- [ ] Escrever testes RED para URL com response_type=code, state, PKCE S256, troca simulada de código, state de uso único, refresh expirado e bloqueio de returnTo externo. Confirmar que o retorno público não contém tokens.
- [ ] Rodar npm test -- src/__tests__/mercadolivreOAuth.test.ts. Esperado: FAIL por módulos ausentes.
- [ ] Implementar PKCE com node:crypto, state TTL de 600 segundos, conexão opaca com 32 bytes aleatórios, troca em https://api.mercadolibre.com/oauth/token e rotação do refresh token.
- [ ] Implementar createUpstashStore usando Redis.fromEnv e MemoryStore para testes.
- [ ] Rodar o teste. Esperado: PASS.
- [ ] Executar npm install @upstash/redis e commitar com mensagem "feat: implementar OAuth Mercado Livre com PKCE".

### Task 3: Consulta oficial listing_prices

**Files**

- Create: src/lib/mercadolivre/fees.ts
- Test: src/__tests__/mercadolivreFees.test.ts

**Interfaces**

    export interface ListingPricesRequest {
      connectionId: string;
      price: number;
      categoryId: string;
      listingTypeId: string;
      currencyId?: string;
      logisticType?: string;
      shippingMode?: string;
      billableWeight?: number;
      tags?: string;
    }

    export interface OfficialFeeResult {
      listingTypeId: string;
      listingTypeName: string;
      currencyId: string;
      listingFeeAmount: number;
      saleFeeAmount: number;
      saleFeePercentage: number | null;
      saleFeeFixed: number | null;
      netReceived: number;
      raw: unknown;
    }

    export function normalizeListingPricesResponse(
      payload: unknown,
      price: number,
    ): OfficialFeeResult;

- [ ] Escrever teste RED: query com preço, categoria, gold_special, BRL, logística e peso; rejeitar preço zero/categoria vazia; normalizar sale_fee_amount; não subtrair fixed_fee duas vezes.
- [ ] Rodar npm test -- src/__tests__/mercadolivreFees.test.ts. Esperado: FAIL.
- [ ] Construir https://api.mercadolibre.com/sites/{siteId}/listing_prices, enviar Authorization Bearer, aceitar objeto ou primeiro item de array, limitar valores e sanitizar status não-2xx.
- [ ] Calcular netReceived = price - saleFeeAmount. Não adicionar fixed_fee.
- [ ] Rodar o teste. Esperado: PASS.
- [ ] Commitar com mensagem "feat: normalizar tarifas oficiais do Mercado Livre".

### Task 4: Funções Vercel e CORS

**Files**

- Create: src/lib/mercadolivre/http.ts
- Create: api/mercadolivre/auth.ts
- Create: api/mercadolivre/callback.ts
- Create: api/mercadolivre/status.ts
- Create: api/mercadolivre/fees.ts
- Create: api/mercadolivre/disconnect.ts
- Test: src/__tests__/mercadolivreHandlers.test.ts
- Modify: package.json e package-lock.json

**Contrato**

Cada api/**/*.ts exportará default async function handler(req, res) compatível com Vercel. O frontend enviará Authorization: Bearer <connectionId>.

- [ ] Escrever testes RED para OPTIONS, origem permitida, origem rejeitada, status sem conexão, fees sem body, auth sem configuração e ausência de token em respostas.
- [ ] Rodar npm test -- src/__tests__/mercadolivreHandlers.test.ts. Esperado: FAIL.
- [ ] Implementar CORS exato sem credentials, respostas { error: string }, redirect seguro no callback com mercadolivre=connected&connectionId=..., renovação via getValidAccessToken e disconnect por chave opaca.
- [ ] Sanitizar erros e nunca incluir descrição bruta do Mercado Livre em produção.
- [ ] Rodar o teste. Esperado: PASS.
- [ ] Executar npm install -D @vercel/node e commitar com mensagem "feat: publicar endpoints Vercel do Mercado Livre".

### Task 5: Painel no detalhe do produto

**Files**

- Create: src/components/mercadolivre/MercadoLivrePanel.tsx
- Test: src/__tests__/mercadolivrePanel.test.ts
- Modify: src/app/produtos/detalhe/page.tsx
- Modify: .env.local.example

**Interface**

    export interface MercadoLivrePanelProps {
      apiBaseUrl: string;
      price: number;
      cost: number;
    }

- [ ] Escrever teste RED para preço 49.67, custo 20.27, custo oficial 19.81, líquido 29.86, líquido/preço 60.12% e líquido/custo 147.31%; testar que o painel não aparece para canais não Mercado Livre.
- [ ] Rodar npm test -- src/__tests__/mercadolivrePanel.test.ts. Esperado: FAIL.
- [ ] Implementar botão conectar, persistir somente connectionId em localStorage, tratar retorno OAuth e remover parâmetros da URL.
- [ ] Adicionar campos categoria, gold_special, BRL, logística, modo e peso opcionais.
- [ ] Mostrar custo oficial, líquido recebido, líquido/preço e markup líquido/custo; manter o card manual existente intacto.
- [ ] Rodar o teste. Esperado: PASS.
- [ ] Commitar com mensagem "feat: consultar tarifas Mercado Livre no detalhe do produto".

### Task 6: Documentação, verificação e entrega

**Files**

- Modify: README.md
- Modify: .env.local.example

- [ ] Documentar Upstash, variáveis server-side, NEXT_PUBLIC_MERCADOLIVRE_API_BASE_URL, DNS/CNAME, callback e teste vercel dev.
- [ ] Rodar npm test, npm run lint, npm run build e git diff --check. Esperado: testes/build exit 0, lint sem erros e diff limpo; aviso preexistente deve ser reportado separadamente.
- [ ] Auditar com rg -n "MERCADOLIVRE_CLIENT_SECRET|access_token|refresh_token|NEXT_PUBLIC_.*SECRET" . --glob "!node_modules/**" --glob "!.next/**" --glob "!out/**". Esperado: somente nomes/documentação segura, nenhum valor real.
- [ ] Confirmar git status --short --branch e commits antes do push.
- [ ] Fazer push somente no encerramento, conforme autorização anterior, sem .env.local.

## Self-review do plano

- OAuth, PKCE, refresh, state e segredos: Tasks 1–2.
- Tarifas reais, logística e fixed_fee sem duplicação: Task 3.
- Endpoints, CORS e respostas sanitizadas: Task 4.
- Dois indicadores e tela /produtos/detalhe: Task 5.
- DNS, env, build estático, auditoria e GitHub: Task 6.
- Cada task tem arquivos, teste RED, comando, resultado esperado e commit.

