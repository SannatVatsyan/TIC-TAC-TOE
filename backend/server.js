const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const socketIo = require("socket.io");
const gameRoutes = require("./routes/gameRoutes");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

mongoose.connect("mongodb://localhost:27017/tictactoe", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.json());
app.use("/api/game", gameRoutes);

let games = {};

io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);

  socket.on("joinGame", ({ room }) => {
    socket.join(room);
    if (!games[room]) {
      games[room] = { board: Array(9).fill(null), turn: "X" };
    }
    socket.emit("gameState", games[room]);
  });

  socket.on("move", ({ room, index }) => {
    if (games[room].board[index] === null) {
      games[room].board[index] = games[room].turn;
      games[room].turn = games[room].turn === "X" ? "O" : "X";
      io.to(room).emit("gameState", games[room]);
    }
  });

  socket.on("disconnect", () => console.log("Player disconnected"));
});

server.listen(5001, () => console.log("Backend running on port 5001"));
