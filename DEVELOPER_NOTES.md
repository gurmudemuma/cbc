# Developer Notes - Coffee Blockchain Consortium

## Quick Reference for Common Issues and Solutions

---

## 🚨 Common Pitfalls to Avoid

### 1. Route Ordering in Express
**ALWAYS** define specific routes before generic parameter routes:

```typescript
// ✅ CORRECT
router.get('/status/:status', handler);  // Specific route first
router.get('/:id', handler);             // Generic route second

// ❌ WRONG
router.get('/:id', handler);             // Generic route first
router.get('/status/:status', handler);  // Will never be reached!
```

### 2. Fabric Directory Paths
The project uses simplified directory names, not full domain names:

```typescript
// ✅ CORRECT
'network/organizations/exporter-bank/...'
'network/organizations/national-bank/...'
'network/organizations/ncat/...'
'network/organizations/shipping-line/...'

// ❌ WRONG
'network/organizations/peerOrganizations/exporterbank.coffee-export.com/...'
```

### 3. Async/Await in Express Middleware
Always use proper async error handling:

```typescript
// ✅ CORRECT
export const handler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // async operations
    res.json({ success: true });
  } catch (error) {
    next(error); // Pass to error handler
  }
};

// ❌ WRONG - Missing try/catch
export const handler = async (req: Request, res: Response): Promise<void> => {
  const result = await someAsyncOperation(); // Unhandled rejection!
  res.json(result);
};
```

---

## 📁 Project Structure

```
CBC/
├── api/                          # Backend API services
│   ├── exporter-bank/           # Port 3001
│   ├── national-bank/           # Port 3002
│   ├── ncat/                    # Port 3003
│   └── shipping-line/           # Port 3004
├── chaincode/                   # Smart contracts
│   └── coffee-export/           # Main chaincode
├── frontend/                    # React frontend (Port 3000)
├── network/                     # Hyperledger Fabric network
│   ├── docker/                  # Docker compose files
│   ├── organizations/           # MSP and connection profiles
│   └── scripts/                 # Network management scripts
└── scripts/                     # Setup and utility scripts
```

---

## 🔧 Development Workflow

### Starting the Application

1. **Start Fabric Network:**
```bash
cd network
./network.sh up
./network.sh createChannel
./network.sh deployCC
```

2. **Start API Services (in separate terminals):**
```bash
# Terminal 1 - Exporter Bank
cd api/exporter-bank
npm install
npm run dev

# Terminal 2 - National Bank
cd api/national-bank
npm install
npm run dev

# Terminal 3 - NCAT
cd api/ncat
npm install
npm run dev

# Terminal 4 - Shipping Line
cd api/shipping-line
npm install
npm run dev
```

3. **Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Stopping the Application

```bash
# Stop Fabric network
cd network
./network.sh down

# API services - Ctrl+C in each terminal
# Frontend - Ctrl+C
```

---

## 🐛 Debugging Tips

### Issue: "Connection profile not found"
**Solution:** Check that connection profiles exist:
```bash
ls -la network/organizations/*/connection-*.json
```

### Issue: "Failed to connect to Fabric network"
**Solution:** Verify network is running:
```bash
docker ps | grep coffee-export
```

### Issue: "Admin identity not found in wallet"
**Solution:** Check MSP directory structure:
```bash
ls -la network/organizations/*/msp/
```

### Issue: "Route not found" or wrong endpoint called
**Solution:** Check route ordering in routes files. Specific routes must come before generic parameter routes.

### Issue: "Cannot read property of undefined"
**Solution:** Ensure proper null checks and optional chaining:
```typescript
// ✅ CORRECT
const value = obj?.property?.nested;

// ❌ WRONG
const value = obj.property.nested; // May throw error
```

---

## 🔐 Security Best Practices

### 1. JWT Secrets
**NEVER** use default JWT secrets in production:
```bash
# .env
JWT_SECRET=your-very-long-random-secret-key-here-change-this
```

### 2. Password Hashing
Always hash passwords before storing:
```typescript
const hashedPassword = await bcrypt.hash(password, 10);
```

### 3. Input Validation
Always validate user input:
```typescript
import { body, validationResult } from 'express-validator';

export const validateInput = [
  body('field').notEmpty().withMessage('Field is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

### 4. CORS Configuration
Configure CORS properly for production:
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
```

---

## 📊 API Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (dev mode only)"
}
```

---

## 🔄 Export Status Flow

```
PENDING
  ↓
FX_APPROVED (by National Bank)
  ↓
QUALITY_CERTIFIED (by NCAT)
  ↓
SHIPMENT_SCHEDULED (by Shipping Line)
  ↓
SHIPPED (by Shipping Line)
  ↓
COMPLETED (by Exporter Bank)

Rejection paths:
PENDING → FX_REJECTED
FX_APPROVED → QUALITY_REJECTED
Any status (except SHIPPED/COMPLETED) → CANCELLED
```

---

## 🧪 Testing Endpoints

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### Create Export (requires token)
```bash
curl -X POST http://localhost:3001/api/exports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "exporterName": "ABC Coffee",
    "coffeeType": "Arabica",
    "quantity": 5000,
    "destinationCountry": "USA",
    "estimatedValue": 50000
  }'
```

### Get Exports by Status
```bash
curl -X GET http://localhost:3001/api/exports/status/PENDING \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📝 Code Style Guidelines

### TypeScript
- Use explicit return types for functions
- Enable strict mode in tsconfig.json
- Use interfaces for object shapes
- Prefer `const` over `let`
- Use async/await over promises

### Naming Conventions
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Interfaces: `PascalCase` (prefix with `I` optional)

### Error Handling
```typescript
// ✅ CORRECT - Specific error handling
try {
  await operation();
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof NetworkError) {
    // Handle network error
  } else {
    // Handle unknown error
  }
}
```

---

## 🚀 Performance Tips

1. **Use Connection Pooling:** Fabric gateway uses singleton pattern
2. **Cache Static Data:** Cache connection profiles and certificates
3. **Async Operations:** Always use async/await for I/O operations
4. **Proper Indexing:** Use CouchDB indexes for complex queries
5. **Batch Operations:** Group multiple chaincode calls when possible

---

## 📚 Additional Resources

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Router Documentation](https://reactrouter.com/)

---

## 🤝 Contributing

When adding new features:
1. Follow existing code structure
2. Add proper error handling
3. Include input validation
4. Update API documentation
5. Test all endpoints
6. Update this guide if needed

---

**Last Updated:** 2024
**Maintained By:** Development Team
