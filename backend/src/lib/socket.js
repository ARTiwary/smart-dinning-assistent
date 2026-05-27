import { io } from '../index.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    const tableId = socket.handshake.query.tableId;
    if (!tableId) return socket.disconnect();

    socket.join(`table:${tableId}`);
    console.log(`Socket connected: table ${tableId}`);

    socket.on('user:join', (data) => {
      socket.to(`table:${tableId}`).emit('session:user_joined', {
        displayName: data.displayName,
        tableId
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: table ${tableId}`);
    });
  });
}

export function broadcastCartUpdate(io, tableId, event, data) {
  io.to(`table:${tableId}`).emit(event, data);
}