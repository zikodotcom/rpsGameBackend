const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
let resultsGame = {};
// Create HTTP server with Express app
const server = http.createServer(app);

// Configure CORS for Express
app.use(cors());
app.get('/', (req, res) => {
  res.send('goood')
})
// Configure Socket.IO with CORS options
const io = new Server(server, {
  cors: {
    origin: "http://192.168.1.103:5173", // Ensure no trailing slash
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log('connected');
  // Join to the room
  socket.on("join-room", (room) => {
    socket.join(room);
    socket.room = room
    socket.broadcast.emit("room-join-success", room);
  });
  //   START THE GAME
  socket.on("play", ({ player, hand, room }) => {
    if(resultsGame[room] == undefined){ 
      resultsGame[room] = [{
        player,hand
      }]
    }else{
      resultsGame[room].push({
        player,hand
      })
    }
    console.log(resultsGame[room]);
    if (resultsGame[room].length == 2) {
      if (resultsGame[room][0]["hand"] == 1 && resultsGame[room][1]["hand"] == 3) {
        resultsGame[room][0]["winner"] = 'winner';
        sendWinner(resultsGame[room], socket, room);
        resultsGame[room] = [];
      } else if (resultsGame[room][0]["hand"] == 3 && resultsGame[room][1]["hand"] == 2) {
        resultsGame[room][0]["winner"] = 'winner';
        sendWinner(resultsGame[room], socket, room);
        resultsGame[room] = [];
      } else if (resultsGame[room][0]["hand"] == 2 && resultsGame[room][1]["hand"] == 1) {
        resultsGame[room][0]["winner"] = 'winner';
        sendWinner(resultsGame[room], socket, room);
        resultsGame[room] = [];
      } else if (resultsGame[room][0]["hand"] == resultsGame[room][1]["hand"]) {
        resultsGame[room][0]["winner"] = 'draw';
        resultsGame[room][1]["winner"] = 'draw';
        sendWinner(resultsGame[room], socket, room);
        resultsGame[room] = [];
      } else {
        resultsGame[room][1]["winner"] = 'winner';
        sendWinner(resultsGame[room], socket, room);
        delete resultsGame[room]
      }
    }
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);

    // You can also use this to handle any cleanup or notify other clients in the room
    io.in(socket.room).emit('user-disconnected');
  });
});
// Send winners to the client
function sendWinner(data, socket, room) {
  io.in(room).emit("send-winner", data);
}
// Start the server on port 3000
server.listen(3000, () => {
  console.log(`Listening on port 3000`);
});
