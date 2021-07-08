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
      console.log("User joined room", code);
    } else {
      console.log("No rooms with code", code);
    }

    cb({
      room: curRoom,
    });
  });

  socket.on("leave room", (userame, curRoom) => {
    console.log(username, "disconnected");
  });

  socket.on("create user", (username, roomCode) => {
    socket.user = username;
    curRoom = getRoom(roomCode);
    newUser = new User(username);
    curRoom.addUserToTeam(newUser);
    io.in(roomCode).emit("new user created", curRoom);
  });

  socket.on("start game", (roomCode) => {
    curRoom = getRoom(roomCode);
    curRoom.startGame();
    console.log("starting game in", curRoom.code);
    io.in(roomCode).emit("game started", curRoom);
  });

  // get new room leader, or delete room if empty
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
