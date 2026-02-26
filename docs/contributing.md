# Contributing to TypeORM Scopes

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/aramyounis/typeorm-query-scopes.git
   cd typeorm-query-scopes
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Run tests:
   ```bash
   npm test
   ```

## Development Workflow

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Build and test:
   ```bash
   npm run build
   npm test
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Open a Pull Request

### Code Style

- Use TypeScript
- Follow existing code style
- Add JSDoc comments for public APIs
- Keep functions focused and small
- Write descriptive variable names

### Testing

- Add tests for new features
- Ensure all tests pass
- Aim for high code coverage
- Test edge cases

Example test:

```typescript
describe('ScopedRepository', () => {
  it('should apply single scope', async () => {
    const users = await userRepo.scope('verified').find();
    expect(users.every(u => u.isVerified)).toBe(true);
  });
});
```

## Documentation

### Updating Docs

Documentation is in the `docs/` directory using VitePress.

1. Start the docs server:
   ```bash
   npm run docs:dev
   ```

2. Edit markdown files in `docs/`

3. Preview at `http://localhost:5173`

### Documentation Structure

- `docs/guide/` - User guides and tutorials
- `docs/api/` - API reference
- `docs/examples/` - Code examples
- `docs/.vitepress/config.mjs` - Site configuration

## Pull Request Guidelines

### Before Submitting

- [ ] Code builds without errors
- [ ] All tests pass
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Commit messages are clear

### PR Description

Include:
- What changes were made
- Why the changes were needed
- Any breaking changes
- Related issues

Example:

```markdown
## Changes
- Added support for nested scope merging
- Fixed bug in relation merging

## Why
Users reported issues when combining scopes with nested relations

## Breaking Changes
None

## Related Issues
Fixes #123
```

## Reporting Issues

### Bug Reports

Include:
- TypeORM version
- TypeORM Scopes version
- Node.js version
- Minimal reproduction code
- Expected vs actual behavior
- Error messages

### Feature Requests

Include:
- Use case description
- Proposed API
- Example code
- Why existing features don't work

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn

## Questions?

- Open a GitHub Discussion
- Check existing issues
- Read the documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

Thank you for contributing! 🎉
