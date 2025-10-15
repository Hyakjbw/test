const boardSize = 20;
let board = Array(boardSize).fill().map(() => Array(boardSize).fill(""));
let gameOver = false;
let lastAIMove = null; // 👈 Lưu ô AI vừa đánh

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
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
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

// --- AI THÔNG MINH KHÔNG XUNG ĐỘT ---
function aiMove() {
  let move = findSmartMove(); // đánh theo chiến thuật

  // nếu không tìm được nước thông minh, mới đánh gần người chơi
  if (!move) move = findNearPlayer();

  // nếu vẫn không có (bàn trống), đánh ngẫu nhiên
  if (!move) move = findAnyMove();

  if (move) {
  // --- Xóa sáng cũ ---
  document.querySelectorAll(".ai-highlight").forEach(c => c.classList.remove("ai-highlight"));

  // --- Đánh nước mới ---
  board[move.i][move.j] = "O";
  render();

  // --- Sáng ô AI vừa đánh ---
  const aiIndex = move.i * boardSize + move.j;
  const aiCell = document.querySelector(`.cell[data-index='${aiIndex}']`);
  if (aiCell) aiCell.classList.add("ai-highlight");

  if (checkWin(move.i, move.j, "O")) {
    statusEl.textContent = "🤖 AI thắng! Không thể chống lại trí tuệ nhân tạo!";
    gameOver = true;
    }
  }
}

// --- TÌM NƯỚC ĐI THÔNG MINH ---
function findSmartMove() {
  let bestMove = null;

  // 1️⃣: Nếu AI có thể thắng ngay => Đánh luôn
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

  // 2️⃣: Nếu người chơi sắp thắng => Chặn lại
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

  // 3️⃣: Ưu tiên nước có điểm mạnh nhất (đánh để tạo thế)
  let bestScore = -Infinity;
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === "") {
        const scoreO = evaluatePosition(i, j, "O");
        const scoreX = evaluatePosition(i, j, "X");
        const total = scoreO + scoreX * 0.9; // hơi ưu tiên chặn
        if (total > bestScore) {
          bestScore = total;
          bestMove = { i, j };
        }
      }
    }
  }

  return bestMove;
}

// --- ĐÁNH GIÁ VỊ TRÍ (AI CHIẾN LƯỢC) ---
function evaluatePosition(x, y, player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  let score = 0;

  for (let [dx, dy] of dirs) {
    let count = 0;
    let openEnds = 0;

    // hướng 1
    let i = 1;
    while (true) {
      const nx = x + dx * i;
      const ny = y + dy * i;
      if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break;
      if (board[nx][ny] === player) count++;
      else if (board[nx][ny] === "") { openEnds++; break; }
      else break;
      i++;
    }

    // hướng 2
    i = 1;
    while (true) {
      const nx = x - dx * i;
      const ny = y - dy * i;
      if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break;
      if (board[nx][ny] === player) count++;
      else if (board[nx][ny] === "") { openEnds++; break; }
      else break;
      i++;
    }

    // chấm điểm
    if (count >= 4) score += 10000;
    else if (count === 3 && openEnds === 2) score += 1000;
    else if (count === 3 && openEnds === 1) score += 200;
    else if (count === 2 && openEnds === 2) score += 100;
    else if (count === 2 && openEnds === 1) score += 30;
    else if (count === 1 && openEnds === 2) score += 10;
  }
  return score;
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
    
    // 🌟 Làm sáng ô AI vừa đánh
    if (lastAIMove && i === lastAIMove.i && j === lastAIMove.j) {
      cell.classList.add("ai-highlight");
    }
  });
}

// --- NGƯỜI CHƠI ĐÁNH ---
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

// --- NÚT CHƠI LẠI ---
resetBtn.addEventListener("click", () => {
  board = Array(boardSize).fill().map(() => Array(boardSize).fill(""));
  gameOver = false;
  lastAIMove = null; // reset highlight
  statusEl.textContent = "Người chơi đi trước!";
  render();
});

render();
