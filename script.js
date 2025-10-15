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
  const dirs = [
    [1, 0], [0, 1], [1, 1], [1, -1]
  ];
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

function aiMove() {
  let bestScore = -Infinity;
  let move = null;

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") {
        board[i][j] = "O";
        let score = minimax(board, 0, false, -Infinity, Infinity);
        board[i][j] = "";
        if (score > bestScore) {
          bestScore = score;
          move = { i, j };
        }
      }
    }
  }
  if (move) {
    board[move.i][move.j] = "O";
    render();
    if (checkWin(move.i, move.j, "O")) {
      statusEl.textContent = "🤖 AI thắng!";
      gameOver = true;
    }
  }
}

function minimax(board, depth, isMax, alpha, beta) {
  if (depth > 2) return 0;
  if (gameOver) return 0;
  let best = isMax ? -Infinity : Infinity;

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") {
        board[i][j] = isMax ? "O" : "X";
        const won = checkWin(i, j, isMax ? "O" : "X");
        let score = 0;
        if (won) score = isMax ? 100 - depth : -100 + depth;
        else score = minimax(board, depth + 1, !isMax, alpha, beta);
        board[i][j] = "";
        if (isMax) {
          best = Math.max(best, score);
          alpha = Math.max(alpha, score);
        } else {
          best = Math.min(best, score);
          beta = Math.min(beta, score);
        }
        if (beta <= alpha) break;
      }
    }
  }
  return best;
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
      aiMove();
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
