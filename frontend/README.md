# Coffee Blockchain Consortium - Frontend Portal

A comprehensive React-based frontend application for the Coffee Export Consortium Blockchain system. This unified portal provides interfaces for all participating organizations to manage coffee exports through their complete lifecycle.

## 🎯 Overview

The frontend provides role-based interfaces for:
- **Exporter Bank** - Create and manage export requests
- **National Bank** - Approve/reject foreign exchange (FX) requests
- **NCAT** - Issue quality certifications
- **Shipping Line** - Schedule and confirm shipments

## 🏗️ Architecture

### Tech Stack
- **React 18.2** - UI framework
- **React Router 6** - Client-side routing
- **Axios** - HTTP client for API communication
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **Date-fns** - Date formatting utilities

### Project Structure
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.jsx       # Button component with variants
│   │   ├── Card.jsx         # Card container component
│   │   └── Layout.jsx       # Main layout with navigation
│   ├── pages/               # Page components
│   │   ├── Login.jsx        # Authentication page
│   │   ├── Dashboard.jsx    # Overview dashboard
│   │   ├── ExportManagement.jsx    # Export CRUD operations
│   │   ├── ExportDetails.jsx       # Detailed export view
│   │   ├── QualityCertification.jsx # NCAT quality management
│   │   ├── FXRates.jsx             # National Bank FX approval
│   │   └── ShipmentTracking.jsx    # Shipping Line operations
│   ├── services/            # API integration
│   │   └── api.ts           # Axios configuration
│   ├── App.jsx              # Main app component with routing
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles and CSS variables
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
└── .env.example             # Environment variables template
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm 8+
- Backend APIs running (ports 3001-3004)
- Blockchain network operational

### Installation

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env if needed (default values work for local development)
```

3. **Start development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## 🎨 Features

### 1. Authentication System
- **Multi-organization login** - Select organization before login
- **JWT-based authentication** - Secure token-based auth
- **Persistent sessions** - LocalStorage for token management
- **Auto-redirect** - Protected routes with automatic redirection

### 2. Dashboard
- **Real-time statistics** - Export counts, pending items, active shipments
- **Recent activity feed** - Latest export updates
- **Quick actions** - Role-based action buttons
- **Organization indicator** - Current user's organization display

### 3. Export Management (Exporter Bank)
- **Create exports** - Form-based export request creation
- **List view** - Searchable and filterable export table
- **Status tracking** - Visual status badges
- **Detail view** - Complete export information with history
- **Complete/Cancel** - Export lifecycle management

### 4. FX Approval (National Bank)
- **Pending requests** - Filter exports awaiting FX approval
- **FX rate display** - Current exchange rate (KES/USD)
- **Approve/Reject** - Modal-based approval workflow
- **Conversion calculator** - Automatic USD to KES conversion
- **Approval tracking** - View approved and rejected requests

### 5. Quality Certification (NCAT)
- **Quality review** - Exports awaiting certification
- **Grade assignment** - Predefined quality grades
- **Certificate issuance** - Generate quality certificates
- **Rejection workflow** - Reject with detailed reasons
- **Statistics** - Pending, certified, and rejected counts

### 6. Shipment Tracking (Shipping Line)
- **Ready to ship** - Exports with quality certification
- **Schedule shipments** - Assign vessel and dates
- **Confirm departure** - Mark shipments as shipped
- **Transit tracking** - Duration calculation
- **Vessel management** - Track vessel assignments

### 7. Export Details
- **Complete information** - All export data in one view
- **Tabbed interface** - Details and history tabs
- **Status timeline** - Visual transaction history
- **Blockchain audit trail** - Complete transaction log
- **Action buttons** - Context-aware actions based on status

## 🎨 Design System

### Color Scheme
The application uses a dark theme with purple and golden accents:
- **Primary (Golden)**: `#FFD700` - Actions, highlights
- **Secondary (Purple)**: `#8B00FF` - Accents, borders
- **Background**: Dark gradients (`#0a0a0a` to `#1a1a1a`)
- **Success**: Green tones for approvals
- **Danger**: Red tones for rejections

### Components

#### Button
```jsx
<Button 
  variant="primary|secondary|outline|ghost|success|danger"
  size="small|medium|large"
  icon={<Icon />}
  loading={boolean}
  disabled={boolean}
  fullWidth={boolean}
>
  Button Text
</Button>
```

#### Card
```jsx
<Card 
  title="Card Title"
  icon={<Icon />}
  variant="default|elevated"
  className="custom-class"
>
  Card Content
</Card>
```

### Status Badges
- **PENDING** - Purple, awaiting action
- **FX_APPROVED** - Golden, FX approved
- **QUALITY_CERTIFIED** - Golden, quality certified
- **SHIPMENT_SCHEDULED** - Purple, scheduled
- **SHIPPED** - Purple, in transit
- **COMPLETED** - Green, finished
- **REJECTED/CANCELLED** - Red, terminated

## 🔌 API Integration

### Base URLs
The application dynamically switches API base URLs based on the selected organization:
- Exporter Bank: `http://localhost:3001/api`
- National Bank: `http://localhost:3002/api`
- NCAT: `http://localhost:3003/api`
- Shipping Line: `http://localhost:3004/api`

### Authentication Flow
1. User selects organization and enters credentials
2. Frontend sends POST to `/api/auth/login`
3. Backend returns JWT token and user data
4. Token stored in localStorage
5. Token included in all subsequent requests via interceptor

### API Endpoints Used

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

#### Exports (Exporter Bank)
- `GET /api/exports` - List all exports
- `POST /api/exports` - Create new export
- `GET /api/exports/:id` - Get export details
- `GET /api/exports/:id/history` - Get export history
- `PUT /api/exports/:id/complete` - Complete export
- `PUT /api/exports/:id/cancel` - Cancel export

#### FX (National Bank)
- `GET /api/fx/exports` - List all exports
- `POST /api/fx/approve` - Approve FX
- `POST /api/fx/reject` - Reject FX

#### Quality (NCAT)
- `GET /api/quality/exports` - List all exports
- `POST /api/quality/certify` - Issue certificate
- `POST /api/quality/reject` - Reject quality

#### Shipments (Shipping Line)
- `GET /api/shipments/exports` - List all exports
- `POST /api/shipments/schedule` - Schedule shipment
- `POST /api/shipments/confirm` - Confirm shipment

## 🔒 Security Features

1. **JWT Authentication** - Secure token-based authentication
2. **Protected Routes** - Automatic redirect for unauthenticated users
3. **Token Expiration** - Automatic logout on token expiry
4. **CORS Handling** - Proper cross-origin configuration
5. **Input Validation** - Client-side form validation
6. **XSS Protection** - React's built-in XSS protection

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- **Desktop**: 1024px+ (full layout)
- **Tablet**: 768px-1023px (adapted layout)
- **Mobile**: <768px (stacked layout)

## 🎯 User Workflows

### Creating an Export (Exporter Bank)
1. Login as Exporter Bank user
2. Navigate to "Export Management"
3. Click "Create Export" button
4. Fill in export details (exporter, coffee type, quantity, destination, value)
5. Submit form
6. Export created with PENDING status

### Approving FX (National Bank)
1. Login as National Bank user
2. Navigate to "FX Approval"
3. View pending exports (status: PENDING)
4. Click "Approve" on an export
5. Enter FX approval ID and approver name
6. Submit approval
7. Export status changes to FX_APPROVED

### Certifying Quality (NCAT)
1. Login as NCAT user
2. Navigate to "Quality Certification"
3. View exports with FX approval
4. Click "Certify" on an export
5. Select quality grade and enter certifier name
6. Submit certification
7. Export status changes to QUALITY_CERTIFIED

### Scheduling Shipment (Shipping Line)
1. Login as Shipping Line user
2. Navigate to "Shipment Tracking"
3. View exports ready to ship (QUALITY_CERTIFIED)
4. Click "Schedule" on an export
5. Enter vessel name, departure and arrival dates
6. Submit schedule
7. Export status changes to SHIPMENT_SCHEDULED

### Confirming Shipment (Shipping Line)
1. View scheduled shipments
2. Click "Confirm" on a scheduled export
3. Confirm departure
4. Export status changes to SHIPPED

### Completing Export (Exporter Bank)
1. View shipped exports
2. Click "Complete Export"
3. Confirm completion
4. Export status changes to COMPLETED

## 🐛 Troubleshooting

### Common Issues

**1. Cannot connect to API**
- Ensure backend APIs are running on ports 3001-3004
- Check CORS configuration in backend
- Verify network connectivity

**2. Login fails**
- Verify user credentials
- Check if backend authentication service is running
- Ensure correct organization is selected

**3. Exports not loading**
- Check browser console for errors
- Verify API endpoints are accessible
- Ensure JWT token is valid

**4. Styles not loading**
- Clear browser cache
- Rebuild application: `npm run build`
- Check for CSS import errors

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Adding New Features

1. **New Page**: Create component in `src/pages/`
2. **New Route**: Add route in `src/App.jsx`
3. **New API Call**: Add function in `src/services/api.ts`
4. **New Component**: Create in `src/components/`
5. **New Styles**: Add to component CSS or `index.css`

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use meaningful variable names
- Add comments for complex logic
- Keep components focused and reusable

## 📊 Performance

- **Code Splitting**: Automatic with Vite
- **Lazy Loading**: Routes loaded on demand
- **Optimized Builds**: Minification and tree-shaking
- **Fast Refresh**: Instant HMR during development

## 🚀 Deployment

### Production Build
```bash
npm run build
```

Output in `dist/` directory.

### Deployment Options
1. **Static Hosting**: Netlify, Vercel, GitHub Pages
2. **Docker**: Create Dockerfile with nginx
3. **Traditional Server**: Apache, Nginx

### Environment Variables
Create `.env.production`:
```
VITE_API_BASE_URL=https://your-api-domain.com
```

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📧 Support

For issues or questions:
- Check documentation
- Review code comments
- Open GitHub issue
- Contact development team

---

**Built with ❤️ for the Coffee Export Consortium Blockchain**
