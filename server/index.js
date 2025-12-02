const http = require("http");
const express = require("express");
const socketIo = require("socket.io");

const PORT = process.env.port || 8080

const app = express();
const server = http.Server(app).listen(PORT);
const io = socketIo(server);

app.use(express.static(__dirname + "/../client"));

let players = {};
let unmatchedPlayerId;

io.on("connection", (socket) => {
    console.log("A player connected: " + socket.id);

    pushPlayerToQueue(socket);

    if (opponentOf(socket)) {
        socket.emit("gameBegin", {symbol: players[socket.id].symbol});
        opponentOf(socket).emit("gameBegin", {symbol: players[opponentOf(socket).id].symbol});
    }

    socket.on("makeMove", (data) => {
        if (!opponentOf(socket)) return;
        socket.emit("moveMade", data);
        opponentOf(socket).emit("moveMade", data);
    });
    socket.on("gameDraw", () => {
        if (!opponentOf(socket)) return;
        socket.emit("gameDrawed", {});
        opponentOf(socket).emit("gameDrawed", {});
    });

    socket.on("message", (msg) => {
        if (!opponentOf(socket)) return;
        socket.send("<b>You: </b>" + msg);
        opponentOf(socket).send("<b>Opponent: </b>" + msg);
    })

    socket.on("disconnect", () => {
        console.log("A player disconnected: " + socket.id);
        if (unmatchedPlayerId == socket.id) unmatchedPlayerId = null;
        delete players[socket.id];
        if (opponentOf(socket)) opponentOf(socket).emit("opponentLeft");
    });
});

function pushPlayerToQueue(socket) {
    players[socket.id] = {
        opponent: unmatchedPlayerId,
        symbol: null,
        socket: socket
    };

    if (unmatchedPlayerId) {
        players[unmatchedPlayerId].opponent = socket.id;
        players[unmatchedPlayerId].symbol = (Math.random() > 0.5) ? "X" : "O";
        players[socket.id].symbol = (players[unmatchedPlayerId].symbol == "X") ? "O" : "X";
        unmatchedPlayerId = null;
    } else {
        unmatchedPlayerId = socket.id;
    }
}
function opponentOf(socket) {
    if (!players[socket.id].opponent) return;
    return players[players[socket.id].opponent].socket;
}
