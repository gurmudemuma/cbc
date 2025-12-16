"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebSocketService = exports.initializeWebSocket = exports.WebSocketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class WebSocketService {
    constructor(httpServer) {
        this.connectedClients = new Map();
        this.io = new socket_io_1.Server(httpServer, {
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
    setupMiddleware() {
        // Authentication middleware
        this.io.use((socket, next) => {
            const token = socket.handshake.auth['token'] || socket.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env['JWT_SECRET'] || 'your-secret-key');
                socket.userId = decoded.userId;
                socket.username = decoded.username;
                socket.organization = decoded.organization;
                next();
            }
            catch (error) {
                next(new Error('Authentication error: Invalid token'));
            }
        });
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
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
            socket.on('subscribe:export', (exportId) => {
                socket.join(`export:${exportId}`);
                console.log(`User ${socket.username} subscribed to export: ${exportId}`);
                socket.emit('subscribed', { exportId });
            });
            // Handle unsubscription
            socket.on('unsubscribe:export', (exportId) => {
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
    emitExportUpdate(exportId, data) {
        this.io.to(`export:${exportId}`).emit('export:updated', {
            exportId,
            data,
            timestamp: new Date().toISOString()
        });
        console.log(`Emitted update for export: ${exportId}`);
    }
    // Emit new export creation to organization
    emitNewExport(organization, data) {
        this.io.to(`org:${organization}`).emit('export:created', {
            data,
            timestamp: new Date().toISOString()
        });
        console.log(`Emitted new export to organization: ${organization}`);
    }
    // Emit FX approval notification
    emitFXApproval(exportId, data) {
        this.io.to(`export:${exportId}`).emit('fx:approved', {
            exportId,
            data,
            timestamp: new Date().toISOString()
        });
        console.log(`Emitted FX approval for export: ${exportId}`);
    }
    // Emit FX rejection notification
    emitFXRejection(exportId, data) {
        this.io.to(`export:${exportId}`).emit('fx:rejected', {
            exportId,
            data,
            timestamp: new Date().toISOString()
        });
        console.log(`Emitted FX rejection for export: ${exportId}`);
    }
    // Emit quality certification notification
    emitQualityCertification(exportId, data) {
        this.io.to(`export:${exportId}`).emit('quality:certified', {
            exportId,
            data,
            timestamp: new Date().toISOString()
        });
        console.log(`Emitted quality certification for export: ${exportId}`);
    }
    // Emit quality rejection notification
    emitQualityRejection(exportId, data) {
        this.io.to(`export:${exportId}`).emit('quality:rejected', {
            exportId,
            data,
            timestamp: new Date().toISOString()
        });
        console.log(`Emitted quality rejection for export: ${exportId}`);
    }
    // Emit shipment scheduled notification
    emitShipmentScheduled(exportId, data) {
        this.io.to(`export:${exportId}`).emit('shipment:scheduled', {
            exportId,
            data,
            timestamp: new Date().toISOString()
        });
        console.log(`Emitted shipment scheduled for export: ${exportId}`);
    }
    // Emit shipment confirmed notification
    emitShipmentConfirmed(exportId, data) {
        this.io.to(`export:${exportId}`).emit('shipment:confirmed', {
            exportId,
            data,
            timestamp: new Date().toISOString()
        });
        console.log(`Emitted shipment confirmed for export: ${exportId}`);
    }
    // Emit export completed notification
    emitExportCompleted(exportId, data) {
        this.io.to(`export:${exportId}`).emit('export:completed', {
            exportId,
            data,
            timestamp: new Date().toISOString()
        });
        console.log(`Emitted export completed: ${exportId}`);
    }
    // Emit export cancelled notification
    emitExportCancelled(exportId, data) {
        this.io.to(`export:${exportId}`).emit('export:cancelled', {
            exportId,
            data,
            timestamp: new Date().toISOString()
        });
        console.log(`Emitted export cancelled: ${exportId}`);
    }
    emitDocumentUploaded(exportId, docType, version, cid) {
        this.io.to(`export:${exportId}`).emit('document:uploaded', {
            exportId,
            docType,
            version,
            cid,
            timestamp: new Date().toISOString()
        });
        console.log(`Emitted document uploaded for export: ${exportId}`);
    }
    emitDocumentDeleted(exportId, docType, version) {
        this.io.to(`export:${exportId}`).emit('document:deleted', {
            exportId,
            docType,
            version,
            timestamp: new Date().toISOString()
        });
        console.log(`Emitted document deleted for export: ${exportId}`);
    }
    // Send notification to specific user
    sendNotificationToUser(userId, notification) {
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
    broadcast(event, data) {
        this.io.emit(event, {
            data,
            timestamp: new Date().toISOString()
        });
        console.log(`Broadcasted event: ${event}`);
    }
    // Get connected clients count
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }
    // Get connected clients by organization
    getClientsByOrganization(organization) {
        return this.io.sockets.adapter.rooms.get(`org:${organization}`)?.size || 0;
    }
    // Close all connections
    close() {
        this.io.close();
        this.connectedClients.clear();
        console.log('WebSocket service closed');
    }
}
exports.WebSocketService = WebSocketService;
// Singleton instance
let websocketService = null;
const initializeWebSocket = (httpServer) => {
    if (!websocketService) {
        websocketService = new WebSocketService(httpServer);
        console.log('WebSocket service initialized');
    }
    return websocketService;
};
exports.initializeWebSocket = initializeWebSocket;
const getWebSocketService = () => {
    return websocketService;
};
exports.getWebSocketService = getWebSocketService;
//# sourceMappingURL=websocket.service.js.map