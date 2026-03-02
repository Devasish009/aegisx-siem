const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.emit('connected', {
      message: 'AegisX SOC WebSocket connected',
      timestamp: new Date().toISOString(),
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });

    socket.on('subscribe_alerts', () => {
      socket.join('alerts');
      socket.emit('subscribed', { room: 'alerts' });
    });
  });
};

module.exports = { setupSocket };
