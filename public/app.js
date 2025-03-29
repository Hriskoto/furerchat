let socket = io();

// Функция для входа в чат
function enterChat() {
  const username = document.getElementById("username").value;

  if (username.length > 15) {
    showError("Username must be 15 characters or less.");
    return;
  }

  if (username) {
    // Отправляем ник на сервер для проверки
    socket.emit("join", username, (response) => {
      if (response.success) {
        // Если ник доступен, скрываем форму ввода и показываем чат
        document.getElementById("nameInput").style.display = "none";
        document.getElementById("chatContainer").style.display = "flex";
      } else {
        // Если ник занят, показываем сообщение об ошибке
        showError(response.message);
      }
    });
  }
}

// Функция для отображения ошибки
function showError(message) {
  const errorMessageElement = document.getElementById("error-message");
  errorMessageElement.textContent = message;
  errorMessageElement.style.color = "red";
}

// Обработчик для "Enter" кнопки при вводе ника
document.getElementById("username").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    enterChat();  // Если нажали "Enter", отправляем никнейм
  }
});

// Функция для отправки сообщения
function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value;
  const username = document.getElementById("username").value;

  if (message) {
    const messageObj = {
      user: username,
      text: message,
      time: new Date().toLocaleTimeString(),
      likes: 0,
      id: Date.now() // Уникальный идентификатор для каждого сообщения
    };

    // Отправляем сообщение на сервер
    socket.emit("send_message", messageObj);
    messageInput.value = "";  // Очищаем поле ввода
    displayMessage(messageObj, "my-message");
  }
}

// Функция для отображения сообщения
function displayMessage(message, type) {
  const messageContainer = document.getElementById("messages");
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", type);
  messageDiv.id = message.id;  // Устанавливаем уникальный ID для каждого сообщения

  const senderName = document.createElement("div");
  senderName.classList.add("sender-name");
  senderName.textContent = message.user;

  const text = document.createElement("div");
  text.classList.add("message-text");
  text.textContent = message.text;

  const time = document.createElement("div");
  time.classList.add("message-time");
  time.textContent = message.time;

  // Добавляем лайк кнопку
  const likeButton = document.createElement("span");
  likeButton.classList.add("message-likes");
  likeButton.textContent = `❤️ ${message.likes}`;
  likeButton.addEventListener('click', function () {
    toggleLike(messageDiv, message.id);
  });

  messageDiv.appendChild(senderName);
  messageDiv.appendChild(text);
  messageDiv.appendChild(time);
  messageDiv.appendChild(likeButton);

  messageContainer.appendChild(messageDiv);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Обработчик для лайков
function toggleLike(messageElement, messageId) {
  const likeCountElement = messageElement.querySelector('.message-likes');
  let likes = parseInt(likeCountElement.textContent.replace('❤️ ', ''));

  // Переключение состояния лайка
  if (messageElement.classList.contains('liked')) {
    messageElement.classList.remove('liked');
    likes--;
  } else {
    messageElement.classList.add('liked');
    likes++;
  }

  // Обновляем количество лайков
  likeCountElement.textContent = `❤️ ${likes}`;

  // Отправляем обновленный счетчик лайков на сервер
  socket.emit('like_message', messageId, likes);
}

// Обновление онлайн счетчика
socket.on("update_online_count", (count) => {
  document.getElementById("onlineCount").textContent = `Online: ${count}`;
});

// Получение сообщения от другого пользователя
socket.on("receive_message", (message) => {
  // Проверяем, не отправил ли это сообщение сам пользователь
  if (message.user !== document.getElementById("username").value) {
    displayMessage(message, message.user === document.getElementById("username").value ? "my-message" : "other-message");
  }
});

// Получение информации о лайках
socket.on("message_liked", (messageId, likes) => {
  const messageElement = document.getElementById(messageId);
  if (messageElement) {
    const likeCountElement = messageElement.querySelector('.message-likes');
    likeCountElement.textContent = `❤️ ${likes}`;
  }
});

// Сообщения при подключении и отключении пользователей
socket.on("user_joined", (username) => {
  const messageObj = {
    user: "System",
    text: `${username} has joined the chat.`,
    time: new Date().toLocaleTimeString(),
  };
  displayMessage(messageObj, "system");
});

socket.on("user_left", (username) => {
  const messageObj = {
    user: "System",
    text: `${username} has left the chat.`,
    time: new Date().toLocaleTimeString(),
  };
  displayMessage(messageObj, "system");
});

// Загружаем старые сообщения при подключении
socket.on('load_previous_messages', (messages) => {
  messages.forEach(message => {
    // Только не отображаем сообщение отправителя дважды
    if (message.user !== document.getElementById("username").value) {
      displayMessage(message, message.user === document.getElementById("username").value ? "my-message" : "other-message");
    }
  });
});
