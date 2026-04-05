import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'TypeORM Query Scopes',
  description: 'Reusable query patterns for TypeORM entities',
  base: '/typeorm-query-scopes/',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/typeorm-query-scopes/favicon.svg' }]
  ],
  
  themeConfig: {
    logo: '/logo.svg',
    
    outline: {
      level: [2, 3],
      label: 'On this page'
    },
    
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/decorators' },
      { text: 'Examples', link: '/examples/basic' },
      {
        text: 'v1.0.1',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'Contributing', link: '/contributing' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is TypeORM Query Scopes?', link: '/guide/what-is-typeorm-query-scopes' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Why Scopes?', link: '/guide/why-scopes' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Default Scopes', link: '/guide/default-scopes' },
            { text: 'Named Scopes', link: '/guide/named-scopes' },
            { text: 'Function Scopes', link: '/guide/function-scopes' },
            { text: 'Scope Merging', link: '/guide/scope-merging' }
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Type-Safe Scopes', link: '/guide/type-safe-scopes' },
            { text: 'Best Practices', link: '/guide/best-practices' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Decorators', link: '/api/decorators' },
            { text: 'ScopedRepository', link: '/api/scoped-repository' },
            { text: 'Types', link: '/api/types' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Usage', link: '/examples/basic' },
            { text: 'Advanced Patterns', link: '/examples/advanced' },
            { text: 'Real-World App', link: '/examples/real-world' },
            { text: 'NestJS Integration', link: '/examples/nestjs' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/aramyounis/typeorm-query-scopes' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/typeorm-query-scopes' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026-present'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/aramyounis/typeorm-query-scopes/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  }
})
