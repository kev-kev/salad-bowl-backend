const { Room } = require("./bin/room");
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

const ROOMS = [];
const ROOM_CODE_LENGTH = 5;
const MAX_USER_COUNT = 12;
const DELETE_ROOM_TIMER = 5000;
const WORD_SUBMIT_TIMER = 5000;
const TURN_TIMER = 5000;

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
      if (curRoom && !curRoom.roomOwner) {
        deleteRoom(newRoom.code);
        console.log(newRoomCode, "was deleted due to inactivity.");
        io.in(newRoomCode).emit("clear state");
      }
    }, DELETE_ROOM_TIMER);
    cb({
      roomCode: newRoomCode,
    });
  });

  socket.on("join room", (roomCode, cb) => {
    const curRoom = getRoom(roomCode);
    if (curRoom) {
      if (
        curRoom.team1.users.length + curRoom.team2.users.length ==
        MAX_USER_COUNT
      ) {
        socket.emit("error", `Room ${roomCode} is full`);
      } else {
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.emit("set phase", curRoom.phase);
        socket.emit("update team users", curRoom.team1.users, 0);
        socket.emit("update team users", curRoom.team2.users, 1);
        socket.emit("set room owner", curRoom.roomOwner);
        cb();
        console.log("Client joined room", roomCode);
      }
    } else {
      socket.emit("error", `Room ${roomCode} doesn't exist!`);
    }
  });

  socket.on("create user", (username, cb) => {
    if (timeoutId) clearTimeout(timeoutId);
    curRoom = getRoom(socket.roomCode);
    if (curRoom) {
      console.log("New user:", username);
      socket.username = username;
      const teamIndex = curRoom.addUserToTeam(username);
      if (curRoom.roomOwner === username)
        socket.emit("set room owner", username);
      if (teamIndex === 0) {
        io.in(socket.roomCode).emit(
          "update team users",
          curRoom.team1.users,
          teamIndex
        );
      } else {
        io.in(socket.roomCode).emit(
          "update team users",
          curRoom.team2.users,
          teamIndex
        );
      }
      socket.emit("set team index", teamIndex);
      cb({
        teamIndex,
      });
    } else {
      socket.emit("clear state");
      socket.emit("error", "Something went wrong!");
    }
  });

  socket.on("start game", () => {
    curRoom = getRoom(socket.roomCode);
    if (curRoom) {
      curRoom.startGame();
      io.in(socket.roomCode).emit("set phase", curRoom.phase);
      setTimeout(() => {
        curRoom.shuffleCards();
        curRoom.phase = "guessing";
        io.in(socket.roomCode).emit("update deck", curRoom.deck);
        io.in(socket.roomCode).emit("set phase", curRoom.phase);
        io.in(socket.roomCode).emit("set team score", 0, 0);
        io.in(socket.roomCode).emit("set team score", 1, 0);
        emitGuessingTeamIndex(curRoom);
        beginTurnToggling(socket, curRoom);
      }, WORD_SUBMIT_TIMER);
    } else {
      socket.emit("clear state");
      socket.emit("error", "Something went wrong!");
    }
  });

  socket.on("score word", (teamIndex, word) => {
    const curRoom = getRoom(socket.roomCode);
    curRoom.scoreWord(teamIndex, word);
    if (teamIndex === 0) {
      io.in(socket.roomCode).emit(
        "set team score",
        teamIndex,
        curRoom.team1.score
      );
    } else {
      io.in(socket.roomCode).emit(
        "set team score",
        teamIndex,
        curRoom.team2.score
      );
    }
    io.in(socket.roomCode).emit("update deck", curRoom.deck);
  });

  socket.on("submit word", (word, explanation) => {
    const curRoom = getRoom(socket.roomCode);
    if (curRoom) {
      const newCard = new Card(word, explanation);
      console.log(newCard);
      curRoom.deck.push(newCard);
      io.in(socket.roomCode).emit("update deck", curRoom.deck);
    } else {
      socket.emit("error", "Something went wrong!");
      socket.emit("clear state");
    }
  });

  socket.on("new round", () => {
    const curRoom = getRoom(socket.roomCode);
    if (curRoom) {
      // move to a fn in room?
      curRoom.deck = curRoom.discard;
      curRoom.shuffleCards();
      curRoom.discard = [];
      curRoom.phase === "guessing"
        ? (curRoom.phase = "guessing2")
        : (curRoom.phase = "guessing3");
      io.in(socket.roomCode).emit("update deck", curRoom.deck);
      io.in(socket.roomCode).emit("set phase", curRoom.phase);
      // need to have whichever team start last time start this round
      if (curRoom.team1.isGuessing) {
        curRoom.team1.isGuessing = false;
        curRoom.team2.isGuessing = true;
      } else {
        curRoom.team1.isGuessing = true;
        curRoom.team2.isGuessing = false;
      }
      beginTurnToggling(socket, curRoom);
    }
  });

  socket.on("page close", () => {
    const curRoom = getRoom(socket.roomCode);
    if (curRoom) {
      if (socket.username) leaveRoom(curRoom, socket.username);
      if (curRoom.team1.users.length + curRoom.team2.users.length === 0) {
        deleteRoom(socket.roomCode);
        console.log(socket.roomCode, "was deleted for being empty.");
      }
    }
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      const curRoom = getRoom(socket.roomCode);
      if (curRoom) leaveRoom(curRoom, socket.username);
    }
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
    console.log(curRoom.code, "was deleted for being empty.");
  } else {
    curRoom.removeUser(username);
    io.to(curRoom.code).emit("update team", curRoom.team1.users, 0);
    io.to(curRoom.code).emit("update team", curRoom.team2.users, 1);
  }
}

function getRoom(roomCode) {
  for (let i = 0; i < ROOMS.length; i++) {
    if (ROOMS[i].code === roomCode) return ROOMS[i];
  }
}

function deleteRoom(roomCode) {
  for (let i = 0; i < ROOMS.length; i++) {
    if (ROOMS[i].code === roomCode) ROOMS.splice(i, 1);
  }
}

function emitGuessingTeamIndex(room) {
  if (room.team1.isGuessing) {
    io.in(room.code).emit("set guessing team index", 0);
    console.log("Team 1's turn");
  } else {
    io.in(room.code).emit("set guessing team index", 1);
    console.log("Team 2's turn");
  }
}

function beginTurnToggling(socket, curRoom) {
  let turnInterval = setInterval(() => {
    if (curRoom.deck.length === 0) return clearInterval(turnInterval);
    curRoom.endTurn();
    emitGuessingTeamIndex(curRoom);
    io.in(socket.roomCode).emit("set clue giver", curRoom.clueGiver);
    console.log("new turn");
  }, TURN_TIMER);
}
