const socket = io();
// Chat field, and chat button elements
const chatInput = document.getElementById("chat-message");
const sendButton = document.getElementById("chat-message-button");

// Join room field, and join button elements
const roomInput = document.getElementById("join-number");
const joinButton = document.getElementById("join-number-button");

// Room indicator element
const roomIndicator = document.getElementById("room-indicator");
const peopleIndicator = document.getElementById("people-indicator");

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
    socket.emit("join-room", room); // Join the new room
    roomInput.value = ""; // Clear the room input field
  }
});

socket.on("update-users", function (obj) {
  roomIndicator.innerText = `Welcome to room: ${obj.id}!`;
  peopleIndicator.innerText = `You are currently chatting with ${
    obj.users.length - 1
  } other people`;
});

socket.on("chat-message", function (messages) {
  // Get the ul element
  chatList = document.getElementById("chat-list");

  // Create a DocumentFragment to hold the new li elements
  const listOfLis = messages.map((message) => {
    // Create a new li element for each message
    const li = document.createElement("li");
    li.innerText = message;
    //if message starts with [System], then add the system-text class to the li element
    if (message.startsWith("[System]")) {
      li.classList.add("system-text");
    }
    return li;
  });

  //Clear the chat list
  chatList.innerHTML = "";

  // Append the new li elements to the chat list
  listOfLis.forEach((li) => {
    chatList.appendChild(li);
  });
});
