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

// --- KIỂM TRA THẮNG ---
function checkWin(x, y, player) {
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (let [dx, dy] of dirs) {
    let count = 1;
    for (let dir of [-1, 1]) {
      let i = 1;
      while (true) {
        const nx = x + dx * i * dir;
        const ny = y + dy * i * dir;
        if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize || board[nx][ny] !== player)
          break;
        count++;
        i++;
      }
    }
    if (count >= 5) return true;
  }
  return false;
}

// --- AI thông minh ---
function aiMove() {
  let move = findSmartMove();
  if (!move) move = findNearPlayer();
  if (!move) move = findAnyMove();

  if (move) {
    board[move.i][move.j] = "O";
    render();
    if (checkWin(move.i, move.j, "O")) {
      statusEl.textContent = "🤖 AI thắng! Không thể chống lại trí tuệ nhân tạo!";
      gameOver = true;
    }
  }
}

// --- TÌM NƯỚC ĐI TỐT NHẤT ---
function findSmartMove() {
  // 1. Nếu AI có thể thắng, đánh luôn
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") {
        board[i][j] = "O";
        if (checkWin(i, j, "O")) {
          board[i][j] = "";
          return { i, j };
        }
        board[i][j] = "";
      }
    }
  }

  // 2. Nếu người chơi sắp thắng, chặn lại
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") {
        board[i][j] = "X";
        if (checkWin(i, j, "X")) {
          board[i][j] = "";
          return { i, j };
        }
        board[i][j] = "";
      }
    }
  }

  // 3. Nếu không có gì nguy cấp, ưu tiên nước tạo thế mạnh (4 hoặc 3 hàng)
  let bestScore = -1;
  let bestMove = null;

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") {
        let score = evaluatePosition(i, j, "O") + evaluatePosition(i, j, "X") * 0.8;
        if (score > bestScore) {
          bestScore = score;
          bestMove = { i, j };
        }
      }
    }
  }
  return bestMove;
}

// --- HÀM ĐÁNH GIÁ VỊ TRÍ ---
function evaluatePosition(x, y, player) {
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  let total = 0;
  for (let [dx, dy] of dirs) {
    let count = 0;
    for (let dir of [-1, 1]) {
      let i = 1;
      while (true) {
        const nx = x + dx * i * dir;
        const ny = y + dy * i * dir;
        if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize || board[nx][ny] !== player)
          break;
        count++;
        i++;
      }
    }
    total += Math.pow(2, count); // càng nhiều liên kết càng mạnh
  }
  return total;
}

// --- ƯU TIÊN ĐÁNH GẦN NGƯỜI CHƠI ---
function findNearPlayer() {
  const last = getLastPlayerMove();
  if (!last) return null;
  const { x, y } = last;

  const range = 2;
  for (let r = 1; r <= range; r++) {
    for (let i = x - r; i <= x + r; i++) {
      for (let j = y - r; j <= y + r; j++) {
        if (i >= 0 && j >= 0 && i < boardSize && j < boardSize && board[i][j] === "")
          return { i, j };
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

// --- HIỂN THỊ ---
function render() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell, idx) => {
    const i = Math.floor(idx / boardSize);
    const j = idx % boardSize;
    cell.textContent = board[i][j];
    cell.className = `cell ${board[i][j].toLowerCase()}`;
  });
}

// --- NGƯỜI CHƠI CLICK ---
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
      setTimeout(aiMove, 250);
    }
  });
});

// --- CHƠI LẠI ---
resetBtn.addEventListener("click", () => {
  board = Array(boardSize).fill().map(() => Array(boardSize).fill(""));
  gameOver = false;
  statusEl.textContent = "Người chơi đi trước!";
  render();
});

render();
