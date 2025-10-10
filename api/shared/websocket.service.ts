import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  organization?: string;
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
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = jwt.verify(token, process.env['JWT_SECRET'] || 'your-secret-key') as any;
        socket.userId = decoded.userId;
        socket.username = decoded.username;
        socket.organization = decoded.organization;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`Client connected: ${socket.id} (User: ${socket.username})`);
      
      // Store connected client
      if (socket.userId) {
        this.connectedClients.set(socket.userId, socket);
      }

      // Join organization room
      if (socket.organization) {
        socket.join(`org:${socket.organization}`);
        console.log(`User ${socket.username} joined room: org:${socket.organization}`);
      }

      // Handle subscription to specific exports
      socket.on('subscribe:export', (exportId: string) => {
        socket.join(`export:${exportId}`);
        console.log(`User ${socket.username} subscribed to export: ${exportId}`);
        socket.emit('subscribed', { exportId });
      });

      // Handle unsubscription
      socket.on('unsubscribe:export', (exportId: string) => {
        socket.leave(`export:${exportId}`);
        console.log(`User ${socket.username} unsubscribed from export: ${exportId}`);
        socket.emit('unsubscribed', { exportId });
      });

      // Handle ping for connection health check
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id} (Reason: ${reason})`);
        if (socket.userId) {
          this.connectedClients.delete(socket.userId);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
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
    console.log(`Emitted update for export: ${exportId}`);
  }

  // Emit new export creation to organization
  public emitNewExport(organization: string, data: any): void {
    this.io.to(`org:${organization}`).emit('export:created', {
      data,
      timestamp: new Date().toISOString()
    });
    console.log(`Emitted new export to organization: ${organization}`);
  }

  // Emit FX approval notification
  public emitFXApproval(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('fx:approved', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    console.log(`Emitted FX approval for export: ${exportId}`);
  }

  // Emit FX rejection notification
  public emitFXRejection(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('fx:rejected', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    console.log(`Emitted FX rejection for export: ${exportId}`);
  }

  // Emit quality certification notification
  public emitQualityCertification(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('quality:certified', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    console.log(`Emitted quality certification for export: ${exportId}`);
  }

  // Emit quality rejection notification
  public emitQualityRejection(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('quality:rejected', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    console.log(`Emitted quality rejection for export: ${exportId}`);
  }

  // Emit shipment scheduled notification
  public emitShipmentScheduled(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('shipment:scheduled', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    console.log(`Emitted shipment scheduled for export: ${exportId}`);
  }

  // Emit shipment confirmed notification
  public emitShipmentConfirmed(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('shipment:confirmed', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    console.log(`Emitted shipment confirmed for export: ${exportId}`);
  }

  // Emit export completed notification
  public emitExportCompleted(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('export:completed', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    console.log(`Emitted export completed: ${exportId}`);
  }

  // Emit export cancelled notification
  public emitExportCancelled(exportId: string, data: any): void {
    this.io.to(`export:${exportId}`).emit('export:cancelled', {
      exportId,
      data,
      timestamp: new Date().toISOString()
    });
    console.log(`Emitted export cancelled: ${exportId}`);
  }

  public emitDocumentUploaded(exportId: string, docType: string, version: number, cid: string): void {
    this.io.to(`export:${exportId}`).emit('document:uploaded', {
      exportId,
      docType,
      version,
      cid,
      timestamp: new Date().toISOString()
    });
    console.log(`Emitted document uploaded for export: ${exportId}`);
  }

  public emitDocumentDeleted(exportId: string, docType: string, version: number): void {
    this.io.to(`export:${exportId}`).emit('document:deleted', {
      exportId,
      docType,
      version,
      timestamp: new Date().toISOString()
    });
    console.log(`Emitted document deleted for export: ${exportId}`);
  }

  // Send notification to specific user
  public sendNotificationToUser(userId: string, notification: any): void {
    const socket = this.connectedClients.get(userId);
    if (socket) {
      socket.emit('notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
      console.log(`Sent notification to user: ${userId}`);
    }
  }

  // Broadcast to all connected clients
  public broadcast(event: string, data: any): void {
    this.io.emit(event, {
      data,
      timestamp: new Date().toISOString()
    });
    console.log(`Broadcasted event: ${event}`);
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
    console.log('WebSocket service closed');
  }
}

// Singleton instance
let websocketService: WebSocketService | null = null;

export const initializeWebSocket = (httpServer: HTTPServer): WebSocketService => {
  if (!websocketService) {
    websocketService = new WebSocketService(httpServer);
    console.log('WebSocket service initialized');
  }
  return websocketService;
};

export const getWebSocketService = (): WebSocketService | null => {
  return websocketService;
};