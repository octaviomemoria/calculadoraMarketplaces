# Markup líquido do Mercado Livre Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar na tela de detalhe o valor líquido estimado recebido, a proporção líquido/preço e o markup líquido/custo, usando uma fórmula única e tarifas configuráveis.

**Architecture:** O motor puro de precificação terá uma função para as deduções de plataforma e outra para os indicadores derivados. A tela `/produtos/detalhe` consumirá o resultado dessa função junto do lucro/margem existentes, sem duplicar regras de tarifa. Imposto, Ads e taxas personalizadas continuam no lucro, mas não serão classificados automaticamente como repasse do Mercado Livre.

**Tech Stack:** Next.js 16, React 19, TypeScript, Zustand, Vitest, ESLint.

## Global Constraints

- Comissão e frete do Mercado Livre são estimativas configuráveis; não criar tarifa universal.
- Não integrar OAuth/API do Mercado Livre nesta mudança.
- Não alterar automaticamente valores persistidos dos canais.
- Preservar os cálculos atuais de lucro e margem real.
- Usar TDD: cada comportamento novo deve ter teste falhando antes da implementação.
- Executar `npm test`, `npm run lint` e `npm run build` antes do envio.

---

### Task 1: Criar testes do motor de indicadores

**Files:**
- Modify: `src/__tests__/calculations.test.ts`
- Test: `src/__tests__/calculations.test.ts`

**Interfaces:**
- Consumes: `MarketplaceChannel`, `collapseChannelFees` e `lucroLiquido` existentes.
- Produces: expectativa para `valorLiquidoRecebido` e `indicadoresMarkup` que será implementada em `src/lib/pricing/calculations.ts`.

- [ ] **Step 1: Write the failing test**

Adicionar aos imports:

```ts
  indicadoresMarkup,
  valorLiquidoRecebido,
```

Adicionar um bloco de testes:

```ts
describe("indicadores de líquido e markup", () => {
  it("calcula o exemplo do Mercado Livre com comissão e frete", () => {
    const ml = testChannel({
      comissaoPct: 0.12,
      taxaFixa: 0,
      custoFrete: 13.85,
      subsidioFrete: 0,
      impostoPct: 0,
      custoAds: 0,
    });

    const preco = 49.67;
    const custo = 20.27;

    expect(valorLiquidoRecebido(preco, ml)).toBeCloseTo(29.86, 2);
    expect(indicadoresMarkup(preco, custo, ml)).toEqual({
      valorLiquidoRecebido: expect.closeTo(29.86, 2),
      liquidoSobrePreco: expect.closeTo(0.6012, 4),
      liquidoSobreCusto: expect.closeTo(1.4731, 4),
    });
  });

  it("não inclui imposto ou Ads no líquido, mas mantém esses custos no lucro", () => {
    const ml = testChannel({
      comissaoPct: 0.12,
      taxaFixa: 0,
      custoFrete: 13.85,
      impostoPct: 0.04,
      custoAds: 0.05,
    });

    expect(valorLiquidoRecebido(49.67, ml)).toBeCloseTo(29.86, 2);
    expect(lucroLiquido(49.67, 20.27, ml)).toBeCloseTo(5.12, 2);
  });

  it("retorna null para preço ou custo inválido", () => {
    const ml = testChannel({ taxaFixa: 0 });

    expect(indicadoresMarkup(0, 20.27, ml)).toBeNull();
    expect(indicadoresMarkup(49.67, 0, ml)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/calculations.test.ts`

Expected: FAIL because `valorLiquidoRecebido` and `indicadoresMarkup` do not exist yet.

- [ ] **Step 3: Confirm the failure is about the missing behavior**

Run: `npm test -- src/__tests__/calculations.test.ts 2>&1 | Select-String -Pattern "valorLiquidoRecebido|indicadoresMarkup|FAIL"`

Expected: output mentions the missing exports or equivalent TypeScript test failure, not a setup error.

### Task 2: Implementar o cálculo único

**Files:**
- Modify: `src/lib/pricing/calculations.ts`
- Test: `src/__tests__/calculations.test.ts`

**Interfaces:**
- Consumes: `resolveDynamicFees`, `MarketplaceChannel` e o cálculo existente de lucro.
- Produces: `valorLiquidoRecebido(preco: number, channel: MarketplaceChannel): number` e `indicadoresMarkup(preco: number, custoTotal: number, channel: MarketplaceChannel): MarkupIndicators | null`.

- [ ] **Step 1: Add the result type and failing-test target**

Definir o contrato antes da implementação:

```ts
export interface MarkupIndicators {
  valorLiquidoRecebido: number;
  liquidoSobrePreco: number;
  liquidoSobreCusto: number;
}
```

- [ ] **Step 2: Implement the minimal platform-payout calculation**

Resolver as taxas dinâmicas para o preço e calcular somente as deduções de plataforma:

```ts
export function valorLiquidoRecebido(preco: number, channel: MarketplaceChannel): number {
  const dynamic = resolveDynamicFees(channel, preco);
  const percentualPlataforma =
    dynamic.comissaoPct +
    channel.taxaPagamentoPct +
    (channel.antecipacaoAtiva ? channel.taxaAntecipacaoPct : 0);
  const fixoPlataforma = dynamic.taxaFixa + dynamic.custoFreteLiquido;

  return preco * (1 - percentualPlataforma) - fixoPlataforma;
}
```

`impostoPct`, `custoAds` e `taxasPersonalizadas` ficam fora do repasse e continuam sendo considerados pelo `lucroLiquido` via `collapseChannelFees`.

- [ ] **Step 3: Implement the derived indicators**

```ts
export function indicadoresMarkup(
  preco: number,
  custoTotal: number,
  channel: MarketplaceChannel,
): MarkupIndicators | null {
  if (preco <= 0 || custoTotal <= 0) return null;

  const valorLiquido = valorLiquidoRecebido(preco, channel);
  return {
    valorLiquidoRecebido: valorLiquido,
    liquidoSobrePreco: valorLiquido / preco,
    liquidoSobreCusto: valorLiquido / custoTotal,
  };
}
```

- [ ] **Step 4: Run the focused tests**

Run: `npm test -- src/__tests__/calculations.test.ts`

Expected: PASS, incluindo o exemplo R$49,67 / R$20,27.

### Task 3: Exibir os indicadores em `/produtos/detalhe`

**Files:**
- Modify: `src/app/produtos/detalhe/page.tsx`
- Modify: `src/lib/format/currency.ts` only if a small display helper is needed
- Test: `src/__tests__/calculations.test.ts`

**Interfaces:**
- Consumes: `indicadoresMarkup`, `formatCurrency` e `formatPercent`.
- Produces: três cartões legíveis no simulador do preço praticado.

- [ ] **Step 1: Import the calculation helper**

Adicionar `indicadoresMarkup` ao import de `@/lib/pricing/calculations`.

- [ ] **Step 2: Derive indicators from the simulated price**

Depois de `valorPraticado`, calcular:

```ts
const indicadores =
  valorPraticado > 0 ? indicadoresMarkup(valorPraticado, custoTotal, channel) : null;
```

- [ ] **Step 3: Add the UI fields**

Manter “Lucro líquido no bolso” e “Margem real resultante” e acrescentar:

```tsx
<div className="rounded-xl bg-bg-muted p-2.5">
  <p className="text-xs text-text-muted">Líquido recebido (estimado)</p>
  <p className="text-base font-bold text-text">
    {indicadores ? formatCurrency(indicadores.valorLiquidoRecebido) : "—"}
  </p>
</div>
<div className="rounded-xl bg-bg-muted p-2.5">
  <p className="text-xs text-text-muted">Líquido / preço</p>
  <p className="text-base font-bold text-text">
    {indicadores ? formatPercent(indicadores.liquidoSobrePreco) : "—"}
  </p>
</div>
<div className="rounded-xl bg-bg-muted p-2.5">
  <p className="text-xs text-text-muted">Markup líquido / custo</p>
  <p className="text-base font-bold text-text">
    {indicadores
      ? `${indicadores.liquidoSobreCusto.toFixed(2).replace(".", ",")}x (${formatPercent(indicadores.liquidoSobreCusto)})`
      : "—"}
  </p>
</div>
```

Adicionar uma nota curta: “Estimativa baseada nas tarifas configuradas no canal; o valor real depende da categoria e da logística do anúncio.”

- [ ] **Step 4: Run lint and build checks**

Run: `npm run lint` and `npm run build`

Expected: exit code 0, sem erro TypeScript ou ESLint.

### Task 4: Verificação final e envio ao GitHub

**Files:**
- Verify: arquivos rastreáveis do projeto
- Create/modify: `.gitignore` only if required to exclude local build/cache artifacts

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: exit code 0 and 0 failed tests.

- [ ] **Step 2: Inspect the final diff and generated artifacts**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors; `.next`, `out` and `node_modules` remain ignored and no secrets are staged.

- [ ] **Step 3: Initialize the repository only because the user authorized GitHub delivery**

Since this checkout currently has no `.git`, run:

```powershell
git init -b main
git remote add origin https://github.com/octaviomemoria/calculadoraMarketplaces.git
git add .
git commit -m "feat: mostrar markup liquido do Mercado Livre"
```

If `origin` already exists after initialization, use `git remote set-url origin https://github.com/octaviomemoria/calculadoraMarketplaces.git` instead of adding a duplicate remote.

- [ ] **Step 4: Push the authorized branch**

Run: `git push -u origin main`

Expected: push succeeds without force; report the commit SHA and remote branch.
