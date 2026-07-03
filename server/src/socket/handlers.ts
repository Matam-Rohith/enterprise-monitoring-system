import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { verifyToken } from '../utils/jwt';

export function setupSocketHandlers(io: Server): void {
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      const user = verifyToken(token);
      (socket as Socket & { user: typeof user }).user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as Socket & { user: { userId: string; email: string } }).user;
    logger.info(`Socket connected: ${user?.email} (${socket.id})`);

    socket.join('global');

    socket.on('join:service', (serviceId: string) => {
      socket.join(`service:${serviceId}`);
    });

    socket.on('leave:service', (serviceId: string) => {
      socket.leave(`service:${serviceId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${user?.email} (${socket.id})`);
    });
  });
}
