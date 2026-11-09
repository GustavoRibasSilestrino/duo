# Site da DUO Estamparia

Site de uma página (Astro, saída estática) para a DUO, estamparia de **Yasmin e Gabriel**. O visitante monta a peça com nome e número, vê na tela e manda o pedido de orçamento pelo WhatsApp.

## Rodar no seu computador

```bash
npm install
npm run dev
```

Abra `http://127.0.0.1:4321`. Para gerar o site final:

```bash
npm run build
```

A pasta `dist/` é o site pronto: suba o conteúdo dela em qualquer hospedagem (Netlify, Vercel, GitHub Pages, Hostinger…). Comando de build: `npm run build`. Pasta publicada: `dist`.

## O que você precisa preencher

1. **WhatsApp e Instagram**: `src/config/site.ts` (campos `whatsapp` e `instagram`). Enquanto o WhatsApp estiver vazio, os botões levam ao formulário e avisam que falta configurar, em vez de usar um número falso.
2. **Endereço final do site**: campo `url` no mesmo arquivo. Usado no link canônico e na imagem de compartilhamento.
3. **Fotos de Yasmin e Gabriel**: coloque `yasmin.jpg` e `gabriel.jpg` (ou `.png`/`.webp`) em `public/couple/`. Sem foto, as figurinhas usam a inicial.

## Textos para você conferir

Escrevi estes textos sem saber os detalhes do negócio. Troque o que não for verdade:

- A explicação do slogan (seção em roxo): dois corações, dois objetivos, um propósito.
- Os quatro passos de "Como funciona": a DUO responde com orçamento, ajusta a arte com o cliente e combina a entrega.
- Os textos curtos das peças (camiseta, ecobag, bolsa, copo).
- "Valores, prazos e formas de pagamento a gente combina no WhatsApp": nenhum preço, prazo ou técnica de estampa foi inventado.

As cores da peça na prévia são ilustrativas (a página avisa isso). Os arquivos de texto ficam em `src/components/`.

## Entrada animada

Tela roxa, o logo se monta (o **u** cai por último) e um círculo de tinta cresce do canto superior esquerdo revelando a página. Aparece **uma vez por sessão**, qualquer clique ou tecla pula, e não aparece para quem pediu "reduzir movimento" no sistema. Na barra de endereço:

- `?nointro` pula a entrada;
- `?review` mostra a página inteira, parada (útil para capturas de tela).

## Onde mexer no visual

- Cores, espaços e movimento: `src/styles/global.css` (variáveis no início).
- Letras de aplique (os números grandes): `src/components/Twill.astro`.
- Peças (camiseta, ecobag, bolsa, copo): `src/components/Piece.astro`.
- Comportamento (prévia, formulário, entrada, história): `src/scripts/app.ts`.
- Imagem de compartilhamento: `tools/og.html` → gera `public/og.png`.

## Pendências suas

- Prova física do roxo `#7A3CFF` antes de produzir em escala.
- Busca de registro da marca no INPI.
- Fotos e, se quiserem, depoimentos de clientes (só com autorização deles).
