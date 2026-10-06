import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { authService } from '../../services/authService';

export interface ConnectedAgent {
  socketId: string;
  userId: string;
  fullName: string;
  tenantId: string;
}

export class HelpdeskSocketServer {
  private io?: SocketIOServer;
  // Mapa de viewers por ticket: ticketId -> Map<socketId, ConnectedAgent>
  private ticketViewers: Map<string, Map<string, ConnectedAgent>> = new Map();

  attach(httpServer: HttpServer, corsOrigin: string = '*') {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigin,
        credentials: true,
      },
    });

    // Middleware de autenticación de Socket
    this.io.use((socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token || typeof token !== 'string') {
          return next(new Error('AUTHENTICATION_ERROR: Token requerido'));
        }

        const decoded = authService.verifyAccessToken(token);
        (socket as any).user = decoded;
        next();
      } catch (err) {
        next(new Error('AUTHENTICATION_ERROR: Token inválido o expirado'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user = (socket as any).user;
      const tenantRoom = `tenant:${user.tenantId}`;
      socket.join(tenantRoom);

      // Agente abre o entra a un ticket
      socket.on('ticket:join', (ticketId: string) => {
        const ticketRoom = `ticket:${ticketId}`;
        socket.join(ticketRoom);

        if (!this.ticketViewers.has(ticketId)) {
          this.ticketViewers.set(ticketId, new Map());
        }

        const viewers = this.ticketViewers.get(ticketId)!;
        const agentInfo: ConnectedAgent = {
          socketId: socket.id,
          userId: user.userId,
          fullName: user.fullName || 'Agente',
          tenantId: user.tenantId,
        };
        viewers.set(socket.id, agentInfo);

        const currentViewers = Array.from(viewers.values());

        // Emitir colisión si hay 2 o más agentes viendo el ticket simultáneamente
        if (currentViewers.length > 1) {
          this.io?.to(ticketRoom).emit('ticket:collision_alert', {
            ticketId,
            viewers: currentViewers,
            message: `Alerta: Hay ${currentViewers.length} agentes visualizando este ticket simultáneamente.`,
          });
        }

        this.io?.to(ticketRoom).emit('ticket:viewers_updated', {
          ticketId,
          viewers: currentViewers,
        });
      });

      // Agente sale del ticket
      socket.on('ticket:leave', (ticketId: string) => {
        this.leaveTicket(socket, ticketId);
      });

      // Desconexión
      socket.on('disconnect', () => {
        for (const [ticketId, viewers] of this.ticketViewers.entries()) {
          if (viewers.has(socket.id)) {
            viewers.delete(socket.id);
            if (viewers.size === 0) {
              this.ticketViewers.delete(ticketId);
            } else {
              this.io?.to(`ticket:${ticketId}`).emit('ticket:viewers_updated', {
                ticketId,
                viewers: Array.from(viewers.values()),
              });
            }
          }
        }
      });
    });

    return this.io;
  }

  private leaveTicket(socket: Socket, ticketId: string) {
    socket.leave(`ticket:${ticketId}`);
    const viewers = this.ticketViewers.get(ticketId);
    if (viewers) {
      viewers.delete(socket.id);
      if (viewers.size === 0) {
        this.ticketViewers.delete(ticketId);
      } else {
        this.io?.to(`ticket:${ticketId}`).emit('ticket:viewers_updated', {
          ticketId,
          viewers: Array.from(viewers.values()),
        });
      }
    }
  }

  getTicketViewers(ticketId: string): ConnectedAgent[] {
    const viewers = this.ticketViewers.get(ticketId);
    return viewers ? Array.from(viewers.values()) : [];
  }

  broadcastTicketEvent(tenantId: string, event: string, payload: unknown) {
    this.io?.to(`tenant:${tenantId}`).emit(event, payload);
  }
}

export const helpdeskSocketServer = new HelpdeskSocketServer();
