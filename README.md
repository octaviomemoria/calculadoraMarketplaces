# Margem Certa — Calculadora de Preços para Marketplaces

Calculadora para vendedores descobrirem quanto cobrar em cada marketplace (Mercado Livre, Shopee, Amazon, Magalu, TikTok Shop, Shein, Americanas, loja própria, WhatsApp, venda física) para manter a margem de lucro desejada.

## Stack

Next.js 16 (App Router, `output: 'export'` — frontend estático) + React 19 + TypeScript + Tailwind CSS v4 + Zustand (persist/localStorage) + Vitest. As funções de OAuth/tarifas ficam em Vercel Functions.

## Rodando localmente

```bash
npm install
npm run dev       # http://localhost:3000
npm run test      # Vitest
npm run build     # export estático em out/
```

## Portão de acesso por senha (opcional)

O app pode exigir uma senha compartilhada antes de liberar o uso — útil para dar acesso gratuito a amigos/clientes sem publicar publicamente. Veja `.env.local.example` para as três variáveis (`NEXT_PUBLIC_ACCESS_ENABLED`, `NEXT_PUBLIC_ACCESS_PASSWORD`, `NEXT_PUBLIC_ACCESS_VERSION`). Em produção, defina-as em Vercel → Project Settings → Environment Variables e faça um redeploy para aplicar. Não é segurança real — é um filtro simples contra acesso casual (a senha fica visível para quem inspecionar o código do site).

## Deploy na Vercel

O projeto já está pronto para deploy zero-config: a Vercel detecta o Next.js automaticamente e serve o export estático. Basta importar o repositório em vercel.com/new.

## Integração oficial do Mercado Livre

O frontend continua sendo exportado estaticamente. As funções OAuth/API ficam
em `api/mercadolivre/` e são executadas pela Vercel. O navegador recebe apenas
um identificador opaco; Client Secret, access token e refresh token ficam no
backend.

### Configuração Vercel

1. Crie um Redis compatível com Vercel/Upstash.
2. No projeto Vercel, adicione em Preview e Production:

   - `MERCADOLIVRE_CLIENT_ID`
   - `MERCADOLIVRE_CLIENT_SECRET`
   - `MERCADOLIVRE_REDIRECT_URI=https://calculadora.memoriaapps.site/api/mercadolivre/callback`
   - `MERCADOLIVRE_FRONTEND_ORIGIN=https://SEU-DOMINIO-VERCEL`
   - `MERCADOLIVRE_SITE_ID=MLB`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `NEXT_PUBLIC_MERCADOLIVRE_API_BASE_URL=https://calculadora.memoriaapps.site`

3. No Vercel, associe `calculadora.memoriaapps.site` ao projeto. No Hostinger,
   mantenha o subdomínio apontando para o destino DNS exibido pelo Vercel.
4. Confirme que o callback acima é idêntico ao cadastrado no DevCenter do
   Mercado Livre.

O Client Secret não deve ser colocado em `.env.local.example`, GitHub ou
qualquer variável `NEXT_PUBLIC_*`. Para desenvolvimento com funções reais,
use `vercel dev`; `npm run dev` serve apenas o frontend.

Na tela `/produtos/detalhe`, o painel Mercado Livre exige categoria do anúncio.
Para frete mais preciso, informe também `logistic_type`, `shipping_mode` e peso
faturável. Sem esses dados, o usuário continua podendo usar a estimativa manual.

## Empacotamento Android (futuro)

`capacitor.config.ts` já está configurado (`webDir: 'out'`), mas a pasta `android/` ainda não foi gerada. Quando quiser publicar na Play Store: `npx cap add android`, depois `npm run build:android`.
