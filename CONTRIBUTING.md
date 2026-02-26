# Contributing to TypeORM Scopes

Thank you for your interest in contributing to TypeORM Scopes! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/typeorm-query-scopes.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests (when available)
npm test
```

## Project Structure

```
typeorm-query-scopes/
├── src/
│   ├── decorators.ts       # Scope decorators
│   ├── metadata.ts         # Metadata storage
│   ├── scoped-repository.ts # Repository implementation
│   ├── scope-merger.ts     # Scope merging logic
│   ├── types.ts            # TypeScript types
│   └── index.ts            # Public API
├── examples/               # Usage examples
├── dist/                   # Compiled output
└── README.md
```

## Coding Guidelines

### TypeScript

- Use TypeScript for all code
- Maintain strict type safety
- Export types for public APIs
- Use meaningful variable and function names

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Use trailing commas in multi-line objects/arrays
- Keep functions focused and small

### Comments

- Add JSDoc comments for public APIs
- Explain complex logic with inline comments
- Include usage examples in JSDoc

Example:
```typescript
/**
 * Apply one or more scopes to the repository
 * @example
 * userRepo.scope('active', 'withPosts').find()
 * userRepo.scope({ method: ['byRole', 'admin'] }).find()
 */
scope(...scopeNames: string[]): this {
  // Implementation
}
```

## Testing

When adding new features:

1. Add unit tests for new functionality
2. Ensure all existing tests pass
3. Test with different TypeORM versions if applicable
4. Add integration tests for complex features

## Documentation

- Update README.md for new features
- Add examples to the `examples/` directory
- Update CHANGELOG.md
- Add migration notes if breaking changes

## Pull Request Process

1. Update documentation as needed
2. Add tests for new features
3. Ensure the build passes: `npm run build`
4. Update CHANGELOG.md with your changes
5. Create a pull request with a clear description

### PR Title Format

Use conventional commit format:
- `feat: Add new feature`
- `fix: Fix bug description`
- `docs: Update documentation`
- `refactor: Refactor code`
- `test: Add tests`
- `chore: Update dependencies`

### PR Description

Include:
- What changes were made
- Why the changes were necessary
- How to test the changes
- Any breaking changes
- Related issues

## Feature Requests

Feature requests are welcome! Please:

1. Check if the feature already exists
2. Search existing issues
3. Create a new issue with:
   - Clear description of the feature
   - Use cases and examples
   - Why it would be useful

## Bug Reports

When reporting bugs, include:

1. TypeORM version
2. Node.js version
3. Minimal reproduction code
4. Expected behavior
5. Actual behavior
6. Error messages/stack traces

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

## Questions?

- Open an issue for questions
- Check existing documentation
- Look at examples in the `examples/` directory

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to TypeORM Scopes! 🎉
