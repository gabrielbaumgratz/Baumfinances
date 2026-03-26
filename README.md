# fintrack

Controle financeiro pessoal — PWA para iPhone e desktop.

## Estrutura

```
fintrack/
├── public/
│   ├── index.html        # meta tags PWA + iOS
│   ├── manifest.json     # config PWA
│   ├── icon-192.png      # ícone app (adicione o seu)
│   └── icon-512.png      # ícone app (adicione o seu)
├── src/
│   ├── index.js          # entry point React
│   ├── App.jsx           # componente principal
│   ├── data/
│   │   └── seed.js       # dados iniciais + helpers
│   ├── hooks/
│   │   └── useStore.js   # hook localStorage
│   └── components/
│       ├── SwipeRow.jsx  # swipe para editar/deletar
│       ├── RainbowChart.jsx  # gráfico em arco-íris
│       ├── Modal.jsx     # sheet modal iOS
│       └── Splash.jsx    # animação de abertura
└── package.json
```

## Tecnologias

- **React 18** — UI
- **JSX** — sintaxe dos componentes  
- **CSS-in-JS** (inline styles) — estilização sem dependências
- **localStorage** — persistência de dados local
- **SVG** — gráfico arco-íris feito na mão
- **PWA** (manifest + meta tags Apple) — instalar como app no iPhone

## Setup

```bash
npm install
npm start        # dev
npm run build    # build para produção
```

## Deploy (GitHub Pages)

1. Sobe o projeto no GitHub
2. Instala o pacote:
```bash
npm install --save-dev gh-pages
```
3. No `package.json`, adiciona:
```json
"homepage": "https://SEU_USUARIO.github.io/fintrack",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```
4. Roda:
```bash
npm run deploy
```
5. No GitHub: Settings → Pages → Source: `gh-pages`

## Instalar como app no iPhone

1. Acessa o link no Safari
2. Toca no botão de compartilhar (quadrado com seta)
3. "Adicionar à Tela de Início"
4. Pronto — abre fullscreen sem barra do browser

## Ícones

Adiciona dois arquivos em `/public`:
- `icon-192.png` — 192x192px
- `icon-512.png` — 512x512px

Pode gerar no [favicon.io](https://favicon.io) ou usar qualquer imagem quadrada.
