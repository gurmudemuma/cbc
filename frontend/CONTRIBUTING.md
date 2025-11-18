# Contributing to Coffee Blockchain Consortium Frontend

Thank you for your interest in contributing to the Coffee Blockchain Consortium Frontend! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cbc.git
   cd cbc/frontend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming Convention

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes for production
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions or modifications

Example: `feature/add-export-filtering`

### Code Style

We use ESLint and Prettier to maintain code quality and consistency.

**Before committing, run:**

```bash
npm run lint        # Check for linting errors
npm run format      # Format code with Prettier
```

### Key Coding Standards

1. **Component Structure**
   - Use functional components with hooks
   - Keep components focused and single-responsibility
   - Extract reusable logic into custom hooks

2. **File Organization**
   ```
   src/
   ├── components/     # Reusable UI components
   ├── pages/          # Page-level components
   ├── services/       # API and external services
   ├── config/         # Configuration files
   ├── utils/          # Utility functions
   ├── styles/         # Global styles
   └── hooks/          # Custom React hooks
   ```

3. **Naming Conventions**
   - Components: PascalCase (e.g., `ExportCard.jsx`)
   - Utilities: camelCase (e.g., `formatDate.js`)
   - Constants: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)
   - CSS classes: kebab-case (e.g., `export-card`)

4. **Import Order**
   ```javascript
   // 1. External dependencies
   import React from 'react';
   import { Button } from '@mui/material';
   
   // 2. Internal dependencies
   import apiClient from '@/services/api';
   import { formatDate } from '@/utils/date';
   
   // 3. Components
   import Card from '@/components/Card';
   
   // 4. Styles
   import './styles.css';
   ```

5. **Props and State**
   - Use destructuring for props
   - Provide meaningful prop names
   - Document complex props with JSDoc comments

6. **Error Handling**
   - Always handle API errors gracefully
   - Provide user-friendly error messages
   - Log errors for debugging (development only)

7. **Performance**
   - Use `React.memo()` for expensive components
   - Implement proper key props in lists
   - Avoid inline function definitions in render
   - Use `useMemo` and `useCallback` appropriately

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(exports): add filtering by status

Add ability to filter exports by their current status (pending, approved, etc.)

Closes #123
```

```
fix(login): resolve authentication token expiry issue

Fixed bug where expired tokens weren't being properly cleared from localStorage

Fixes #456
```

## Pull Request Process

1. **Update Documentation**
   - Update README.md if needed
   - Add JSDoc comments for new functions
   - Update CHANGELOG.md

2. **Test Your Changes**
   - Ensure all tests pass
   - Add new tests for new features
   - Test manually in the browser

3. **Create Pull Request**
   - Use a clear, descriptive title
   - Reference related issues
   - Provide a detailed description of changes
   - Include screenshots for UI changes

4. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Unit tests pass
   - [ ] Manual testing completed
   - [ ] Browser compatibility checked
   
   ## Screenshots (if applicable)
   
   ## Related Issues
   Closes #123
   ```

5. **Code Review**
   - Address reviewer feedback promptly
   - Keep discussions professional and constructive
   - Make requested changes in new commits

6. **Merge Requirements**
   - All CI checks must pass
   - At least one approval from maintainers
   - No merge conflicts
   - Up-to-date with main branch

## Testing

### Running Tests

```bash
npm test              # Run all tests
npm test -- --watch   # Run tests in watch mode
npm test -- --coverage # Generate coverage report
```

### Writing Tests

- Write tests for all new features
- Maintain test coverage above 80%
- Use React Testing Library for component tests
- Mock API calls appropriately

Example:
```javascript
import { render, screen } from '@testing-library/react';
import ExportCard from './ExportCard';

describe('ExportCard', () => {
  it('renders export information correctly', () => {
    const export = {
      id: '1',
      exporter: 'Test Exporter',
      status: 'PENDING'
    };
    
    render(<ExportCard export={export} />);
    
    expect(screen.getByText('Test Exporter')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });
});
```

## Documentation

### Code Comments

- Use JSDoc for functions and components
- Explain "why" not "what"
- Keep comments up-to-date

Example:
```javascript
/**
 * Formats an export status into a human-readable label
 * @param {string} status - The export status code
 * @returns {string} Formatted status label
 */
function formatStatus(status) {
  // Implementation
}
```

### README Updates

- Update README.md for significant changes
- Include examples for new features
- Keep installation instructions current

## Questions?

If you have questions or need help:

1. Check existing documentation
2. Search closed issues
3. Open a new issue with the `question` label
4. Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to the Coffee Blockchain Consortium! 🎉
