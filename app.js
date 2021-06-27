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

// function checkIfRoomExists(code) {
//   for (let i = 0; i < ROOMS.length; i++) {
//     if (ROOMS[i].code == code) {
//       return true;
//     }
//   }
//   return false;
// }

function getRoom(roomCode) {
  for (i = 0; i < ROOMS.length; i++) {
    if (ROOMS[i].code == roomCode) {
      return ROOMS[i];
    }
  }
}

io.on("connection", (socket) => {
  socket.on("create room", (cb) => {
    const newRoomCode = createRoomCode();
    console.log(newRoomCode);
    const newRoom = new Room(newRoomCode);
    ROOMS.push(newRoom);
    console.log("New room created ", newRoom);
    cb({
      code: newRoomCode,
    });
  });

  socket.on("join room", (code) => {
    if (getRoom(code)) {
      socket.join(code);
      console.log("User joined room ", code);
    } else {
      console.log("No rooms with code ", code);
    }
  });

  socket.on("create user", (username, roomCode) => {
    newUser = new User(username);
    curRoom = getRoom(roomCode);

    curRoom.addUserToTeam(newUser);
  });

  socket.on("start game", (roomCode) => {
    getRoom(roomCode).startGame();
  });

  socket.on("disconnect", () => {});
});
