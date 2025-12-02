const url = window.location.origin;
const socket = io.connect(url);

let isTurn = true;
let symbol;

const sfxGameStart           = new Audio("/sounds/gameStart.ogg");
const sfxMoveMade            = new Audio("/sounds/moveMadeClick.wav");
const sfxChatMessageReceived = new Audio("/sounds/chatMessageBoing.wav");

const chatHistory = document.getElementById("chatHistory");
const chatInput = document.getElementById("chatInput");
const form = document.getElementById("form");

const cells = document.querySelectorAll(".board button");
const messageBox = document.getElementById("message");

cells.forEach(cell => cell.addEventListener("click", () => makeMove(cell)));

function makeMove(cell) {
    if (!isTurn || cell.textContent) return;
    socket.emit("makeMove", {
        position: cell.id, symbol
    });
}

socket.on("moveMade", data => {
    document.getElementById(data.position).innerHTML = data.symbol;
    sfxMoveMade.play();

    isTurn = data.symbol !== symbol;
    if (!gameOver()) {
        resolveTurns();
    }
    else {
        if (isTurn) {
            messageBox.innerHTML = "You lost.";
        } else {
            messageBox.innerHTML = "You won!";
        }
        cells.forEach(cell => cell.setAttribute("disabled", true));
    }
});

socket.on("gameDrawed", () => {
    messageBox.innerHTML = "Draw!";
    cells.forEach(cell => cell.setAttribute("disabled", true));
})

socket.on("gameBegin", data => {
    cells.forEach(cell => cell.innerHTML = "");
    symbol = data.symbol;
    isTurn = symbol === "X";
    resolveTurns();
    sfxGameStart.play();
});

socket.on("opponentLeft", data => {
    messageBox.innerHTML = "Your opponent left the game.";
    cells.forEach(cell => cell.setAttribute("disabled", true));
});

function resolveTurns() {
    if (Object.values(boardState()).every(cell => cell !== "")) {
        socket.emit("gameDraw", {});
    }
    if (!isTurn) {
        messageBox.innerHTML = "Your opponent's turn";
        cells.forEach(cell => cell.setAttribute("disabled", true));
    } else {
        messageBox.innerHTML = "Your turn";
        cells.forEach(cell => cell.removeAttribute("disabled"));
    }
}

function gameOver() {
    let state = boardState();
    let matches = ["OOO", "XXX"];
    let rows = [
        state.r0c0 + state.r0c1 + state.r0c2, 
        state.r1c0 + state.r1c1 + state.r1c2,
        state.r2c0 + state.r2c1 + state.r2c2,

        state.r0c0 + state.r1c0 + state.r2c0,
        state.r0c1 + state.r1c1 + state.r2c1,
        state.r0c2 + state.r1c2 + state.r2c2,
        
        state.r0c2 + state.r1c1 + state.r2c0,
        state.r0c0 + state.r1c1 + state.r2c2,
    ]

    return rows.some(line => line == matches[0] || line == matches[1]);
}

function boardState() {
    let obj = {};
    cells.forEach(cell => obj[cell.id] = cell.innerHTML);
    return obj;
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    socket.send(chatInput.value);
    chatInput.value = "";
});

socket.on("message", (msg) => {
    chatHistory.textContent = chatHistory.textContent + msg + "<br>";
    sfxChatMessageReceived.play();
});
