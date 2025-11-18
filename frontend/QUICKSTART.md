# Quick Start Guide

Get the Coffee Blockchain Consortium frontend up and running in minutes.

## Prerequisites

- **Node.js**: 16.x or higher
- **npm**: 8.x or higher
- **Git**: Latest version

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourorg/cbc.git
cd cbc/frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React and React Router
- Material-UI components
- Vite build tool
- Testing libraries
- Development tools (ESLint, Prettier, TypeScript)

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

The default values work for local development. Modify if needed:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_EXPORTER_API=http://localhost:3001
VITE_NATIONALBANK_API=http://localhost:3002
VITE_ECTA_API=http://localhost:3003
VITE_SHIPPING_API=http://localhost:3004
VITE_CUSTOMS_API=http://localhost:3005
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:5173**

## Development Workflow

### Running the Application

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type check (TypeScript)
npm run type-check
```

### Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── pages/          # Page-level components
├── services/       # API integration
├── config/         # Configuration files
├── utils/          # Utility functions
├── styles/         # Global styles
└── test/           # Test utilities
```

## Available Organizations

Login with any of these organizations:

1. **commercialbank** - Create and manage exports
2. **National Bank** - Approve FX requests
3. **ECTA** - Issue quality certifications
4. **Shipping Line** - Manage shipments
5. **Custom Authorities** - Customs clearance

## Default Test Credentials

For development/testing purposes:

```
Username: admin
Password: admin123
Organization: (select from dropdown)
```

## Common Tasks

### Adding a New Component

1. Create component file in `src/components/`
2. Add corresponding test in `src/components/__tests__/`
3. Export from component file
4. Import where needed

Example:
```jsx
// src/components/MyComponent.jsx
import React from 'react';

const MyComponent = ({ title }) => {
  return <div>{title}</div>;
};

export default MyComponent;
```

### Adding a New Page

1. Create page file in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/Layout.jsx`

### Making API Calls

Use the configured axios client:

```javascript
import apiClient from '@/services/api';

// GET request
const response = await apiClient.get('/exports');

// POST request
const response = await apiClient.post('/exports', data);
```

## Troubleshooting

### Port Already in Use

If port 5173 is already in use:

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config.js
```

### Dependencies Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### API Connection Issues

1. Ensure backend APIs are running on correct ports
2. Check CORS configuration in backend
3. Verify API URLs in `.env` file
4. Check browser console for errors

## IDE Setup

### VS Code (Recommended)

Install recommended extensions when prompted, or manually install:

- ESLint
- Prettier
- ES7+ React/Redux/React-Native snippets
- Path Intellisense
- TypeScript support

### Settings

The project includes `.editorconfig` for consistent formatting across editors.

## Git Workflow

### Branch Naming

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes
- `refactor/` - Code refactoring

### Commit Messages

Follow Conventional Commits:

```
feat(exports): add filtering by status
fix(login): resolve token expiry issue
docs(readme): update installation steps
```

### Before Committing

```bash
npm run lint:fix
npm run format
npm test
```

## Next Steps

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
2. Review [README.md](README.md) for detailed documentation
3. Check [SECURITY.md](SECURITY.md) for security best practices
4. Explore the codebase and components

## Getting Help

- **Documentation**: Check README.md and other docs
- **Issues**: Search existing GitHub issues
- **Questions**: Open a new issue with `question` label
- **Security**: Email security@coffeeblockchain.org

## Useful Links

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Material-UI Documentation](https://mui.com)
- [React Router Documentation](https://reactrouter.com)
- [Vitest Documentation](https://vitest.dev)

---

Happy coding! 🚀
