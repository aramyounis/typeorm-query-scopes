# TypeORM Scopes Documentation

This directory contains the documentation site for TypeORM Scopes, built with VitePress.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run docs:dev

# Build for production
npm run docs:build

# Preview production build
npm run docs:preview
```

## Structure

```
docs/
├── .vitepress/
│   └── config.ts          # VitePress configuration
├── guide/                 # User guide
│   ├── getting-started.md
│   ├── what-is-typeorm-query-scopes.md
│   └── ...
├── api/                   # API reference
│   ├── decorators.md
│   └── ...
├── examples/              # Code examples
│   ├── basic.md
│   └── ...
├── public/                # Static assets
│   └── logo.svg
└── index.md              # Homepage
```

## Contributing

When adding new documentation:

1. Create the markdown file in the appropriate directory
2. Add it to the sidebar in `.vitepress/config.ts`
3. Test locally with `npm run docs:dev`
4. Submit a pull request

## Deployment

The documentation can be deployed to:

- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

See [VitePress deployment guide](https://vitepress.dev/guide/deploy) for details.
