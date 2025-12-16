import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from '../../../shared/middleware/errorHandler';
import { requestLogger } from '../../../shared/middleware/logger';
import { validateRequest } from '../../../shared/middleware/validation';
import authRoutes from './routes/auth';
import exportRoutes from './routes/exports';
import fxRoutes from './routes/fx';
import { FabricGateway } from './services/fabricGateway';
import { DatabaseService } from '../../../shared/database/service';

class CommercialBankAPI {
    public app: express.Application;
    private fabricGateway: FabricGateway;
    private dbService: DatabaseService;

    constructor() {
        this.app = express();
        this.fabricGateway = new FabricGateway('CommercialBankMSP');
        this.dbService = new DatabaseService();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddleware(): void {
        // Security middleware
        this.app.use(helmet());
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
            credentials: true
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP'
        });
        this.app.use(limiter);

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Logging
        this.app.use(requestLogger);
    }

    private initializeRoutes(): void {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'Commercial Bank API',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0'
            });
        });

        // API routes
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/exports', exportRoutes);
        this.app.use('/api/fx', fxRoutes);

        // API documentation
        this.app.get('/api/docs', (req, res) => {
            res.json({
                service: 'Commercial Bank API',
                endpoints: {
                    auth: [
                        'POST /api/auth/login',
                        'POST /api/auth/refresh',
                        'POST /api/auth/logout'
                    ],
                    exports: [
                        'POST /api/exports',
                        'GET /api/exports',
                        'GET /api/exports/:id',
                        'PUT /api/exports/:id/documents'
                    ],
                    fx: [
                        'POST /api/fx/application',
                        'GET /api/fx/rates',
                        'GET /api/fx/history'
                    ]
                }
            });
        });
    }

    private initializeErrorHandling(): void {
        this.app.use(notFoundHandler);
        this.app.use(errorHandler);
    }

    public async start(): Promise<void> {
        try {
            // Initialize Fabric connection
            await this.fabricGateway.connect();
            
            // Initialize database
            await this.dbService.connect();
            
            const PORT = process.env.PORT || 3001;
            this.app.listen(PORT, () => {
                console.log(`🏢 Commercial Bank API running on port ${PORT}`);
                console.log(`📊 Health check: http://localhost:${PORT}/health`);
                console.log(`📚 API docs: http://localhost:${PORT}/api/docs`);
            });
        } catch (error) {
            console.error('Failed to start Commercial Bank API:', error);
            process.exit(1);
        }
    }
}

export default CommercialBankAPI;
