const { Room } = require("./bin/room");
const { User } = require("./bin/user");
const { Card } = require("./bin/card");

const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const PORT = 4001;
server.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

const ROOM_CODE_LENGTH = 5;
const ROOMS = [];
const DELETE_TIMER = 5000;

io.on("connection", (socket) => {
  console.log("Client connected");

  let timeoutId;
  // Deleting the room if no users are created in time
  socket.on("create room", (cb) => {
    const newRoomCode = createRoomCode();
    const newRoom = new Room(newRoomCode);
    ROOMS.push(newRoom);
    console.log("New room created:", newRoom.code);
    timeoutId = setTimeout(() => {
      const curRoom = getRoom(newRoom.code);
      if (curRoom) {
        if (!curRoom.roomOwner) {
          deleteRoom(newRoom.code);
          io.in(newRoomCode).emit("update room", null);
        }
      }
    }, DELETE_TIMER);
    cb({
      room: newRoom,
    });
  });

  socket.on("join room", (roomCode, cb) => {
    const curRoom = getRoom(roomCode);
    if (curRoom) {
      socket.join(roomCode);
      socket.roomCode = roomCode;
      console.log("User joined room", roomCode);
    } else {
      console.log("No rooms with code", roomCode);
    }
    io.in(roomCode).emit("update room", curRoom);
    cb({
      room: curRoom,
    });
  });

  socket.on("create user", (username, roomCode) => {
    if (timeoutId) clearTimeout(timeoutId);
    socket.username = username;
    console.log("New user:", socket.username);
    curRoom = getRoom(roomCode);
    newUser = new User(username);
    curRoom.addUserToTeam(newUser);
    io.in(roomCode).emit("update room", curRoom);
  });

  socket.on("start game", (roomCode) => {
    curRoom = getRoom(roomCode);
    curRoom.startGame();
    console.log("starting game in", curRoom.code);
    io.in(roomCode).emit("update room", curRoom);
  });

  socket.on("delete room", (roomCode) => {
    deleteRoom(roomCode);
  });

  // get new room leader, or delete room if empty
  socket.on("disconnect", () => {
    if (socket.username) {
      const curRoom = getRoom(socket.roomCode);
      if (curRoom) {
        socket.emit("leave room", socket.username, socket.roomCode);
        leaveRoom(curRoom, socket.username);
      }
    }
  });

  socket.on("page close", (roomCode, username) => {
    const curRoom = getRoom(roomCode);
    if (curRoom) {
      if (username) leaveRoom(curRoom, username);
      if (curRoom.team1.users.length + curRoom.team2.users.length === 0) {
        deleteRoom(roomCode);
      }
    }
  });

  socket.on("submit word", (word, explanation) => {
    const curRoom = getRoom(socket.roomCode);
    const newCard = new Card(word, explanation);
    curRoom.deck.push(newCard);
    io.in(socket.roomCode).emit("update room", curRoom);
  });
});

// Runs again if we already have a room with that code
function createRoomCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  if (getRoom(result)) return createRoomCode();

  return result;
}

function leaveRoom(curRoom, username) {
  if (curRoom.team1.users.length + curRoom.team2.users.length === 1) {
    deleteRoom(curRoom.code);
    console.log(curRoom.code, "was deleted");
  } else {
    curRoom.removeUser(username);
    io.to(curRoom.code).emit("update room", curRoom);
  }
}

function getRoom(roomCode) {
  for (let i = 0; i < ROOMS.length; i++) {
    if (ROOMS[i].code === roomCode) {
      return ROOMS[i];
    }
  }
}

function deleteRoom(roomCode) {
  console.log("deleting room", roomCode);
  for (let i = 0; i < ROOMS.length; i++) {
    if (ROOMS[i].code === roomCode) {
      ROOMS.splice(i, 1);
    }
  }
}
