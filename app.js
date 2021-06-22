const { Room } = require("./bin/room");
const app = require("express")();
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
const rooms = [];

function createRoomCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  if (checkIfRoomExists(result)) {
    return createRoomCode();
  }

  return result;
}

function checkIfRoomExists(code) {
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].code == code) {
      return true;
    }
  }
  return false;
}

io.on("connection", (socket) => {
  socket.on("create room", (cb) => {
    const newRoomCode = createRoomCode();
    const newRoom = new Room(newRoomCode);
    rooms.push(newRoom);
    console.log("New room created ", newRoom);
    cb({
      code: newRoomCode,
    });
  });

  socket.on("join room", (code) => {
    code = code.toUpperCase();
    if (checkIfRoomExists(code)) {
      socket.join(code);
      console.log("User joined room ", code);
    } else {
      console.log("No rooms with code ", code);
    }
  });

  socket.on("disconnect", () => {});

  // use io.emit() to emit to all clients including the event emitter
  // use socket.smit() to emit to all but the event emitter
  socket.on("toggle logo", (room) => {
    io.to(room).emit("receive toggle logo");
  });
});
