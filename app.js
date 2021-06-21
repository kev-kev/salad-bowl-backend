const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const PORT = 4001;

const roomCodes = [];

server.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

io.on("connection", (socket) => {
  socket.on("set room code", (code) => {
    roomCodes.push(code);
    console.log("New room created ", code);
  });

  socket.on("join room", (code) => {
    if (roomCodes.includes(code)) {
      console.log("Room codes: ", roomCodes);
      socket.join(code);
      console.log("User joined room ", code);
    } else {
      // room not found
      console.log("Could not find room ", code);
    }
  });
});
