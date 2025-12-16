# Contributing Guidelines

## Code of Conduct
Be respectful, inclusive, and professional in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## Development Process

### Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

### Commit Messages
```
type(scope): subject

body

footer
```

Types: feat, fix, docs, style, refactor, test, chore

Example:
```
feat(api): add export approval endpoint

Implement approval workflow for export requests
including validation and blockchain transaction

Closes #123
```

## Code Standards

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Use async/await over callbacks
- Add JSDoc comments for public APIs

### Go (Chaincode)
- Follow Go conventions
- Use gofmt for formatting
- Add unit tests for all functions
- Document exported functions

### Testing Requirements
- Unit tests for all new functions
- Integration tests for API endpoints
- Minimum 80% code coverage
- All tests must pass before merge

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Run linter**: `npm run lint`
4. **Run tests**: `npm test`
5. **Update CHANGELOG.md**
6. **Request review** from maintainers

## Review Criteria

- Code quality and readability
- Test coverage
- Documentation completeness
- Performance impact
- Security considerations
- Backward compatibility

## Questions?
Open an issue or contact maintainers.
