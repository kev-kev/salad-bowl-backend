const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const port = 4001;

server.listen(port, () => console.log(`Listening on port ${port}`));

io.on("connection", (socket) => {
  console.log("user joined");

  socket.on("set room code", (code) => {
    if (!socket.roomCodes) {
      socket.roomCodes = [];
    }
    socket.roomCodes.push(code);
    console.log("New room created ", code);
  });

  socket.on("join room", (code) => {
    if (socket.roomCodes.includes(code)) {
      socket.join(code);
      console.log("User joined room ", code);
    } else {
      // room not found
      console.log(socket.roomCodes);
      console.log("Could not find room ", code);
    }
  });
});
