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
  socket.broadcast.emit("user joined");
  console.log("user joined");

  socket.on("set username", (username) => {
    socket.username = username;
  });

  socket.on("disconnect", () => {
    io.emit("user disconnected");
  });
});

const getApiAndEmit = (socket) => {
  const response = new Date();
  console.log(response);
  socket.emit("FromAPI", response);
};
