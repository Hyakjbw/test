const boardSize = 20;
let board = Array(boardSize).fill().map(() => Array(boardSize).fill(""));
let gameOver = false;

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("reset");

for (let i = 0; i < boardSize * boardSize; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.index = i;
  boardEl.appendChild(cell);
}

function checkWin(x, y, player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  for (let [dx, dy] of dirs) {
    let count = 1;
    for (let dir of [-1, 1]) {
      let i = 1;
      while (true) {
        const nx = x + dx * i * dir;
        const ny = y + dy * i * dir;
        if (
          nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize ||
          board[nx][ny] !== player
        ) break;
        count++;
        i++;
      }
    }
    if (count >= 5) return true;
  }
  return false;
}

// 🧠 AI đánh gần người chơi
function aiMove() {
  let move = findBestMoveNearPlayer();
  if (!move) move = findAnyMove(); // fallback nếu không tìm được gần

  if (move) {
    board[move.i][move.j] = "O";
    render();
    if (checkWin(move.i, move.j, "O")) {
      statusEl.textContent = "🤖 AI thắng!";
      gameOver = true;
    }
  }
}

// tìm gần nước đi của người chơi
function findBestMoveNearPlayer() {
  let lastMove = getLastPlayerMove();
  if (!lastMove) return null;

  const { x, y } = lastMove;
  const range = 2; // phạm vi gần người chơi

  for (let dist = 1; dist <= range; dist++) {
    for (let i = x - dist; i <= x + dist; i++) {
      for (let j = y - dist; j <= y + dist; j++) {
        if (i >= 0 && j >= 0 && i < boardSize && j < boardSize && board[i][j] === "") {
          return { i, j };
        }
      }
    }
  }
  return null;
}

function getLastPlayerMove() {
  for (let i = boardSize - 1; i >= 0; i--) {
    for (let j = boardSize - 1; j >= 0; j--) {
      if (board[i][j] === "X") return { x: i, y: j };
    }
  }
  return null;
}

function findAnyMove() {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") return { i, j };
    }
  }
  return null;
}

function render() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell, idx) => {
    const i = Math.floor(idx / boardSize);
    const j = idx % boardSize;
    cell.textContent = board[i][j];
    cell.className = `cell ${board[i][j].toLowerCase()}`;
  });
}

// Sửa lỗi click không hoạt động
document.querySelectorAll(".cell").forEach(cell => {
  cell.addEventListener("click", () => {
    if (gameOver) return;
    const idx = parseInt(cell.dataset.index);
    const x = Math.floor(idx / boardSize);
    const y = idx % boardSize;
    if (board[x][y] === "") {
      board[x][y] = "X";
      render();
      if (checkWin(x, y, "X")) {
        statusEl.textContent = "🎉 Bạn thắng!";
        gameOver = true;
        return;
      }
      setTimeout(aiMove, 300);
    }
  });
});

resetBtn.addEventListener("click", () => {
  board = Array(boardSize).fill().map(() => Array(boardSize).fill(""));
  gameOver = false;
  statusEl.textContent = "Người chơi đi trước!";
  render();
});

render();
