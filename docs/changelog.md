# Changelog

All notable changes to TypeORM Scopes will be documented here.

## [1.0.1] - 2026-04-05

### Added

- `relationScopes` support for applying scopes on related entities by relation path
- Support for list syntax in relation scopes, for example `role: ['activeOnly', 'adminOnly']`
- Support for function scopes in relation scope lists, for example `{ method: ['byTenant', 10] }`
- Integration test coverage for relation scope list behavior

### Documentation

- Added relation scopes documentation in API pages
- Added advanced examples for relation scope lists
- Updated guides and homepage examples to show multi-scope relation lists

## [1.0.0] - 2026-02-27

### Added

- Initial stable release
- `@Scopes` decorator for defining named scopes
- `@DefaultScope` decorator for default query filters
- `ScopedRepository` class with scope methods
- `getScopedRepository` helper function
- Support for all TypeORM find options (where, select, relations, order, etc.)
- Function scopes with parameters
- Scope merging and composition
- Type-safe scope names (optional second generic parameter)
- `unscoped()` method to remove default scope
- Comprehensive documentation and examples

### Features

- **Named Scopes**: Define reusable query patterns
- **Default Scopes**: Automatic filters applied to all queries
- **Function Scopes**: Dynamic scopes with runtime parameters
- **Scope Composition**: Combine multiple scopes
- **Type Safety**: Full TypeScript support with autocomplete
- **TypeORM Compatible**: Works with existing TypeORM entities

### Documentation

- Getting started guide
- API reference
- Usage examples
- NestJS integration guide

## [Unreleased]

### Planned

- Additional scope utilities
- Performance optimizations
- More examples and use cases
- Community feedback integration

---

## Version History

- **1.0.1** - Relation scope lists and docs update (2026-04-05)
- **1.0.0** - Initial stable release (2026-02-27)

## Upgrade Guide

### From Nothing to 1.0.0

This is the first release. See [Getting Started](/guide/getting-started) for installation and usage.

## Breaking Changes

None yet - this is the first release.

## Deprecations

None yet.

## See Also

- [GitHub Releases](https://github.com/aramyounis/typeorm-query-scopes/releases)
- [Contributing Guide](/contributing)
- [Migration Guide](/guide/migration)
