# 👨‍💻 Developer Quick Start Guide

Quick reference for developers working on the Coffee Blockchain Consortium project.

---

## 🚀 Getting Started (5 Minutes)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd CBC

# Install dependencies for all APIs
npm run install:all

# Or install for specific API
cd api/exporter-bank && npm install
```

### 2. Configure Environment
```bash
# Copy example environment file
cp .env.example api/exporter-bank/.env

# Edit required variables
nano api/exporter-bank/.env
```

**Minimum Required Variables**:
```bash
PORT=3001
JWT_SECRET=your-secret-min-32-chars-for-production
ORGANIZATION_ID=exporterbank
ORGANIZATION_NAME=ExporterBank
MSP_ID=ExporterBankMSP
CHANNEL_NAME=coffeechannel
CHAINCODE_NAME_EXPORT=coffee-export
CHAINCODE_NAME_USER=user-management
```

### 3. Start Fabric Network
```bash
cd network
./network.sh up
./network.sh createChannel
./network.sh deployCC
```

### 4. Start API Server
```bash
cd api/exporter-bank
npm run dev
```

### 5. Verify
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok",...}
```

---

## 📝 Common Development Tasks

### Running Tests
```bash
cd api/exporter-bank

# Run all tests
npm test

# Watch mode
npm test -- --watch

# With coverage
npm test -- --coverage

# Specific test file
npm test export.controller
```

### Linting & Formatting
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Building
```bash
# Build TypeScript
npm run build

# Clean build
rm -rf dist && npm run build
```

### Database Operations (if using off-chain DB)
```bash
# Run migrations
npm run migrate

# Seed database
npm run seed

# Reset database
npm run db:reset
```

---

## 🔧 Configuration

### Environment Variables Priority
1. `.env` file (highest priority)
2. System environment variables
3. Default values (lowest priority)

### Key Configuration Files
```
api/exporter-bank/
├── .env                    # Your local config (not committed)
├── .env.example            # Template with all variables
├── .env.production.example # Production template
├── tsconfig.json          # TypeScript config
└── package.json           # Dependencies and scripts
```

### Generating Secrets
```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Encryption Key (32 bytes hex)
openssl rand -hex 32

# Random password
openssl rand -base64 24
```

---

## 🧪 Testing Guidelines

### Test File Naming
```
__tests__/
├── unit/
│   ├── export.controller.test.ts
│   └── auth.controller.test.ts
├── integration/
│   ├── api.integration.test.ts
│   └── fabric.integration.test.ts
└── e2e/
    └── export-flow.e2e.test.ts
```

### Writing Tests
```typescript
import { TestDataGenerator, MockRequest, MockResponse } from '../../../shared/test-setup';

describe('ExportController', () => {
  it('should create export successfully', async () => {
    const data = TestDataGenerator.generateExportRequest();
    const req = MockRequest.create({ body: data });
    const res = MockResponse.create();
    
    await controller.createExport(req, res, jest.fn());
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
```

### Running Specific Tests
```bash
# By file
npm test export.controller

# By pattern
npm test -- --testNamePattern="create export"

# With debugging
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 🔒 Security Best Practices

### Input Validation
```typescript
import { InputSanitizer } from '../../../shared/input.sanitizer';

// Sanitize user input
const sanitized = InputSanitizer.sanitizeExportRequest(req.body);

// Validate ID format
const id = InputSanitizer.sanitizeId(req.params.id);

// Validate email
const email = InputSanitizer.sanitizeEmail(req.body.email);
```

### Password Handling
```typescript
import { validatePassword } from '../../../shared/security.best-practices';

// Validate password strength
const result = validatePassword(password);
if (!result.valid) {
  return res.status(400).json({ errors: result.errors });
}

// Hash password
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash(password, 10);
```

### Authentication
```typescript
import { authMiddleware } from '../middleware/auth.middleware';

// Protect routes
router.get('/exports', authMiddleware, exportController.getAllExports);

// Access user in controller
const userId = req.user?.id;
const orgId = req.user?.organizationId;
```

---

## 📊 Debugging

### Enable Debug Logging
```bash
# In .env
DEBUG=true
LOG_LEVEL=debug
```

### View Logs
```bash
# API logs
tail -f logs/api.log

# Fabric network logs
docker logs peer0.exporterbank.coffee-export.com

# Follow logs
docker logs -f peer0.exporterbank.coffee-export.com
```

### Debug in VS Code
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["${workspaceFolder}/api/exporter-bank/src/index.ts"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### Common Issues

#### Port Already in Use
```bash
# Find process
lsof -ti:3001

# Kill process
lsof -ti:3001 | xargs kill -9
```

#### Fabric Connection Issues
```bash
# Check if network is running
docker ps

# Restart network
cd network
./network.sh down
./network.sh up
```

#### Module Not Found
```bash
# Clear node_modules
rm -rf node_modules package-lock.json
npm install
```

---

## 🌐 API Development

### Creating New Endpoints

#### 1. Add Route
```typescript
// routes/export.routes.ts
router.post('/exports/:id/approve', 
  authMiddleware, 
  validateApproval,
  exportController.approveExport
);
```

#### 2. Add Validation Middleware
```typescript
// middleware/validation.middleware.ts
export const validateApproval = [
  body('comments').optional().isString().trim().isLength({ max: 500 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

#### 3. Add Controller Method
```typescript
// controllers/export.controller.ts
public approveExport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    
    // Sanitize inputs
    const sanitizedId = InputSanitizer.sanitizeId(id);
    const sanitizedComments = InputSanitizer.sanitizeText(comments);
    
    // Call chaincode
    const contract = this.fabricGateway.getExportContract();
    await contract.submitTransaction('ApproveExport', sanitizedId, sanitizedComments);
    
    res.json({ success: true, message: 'Export approved' });
  } catch (error) {
    console.error('Error approving export:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

#### 4. Add Tests
```typescript
// __tests__/export.controller.test.ts
it('should approve export successfully', async () => {
  const exportId = 'EXP-123';
  const req = MockRequest.create({
    params: { id: exportId },
    body: { comments: 'Approved' }
  });
  const res = MockResponse.create();
  
  await controller.approveExport(req, res);
  
  expect(res.statusCode).toBe(200);
  expect(mockContract.submitTransaction).toHaveBeenCalledWith(
    'ApproveExport', exportId, 'Approved'
  );
});
```

---

## 📚 Code Style Guidelines

### TypeScript
```typescript
// Use interfaces for object shapes
interface ExportRequest {
  exporterId: string;
  quantity: number;
}

// Use type for unions/aliases
type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

// Prefer async/await over promises
async function fetchData(): Promise<Data> {
  const result = await contract.evaluateTransaction('GetData');
  return JSON.parse(result.toString());
}

// Use const for immutable values
const MAX_RETRY_ATTEMPTS = 3;

// Use arrow functions for callbacks
array.map(item => item.id);
```

### Naming Conventions
```typescript
// Classes: PascalCase
class ExportController { }

// Functions/Methods: camelCase
function createExport() { }

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10;

// Files: kebab-case
// export-controller.ts
// auth-middleware.ts
```

### Error Handling
```typescript
// Always catch and handle errors
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('Failed to complete operation');
}

// Use custom error types
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

---

## 🔄 Git Workflow

### Branch Naming
```bash
# Features
git checkout -b feature/add-export-approval

# Bug fixes
git checkout -b fix/authentication-error

# Refactoring
git checkout -b refactor/improve-error-handling

# Documentation
git checkout -b docs/update-api-guide
```

### Commit Messages
```bash
# Format: <type>: <description>

# Examples
git commit -m "feat: add export approval endpoint"
git commit -m "fix: resolve JWT expiration issue"
git commit -m "docs: update API documentation"
git commit -m "test: add unit tests for export controller"
git commit -m "refactor: improve error handling in auth middleware"
```

### Before Committing
```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Build to check for TypeScript errors
npm run build
```

---

## 📦 Dependency Management

### Adding Dependencies
```bash
# Production dependency
npm install package-name

# Development dependency
npm install --save-dev package-name

# Update package.json
npm install package-name@version
```

### Updating Dependencies
```bash
# Check for outdated packages
npm outdated

# Update specific package
npm update package-name

# Update all packages (careful!)
npm update

# Security audit
npm audit
npm audit fix
```

### Removing Dependencies
```bash
npm uninstall package-name

# Also remove from package.json
npm uninstall --save package-name
```

---

## 🚀 Deployment Checklist

### Before Deploying

- [ ] All tests passing: `npm test`
- [ ] Code linted: `npm run lint`
- [ ] Build successful: `npm run build`
- [ ] Environment variables set correctly
- [ ] Database migrations run (if applicable)
- [ ] Security audit clean: `npm audit`
- [ ] Documentation updated
- [ ] Code reviewed and approved

### Environment-Specific

#### Staging
```bash
NODE_ENV=staging
DEBUG=false
LOG_LEVEL=info
```

#### Production
```bash
NODE_ENV=production
DEBUG=false
LOG_LEVEL=warn
FORCE_HTTPS=true
TRUST_PROXY=true
# Strong secrets (32+ chars)
JWT_SECRET=<generated-secret>
ENCRYPTION_KEY=<generated-key>
```

---

## 📞 Getting Help

### Documentation
- [Main README](README.md)
- [Architecture Guide](ARCHITECTURE.md)
- [Best Practices](BEST_PRACTICES_IMPROVEMENTS.md)
- [API Documentation](README.md#api-documentation)

### Common Commands Quick Reference
```bash
# Development
npm run dev              # Start dev server
npm test                 # Run tests
npm run lint            # Lint code
npm run build           # Build for production

# Network
./network.sh up         # Start Fabric network
./network.sh down       # Stop Fabric network
./network.sh deployCC   # Deploy chaincode

# Troubleshooting
docker ps               # Check running containers
docker logs <container> # View container logs
npm run clean          # Clean build artifacts
```

### Need More Help?
1. Check existing documentation
2. Search issues in repository
3. Ask team members
4. Create new issue with detailed information

---

**Happy Coding! 🎉**

Last Updated: 2025-10-10
