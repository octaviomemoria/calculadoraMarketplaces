# Markup líquido do Mercado Livre

## Objetivo

Na tela `/produtos/detalhe`, mostrar quanto sobra do preço simulado após os descontos configurados do canal e relacionar esse valor ao preço e ao custo total do produto.

## Regras confirmadas

O cálculo deve distinguir:

- **Líquido recebido:** preço menos comissão, tarifa fixa, frete líquido e demais taxas configuradas como desconto do marketplace.
- **Líquido/preço:** líquido recebido dividido pelo preço anunciado.
- **Líquido/custo:** líquido recebido dividido pelo custo total do produto. Este é o indicador solicitado como markup, exibido em multiplicador e percentual.
- **Lucro:** líquido recebido menos custo total do produto.
- **Margem real:** lucro dividido pelo preço anunciado, mantendo o conceito atual.

Para o exemplo informado:

```text
Preço:              R$ 49,67
Custo do produto:   R$ 20,27
Tarifa de venda:    R$  5,96
Custo de envio:     R$ 13,85
Líquido recebido:   R$ 29,86
Líquido / preço:    60,12%
Líquido / custo:    1,47x (147,31%)
Lucro sobre custo:  47,31%
```

## Tarifas do Mercado Livre

As tarifas não serão tratadas como universais. A comissão varia conforme categoria e tipo de anúncio; a documentação oficial informa referência de 10%–14% para Clássico e 15%–19% para Premium. O custo fixo abaixo de R$79 depende da faixa e, na estrutura atual, pode depender também da logística. O frete depende de preço, peso/dimensões, distância, reputação e modalidade.

O app continuará usando os valores editáveis do canal como estimativa. Imposto e Ads permanecem custos do vendedor e não devem ser apresentados como dinheiro descontado pelo Mercado Livre, embora continuem participando do cálculo de lucro quando configurados.

Uma cotação oficial precisa de dados que o app ainda não possui, como categoria, peso/dimensões, modalidade e logística. Não será criado um valor fixo fictício para substituir esses dados.

## Alterações previstas

1. Criar no motor de precificação uma função única para calcular o líquido recebido com as taxas resolvidas para o preço.
2. Criar os indicadores derivados líquido/preço e líquido/custo, com retorno nulo quando o preço ou custo não permitir divisão válida.
3. Reaproveitar essa função no simulador da tela de detalhe, evitando fórmulas duplicadas.
4. Acrescentar na interface os valores do líquido recebido, líquido/preço e líquido/custo, preservando lucro e margem real existentes.
5. Atualizar textos para deixar explícito que os valores são estimados conforme a configuração do canal.
6. Adicionar testes unitários para o exemplo informado, divisão inválida e separação entre descontos do marketplace e custos de imposto/Ads.

## Fora do escopo

- Integração OAuth com a API do Mercado Livre.
- Cotação automática por categoria, peso, dimensões, CEP ou logística.
- Alteração automática das tarifas salvas pelo usuário.
- Afirmação de que uma simulação local equivale ao valor final de uma venda real.

## Critérios de aceite

- O caso R$49,67 / R$20,27 exibe líquido de aproximadamente R$29,86.
- O indicador líquido/preço exibe aproximadamente 60,12%.
- O indicador líquido/custo exibe aproximadamente 1,47x e 147,31%.
- Imposto e Ads não reduzem o campo “líquido recebido” quando configurados como custos do vendedor, mas reduzem o lucro quando aplicáveis.
- Todos os testes existentes continuam passando.
- A tela continua funcionando para canais sem frete, com custo zero e com resultado negativo.
