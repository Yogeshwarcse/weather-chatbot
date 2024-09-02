const socket = io();

document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('message-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const input = document.getElementById('message-input');
  const message = input.value.trim();

  if (message === '') return;

  addMessage(message, 'user-message');
  socket.emit('getWeather', message);
  input.value = '';
}

function addMessage(message, className) {
  const chatBox = document.getElementById('chat-box');
  const messageElement = document.createElement('div');
  messageElement.className = `message ${className}`;
  messageElement.textContent = message;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

socket.on('botMessage', (message) => {
  addMessage(message, 'bot-message');
});
