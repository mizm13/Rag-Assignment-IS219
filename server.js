// server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io"); // Import the Server class from socket.io
const app = express();
const server = http.createServer(app); // Create an HTTP server using Express
const io = new Server(server); // Initialize Socket.IO, passing it the HTTP server
const PORT = process.env.PORT || 3000;

// Store connected users
const users = {};

// Serve the index.html file when someone visits the root URL
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// --- Socket.IO Logic ---
io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id); // Log when a new client connects
  
  // Add user to the users object
  users[socket.id] = {
    id: socket.id,
    username: `User-${socket.id.substring(0, 5)}`
  };
  
  // Broadcast updated user list to all clients
  io.emit('user list', Object.values(users));
  
  // Listen for 'disconnect' events
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    
    // Remove user from users object
    delete users[socket.id];
    
    // Broadcast updated user list to all clients
    io.emit('user list', Object.values(users));
  });
  
  // Listen for 'chat message' events from a client
  socket.on('chat message', (msg) => {
    console.log('💬 Message received:', msg);
    
    // Broadcast the message to ALL connected clients (including the sender)
    io.emit('chat message', {
      userId: socket.id,
      username: users[socket.id].username,
      msg: msg
    });
  });
  
  // Listen for 'typing' event
  socket.on('typing', () => {
    // Broadcast to all other clients that this user is typing
    socket.broadcast.emit('user typing', {
      userId: socket.id,
      username: users[socket.id].username
    });
  });
  
  // Listen for 'stop typing' event
  socket.on('stop typing', () => {
    // Broadcast to all other clients that this user stopped typing
    socket.broadcast.emit('user stopped typing', {
      userId: socket.id,
      username: users[socket.id].username
    });
  });
  
  // Listen for username change
  socket.on('set username', (username) => {
    users[socket.id].username = username;
    io.emit('user list', Object.values(users));
  });
});
// --- End Socket.IO Logic ---

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});