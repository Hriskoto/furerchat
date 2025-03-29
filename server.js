const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = socketIo(server);

let onlineUsers = {};  // Храним пользователей по их socket.id
let usernames = {}; // Храним занятые ники
let messages = [];  // Храним все сообщения

app.use(express.static('public'));  // Папка с вашими статичными файлами

io.on('connection', (socket) => {
  console.log('New user connected');

  // Обновление онлайн-счетчика
  io.emit('update_online_count', Object.keys(onlineUsers).length);
  
  // Отправка всем пользователям всех сообщений
  socket.emit('load_previous_messages', messages);

  socket.on('join', (username, callback) => {
    if (username.length > 15) {
      callback({ success: false, message: 'Username must be 15 characters or less.' });
    } else if (usernames[username]) {
      // Если имя занято
      callback({ success: false, message: 'Username is already taken.' });
    } else {
      // Если имя доступно
      onlineUsers[socket.id] = username;
      usernames[username] = socket.id;
      socket.username = username;

      // Отправляем всем, что новый пользователь присоединился
      io.emit('user_joined', username);
      callback({ success: true });
    }
  });

  socket.on('send_message', (message) => {
    // Сохраняем сообщение на сервере
    messages.push(message);

    // Отправляем сообщение всем остальным пользователям, включая отправителя
    socket.broadcast.emit('receive_message', message);
    io.to(socket.id).emit('receive_message', message);  // Отправляем сообщение отправителю
  });

  socket.on('like_message', (messageId, likes) => {
    // Отправляем всем пользователям обновленное количество лайков, включая отправителя
    io.emit('message_liked', messageId, likes);
  });

  socket.on('disconnect', () => {
    if (onlineUsers[socket.id]) {
      const username = onlineUsers[socket.id];
      delete onlineUsers[socket.id];
      delete usernames[username];

      // Отправляем всем, что пользователь покинул чат
      io.emit('user_left', username);

      // Обновляем онлайн-счетчик
      io.emit('update_online_count', Object.keys(onlineUsers).length);
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
