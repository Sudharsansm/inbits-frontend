# InBits

A calm, book-readable feed of news, gossip, and jobs — scraped from good sources and served like a magazine.

Built with [TanStack Start](https://tanstack.com/start), React 19, and Tailwind CSS. Ships as an installable Progressive Web App.

## Development

Requires Node.js 20+.

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

## Project structure

- `src/routes` — file-based routes (TanStack Router)
- `src/components` — UI components
- `src/lib` — utilities, content helpers, error handling
- `public` — static assets and PWA icons

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint
- `npm run format` — run Prettier
