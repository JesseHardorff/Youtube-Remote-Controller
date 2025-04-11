const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statische bestanden serveren
app.use(express.static('.'));

// Socket.IO verbindingen afhandelen
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Luister naar berichten van clients
  socket.on('command', (command) => {
    console.log(`Received command: ${command}`);
    // Stuur het commando naar alle andere clients
    socket.broadcast.emit('command', command);
  });

  // Wanneer een client de verbinding verbreekt
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start de server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
