# Margem Certa — Calculadora de Preços para Marketplaces

Calculadora para vendedores descobrirem quanto cobrar em cada marketplace (Mercado Livre, Shopee, Amazon, Magalu, TikTok Shop, Shein, Americanas, loja própria, WhatsApp, venda física) para manter a margem de lucro desejada.

## Stack

Next.js 16 (App Router, `output: 'export'` — site 100% estático) + React 19 + TypeScript + Tailwind CSS v4 + Zustand (persist/localStorage) + Vitest. Sem backend — todos os dados ficam no navegador do usuário.

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

## Empacotamento Android (futuro)

`capacitor.config.ts` já está configurado (`webDir: 'out'`), mas a pasta `android/` ainda não foi gerada. Quando quiser publicar na Play Store: `npx cap add android`, depois `npm run build:android`.
