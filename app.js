const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const PORT = 4001;

const rooms = [];

server.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

io.on("connection", (socket) => {
  socket.on("create room", (code) => {
    rooms.push(code);
    console.log("New room created ", code);
  });

  socket.on("join room", (code) => {
    if (roomCodes.includes(code)) {
      console.log("Room codes: ", roomCodes);
      socket.join(code);
      console.log("User joined room ", code);
    } else {
      console.log("Could not find room ", code);
    }
  });

  socket.on("disconnect", () => {});

  // use io.emit() to emit to all clients including the event emitter
  // use socket.smit() to emit to all but the event emitter
  socket.on("toggle logo", (room) => {
    io.to(room).emit("receive toggle logo");
  });
});
