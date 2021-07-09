const { Room } = require("./bin/room");
const { User } = require("./bin/user");

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

// Runs again if we already have a room with that code
function createRoomCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  if (getRoom(result)) {
    return createRoomCode();
  }
  return result;
}

function getRoom(roomCode) {
  for (let i = 0; i < ROOMS.length; i++) {
    if (ROOMS[i].code === roomCode) {
      return ROOMS[i];
    }
  }
}

function leaveRoom(username, roomCode) {
  const curRoom = getRoom(roomCode);
  console.log(curRoom);
  curRoom.removeUser(username);
  io.in(roomCode).emit("update room", curRoom);
}

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("create room", (cb) => {
    const newRoomCode = createRoomCode();
    const newRoom = new Room(newRoomCode);
    ROOMS.push(newRoom);
    console.log("New room created:", newRoom.code);
    cb({
      room: newRoom,
    });
  });

  socket.on("join room", (code, cb) => {
    const curRoom = getRoom(code);
    if (curRoom) {
      socket.join(code);
      socket.roomCode = code;
      console.log("User joined room", code);
    } else {
      console.log("No rooms with code", code);
    }
    cb({
      room: curRoom,
    });
  });

  socket.on("create user", (username, roomCode) => {
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

  // get new room leader, or delete room if empty
  socket.on("disconnect", () => {
    if (socket.username) {
      socket.emit("leave room", socket.username, socket.roomCode);
      leaveRoom(socket.username, socket.roomCode);
    }
  });
});
