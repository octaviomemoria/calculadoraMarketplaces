# Integração Mercado Livre via Vercel

## Objetivo

Permitir que a Calculadora consulte tarifas reais do Mercado Livre para a
conta autorizada, sem quebrar o frontend atual, o domínio usado pelos clientes
ou o build Android.

## Contexto atual

- O frontend é Next.js com `output: "export"`.
- O app não possui backend nem OAuth.
- O subdomínio `calculadora.memoriaapps.site` já foi criado no Hostinger.
- O aplicativo Mercado Livre já existe e usa o callback
  `https://calculadora.memoriaapps.site/api/mercadolivre/callback`.
- O segredo do aplicativo Mercado Livre não deve entrar no Git, bundle ou
  variáveis `NEXT_PUBLIC_*`.

## Decisão

Usar o Vercel para as funções Node do backend e manter o frontend estático.
As funções ficam em `api/` na raiz do projeto, que é o formato nativo de
Vercel Functions. O subdomínio do Hostinger será apontado para o projeto
Vercel; o domínio atual dos clientes continua funcionando.

Não usar Node.js no plano compartilhado do Hostinger: a própria Hostinger
restringe Node.js a planos com acesso adequado, principalmente VPS.

Referências oficiais:

- [Vercel Functions Node.js](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel Functions API](https://vercel.com/docs/functions/functions-api-reference)
- [Variáveis de ambiente Vercel](https://vercel.com/docs/environment-variables)
- [Autorização Mercado Livre](https://developers.mercadolivre.com.br/pt_br/obtencao-do-access-token)
- [Tarifas Mercado Livre](https://developers.mercadolivre.com.br/pt_br/descricao-de-produtos/comissao-por-vender)

## Fluxo

1. O usuário clica em “Conectar Mercado Livre”.
2. A função `/api/mercadolivre/auth` cria `state` e PKCE, salva o desafio
   temporário e redireciona para o Mercado Livre.
3. O callback valida `state`, troca o `code` por access/refresh token e salva
   os tokens no armazenamento persistente do backend.
4. O callback devolve ao frontend somente um identificador opaco da conexão;
   access token e refresh token nunca chegam ao navegador.
5. `/api/mercadolivre/fees` valida os dados da simulação, renova o access token
   quando necessário e consulta `listing_prices`.
6. O frontend mantém os indicadores existentes e exibe a origem, os parâmetros
   e o status da tarifa: real consultada ou estimativa editável.

## Persistência e segurança

Usar um adaptador de armazenamento chave/valor compatível com Vercel, com
Upstash Redis como primeira implementação. O adaptador separa:

- estado OAuth e PKCE, com expiração curta;
- conexão do usuário, com identificador aleatório e revogação;
- tokens Mercado Livre, armazenados somente no backend;
- expiração e rotação do refresh token.

Variáveis de produção:

```text
MERCADOLIVRE_CLIENT_ID
MERCADOLIVRE_CLIENT_SECRET
MERCADOLIVRE_REDIRECT_URI
MERCADOLIVRE_SITE_ID=MLB
MERCADOLIVRE_FRONTEND_ORIGIN
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Regras:

- nunca usar `NEXT_PUBLIC_MERCADOLIVRE_CLIENT_SECRET`;
- nunca registrar tokens ou `client_secret` em logs;
- aceitar somente `returnTo` pertencente à origem configurada;
- validar `state`, PKCE, método HTTP, origem e entrada numérica;
- limitar tamanho e faixa de preço/peso;
- não somar duas vezes `sale_fee_details.fixed_fee` quando o Mercado Livre já
  a incluir em `sale_fee_amount`;
- manter tratamento explícito para indisponível/erro, sem converter erro em
  tarifa zero.

## Endpoints

### `GET /api/mercadolivre/auth`

Inicia OAuth. Entrada opcional: `returnTo`. Saída: redirect para o Mercado
Livre. Não expõe segredo.

### `GET /api/mercadolivre/callback`

Troca código, persiste conexão e redireciona ao frontend. Em falha, redireciona
com erro seguro e sem detalhes de token.

### `GET /api/mercadolivre/status`

Informa apenas se existe conexão válida, conta mascarada e data de expiração.

### `POST /api/mercadolivre/fees`

Recebe os parâmetros necessários à consulta oficial, conforme categoria,
anúncio, logística, frete e peso. Retorna tarifa de venda, custo fixo/frete,
valor líquido e os dois indicadores já existentes:

- líquido/preço: `líquido recebido / preço de venda`;
- líquido/custo: `líquido recebido / custo do produto`.

O segundo continua sendo a conta solicitada pelo usuário: `29,86 / 20,27`.

### `POST /api/mercadolivre/disconnect`

Revoga a conexão local e remove os tokens persistidos.

## Frontend

- Adicionar estado de conexão e botão “Conectar Mercado Livre”.
- Usar `NEXT_PUBLIC_MERCADOLIVRE_API_BASE_URL` somente para URL pública da API.
- Enviar o identificador opaco, nunca token Mercado Livre.
- Preservar os campos manuais atuais como fallback quando a consulta oficial
  não puder calcular frete ou exigir dados ausentes.
- Exibir “consultado no Mercado Livre” versus “estimativa manual”.

## Testes

Antes do código de produção:

- teste RED/ GREEN para URL OAuth, `state` e PKCE;
- teste da troca de token com `fetch` simulado;
- teste de expiração e renovação do token;
- teste de validação de entrada e bloqueio de `returnTo` externo;
- teste do mapeamento de `listing_prices`, incluindo frete/fixo sem duplicação;
- teste dos indicadores `29,86 / 49,67` e `29,86 / 20,27`;
- teste de não exposição de segredo em resposta ou log.

## Publicação

1. Criar/configurar o armazenamento Upstash.
2. Adicionar as variáveis de ambiente no Vercel, em Preview e Production.
3. Associar `calculadora.memoriaapps.site` ao projeto Vercel.
4. Confirmar DNS e HTTPS.
5. Atualizar o callback do app Mercado Livre se o domínio final mudar.
6. Publicar e testar OAuth real, consulta real e fallback manual.

## Fora deste passo

- não criar ou solicitar o `Client Secret` no chat;
- não publicar tokens;
- não trocar o domínio atual dos clientes;
- não afirmar tarifa universal: comissão e logística dependem dos parâmetros
  retornados pelo Mercado Livre.
