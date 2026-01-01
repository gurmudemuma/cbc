import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
<<<<<<< HEAD
import * as jwt from 'jsonwebtoken';
=======
import jwt from 'jsonwebtoken';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
import { createLogger } from './logger';

const logger = createLogger('WebSocketService');

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  organization?: string;
  messageCount?: number;
  lastMessageTime?: number;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env['CORS_ORIGIN'] || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth['token'] || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        logger.warn('WebSocket connection attempt without token', {
          socketId: socket.id,
          ip: socket.handshake.address
        });
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const jwtSecret = process.env['JWT_SECRET'];
        if (!jwtSecret || jwtSecret === 'your-secret-key') {
          logger.error('JWT_SECRET not properly configured');
          return next(new Error('Server configuration error'));
        }

        const decoded = jwt.verify(token, jwtSecret) as any;
        socket.userId = decoded.userId;
        socket.username = decoded.username;
        socket.organization = decoded.organization;
        socket.messageCount = 0;
        socket.lastMessageTime = Date.now();
<<<<<<< HEAD

=======
        
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        logger.info('WebSocket authenticated', {
          userId: socket.userId,
          username: socket.username,
          organization: socket.organization
        });
<<<<<<< HEAD

=======
        
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        next();
      } catch (error) {
        logger.warn('WebSocket authentication failed', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Rate limiting middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      const originalEmit = socket.emit.bind(socket);
<<<<<<< HEAD

      socket.emit = function (event: string, ...args: any[]) {
        const now = Date.now();
        socket.messageCount = socket.messageCount || 0;
        socket.lastMessageTime = socket.lastMessageTime || now;

=======
      
      socket.emit = function(event: string, ...args: any[]) {
        const now = Date.now();
        socket.messageCount = socket.messageCount || 0;
        socket.lastMessageTime = socket.lastMessageTime || now;
        
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        // Reset counter every second
        if (now - socket.lastMessageTime > 1000) {
          socket.messageCount = 0;
          socket.lastMessageTime = now;
        }
<<<<<<< HEAD

        socket.messageCount++;

=======
        
        socket.messageCount++;
        
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        // Limit to 100 messages per second
        if (socket.messageCount > 100) {
          logger.warn('WebSocket rate limit exceeded', {
            userId: socket.userId,
            messageCount: socket.messageCount
          });
          socket.disconnect(true);
          return false;
        }
<<<<<<< HEAD

        return originalEmit(event, ...args);
      };

=======
        
        return originalEmit(event, ...args);
      };
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      next();
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info('WebSocket client connected', {
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        organization: socket.organization
      });
<<<<<<< HEAD

=======
      
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      // Store connected client
      if (socket.userId) {
        this.connectedClients.set(socket.userId, socket);
      }

      // Join organization room
      if (socket.organization) {
        socket.join(`org:${socket.organization}`);
        logger.debug('User joined organization room', {
          username: socket.username,
          organization: socket.organization
        });
      }

      // Handle subscription to specific exports
      socket.on('subscribe:export', (exportId: string) => {
        if (!exportId || typeof exportId !== 'string') {
          logger.warn('Invalid export ID in subscription', { userId: socket.userId });
          return;
        }
        socket.join(`export:${exportId}`);
        logger.debug('User subscribed to export', {
          username: socket.username,
          exportId
        });
        socket.emit('subscribed', { exportId });
      });

      // Handle unsubscription
      socket.on('unsubscribe:export', (exportId: string) => {
        if (!exportId || typeof exportId !== 'string') {
          logger.warn('Invalid export ID in unsubscription', { userId: socket.userId });
          return;
        }
        socket.leave(`export:${exportId}`);
        logger.debug('User unsubscribed from export', {
          username: socket.username,
          exportId
        });
        socket.emit('unsubscribed', { exportId });
      });

      // Handle ping for connection health check
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info('WebSocket client disconnected', {
          socketId: socket.id,
          userId: socket.userId,
          reason
        });
        if (socket.userId) {
          this.connectedClients.delete(socket.userId);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('WebSocket error', {
          socketId: socket.id,
          userId: socket.userId,
          error
        });
      });
    });
  }

  // Emit export status update to all subscribers
  public emitExportUpdate(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('export:updated', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    logger.debug('Emitted update for export', { exportId });
  }

  // Emit new export creation to organization
  public emitNewExport(organization: string, data: any): void {
    this.io.to(`org:${organization}`).emit('export:created', {
      data,
      timestamp: new Date().toISOString()
    });
    logger.debug('Emitted new export to organization', { organization });
  }

  // Emit FX approval notification
  public emitFXApproval(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('fx:approved', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    logger.debug('Emitted FX approval for export', { exportId });
  }

  // Emit FX rejection notification
  public emitFXRejection(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('fx:rejected', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    logger.debug('Emitted FX rejection for export', { exportId });
  }

  // Emit quality certification notification
  public emitQualityCertification(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('quality:certified', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    logger.debug('Emitted quality certification for export', { exportId });
  }

  // Emit quality rejection notification
  public emitQualityRejection(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('quality:rejected', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    logger.debug('Emitted quality rejection for export', { exportId });
  }

  // Emit shipment scheduled notification
  public emitShipmentScheduled(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('shipment:scheduled', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    logger.debug('Emitted shipment scheduled for export', { exportId });
  }

  // Emit shipment confirmed notification
  public emitShipmentConfirmed(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('shipment:confirmed', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    logger.debug('Emitted shipment confirmed for export', { exportId });
  }

  // Emit export completed notification
  public emitExportCompleted(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('export:completed', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    logger.debug('Emitted export completed', { exportId });
  }

  // Emit export cancelled notification
  public emitExportCancelled(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('export:cancelled', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    logger.debug('Emitted export cancelled', { exportId });
  }

  public emitDocumentUploaded(exportId: string, docType: string, version: number, cid: string): void {
    this.io.to(`export:${exportId}`).emit('document:uploaded', {
      exportId,
      docType,
      version,
      cid,
      timestamp: new Date().toISOString()
    });
    logger.debug('Emitted document uploaded for export', { exportId, docType, version });
  }

  public emitDocumentDeleted(exportId: string, docType: string, version: number): void {
    this.io.to(`export:${exportId}`).emit('document:deleted', {
      exportId,
      docType,
      version,
      timestamp: new Date().toISOString()
    });
    logger.debug('Emitted document deleted for export', { exportId, docType, version });
  }

  // Send notification to specific user
  public sendNotificationToUser(userId: string, notification: any): void {
    const socket = this.connectedClients.get(userId);
    if (socket) {
      socket.emit('notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
      logger.debug('Sent notification to user', { userId });
    }
  }

  // Broadcast to all connected clients
  public broadcast(event: string, data: any): void {
    this.io.emit(event, {
      data,
      timestamp: new Date().toISOString()
    });
    logger.debug('Broadcasted event', { event });
  }

  // Get connected clients count
  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get connected clients by organization
  public getClientsByOrganization(organization: string): number {
    return this.io.sockets.adapter.rooms.get(`org:${organization}`)?.size || 0;
  }

  // Close all connections
  public close(): void {
    this.io.close();
    this.connectedClients.clear();
    logger.info('WebSocket service closed');
  }
}

// Singleton instance
let websocketService: WebSocketService | null = null;

export const initializeWebSocket = (httpServer: HTTPServer): WebSocketService => {
  if (!websocketService) {
    websocketService = new WebSocketService(httpServer);
    logger.info('WebSocket service initialized');
  }
  return websocketService;
};

export const getWebSocketService = (): WebSocketService | null => {
  return websocketService;
};