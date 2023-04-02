const socket = io();
// Chat field, and chat button elements
const chatInput = document.getElementById("chat-message");
const sendButton = document.getElementById("chat-message-button");

// Join room field, and join button elements
const roomInput = document.getElementById("join-number");
const joinButton = document.getElementById("join-number-button");

// Add event listener to the chat form
document.getElementById("chatForm").addEventListener("submit", (event) => {
  event.preventDefault(); // Prevent the default form submission behavior
  // Get the chat message input value
  const message = chatInput.value.trim();
  // If the message is not empty, emit the chat-message signal
  if (message) {
    socket.emit("chat-message", message);
    console.log("Message sent:", message);
    chatInput.value = ""; // Clear the chat message input field
  }
});

// Add event listener to the join form
document.getElementById("changeRoom").addEventListener("submit", (event) => {
  event.preventDefault(); // Prevent the default form submission behavior
  // Get the room input value
  const room = roomInput.value.trim();
  // If the room is not empty, emit the join-room signal
  if (room) {
    socket.emit("leave-room"); // Leave the current room
    socket.emit("join-room", room); // Join the new room
    roomInput.value = ""; // Clear the room input field
  }
});

socket.on("update-users", function (obj) {
  console.log(`Welcome to room: ${obj.id}! ` + `Users in the room:` + obj.users);
});

socket.on("chat-message", function (message) {
  console.log(message);
});
