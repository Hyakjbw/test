const size = 20; // Giới hạn bàn cờ 20x20 gọn trong khung
let board = Array(size).fill().map(() => Array(size).fill(""));
let currentPlayer = "X";
let gameOver = false;

const boardElement = document.getElementById("board");
const statusText = document.getElementById("status");
const resetBtn = document.getElementById("reset");

// Tạo bàn cờ
for (let i = 0; i < size; i++) {
  for (let j = 0; j < size; j++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.addEventListener("click", () => handleClick(i, j, cell));
    boardElement.appendChild(cell);
  }
}

// Khi người chơi click
function handleClick(i, j, cell) {
  if (gameOver || board[i][j] !== "") return;

  board[i][j] = currentPlayer;
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer.toLowerCase());

  if (checkWin(i, j)) {
    statusText.textContent = `🎉 Người chơi (${currentPlayer}) thắng!`;
    gameOver = true;
    return;
  }

  currentPlayer = "O";
  aiMove();
}

// --- AI thông minh ---
function aiMove() {
  let bestScore = -Infinity;
  let move = null;

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === "") {
        // Chỉ đánh gần khu vực có người chơi
        if (!hasNeighbor(i, j, 2)) continue;

        board[i][j] = "O";
        let score = evaluateMove(i, j, "O") + evaluateMove(i, j, "X") * 1.2;
        board[i][j] = "";

        if (score > bestScore) {
          bestScore = score;
          move = [i, j];
        }
      }
    }
  }

  if (!move) return;

  const [x, y] = move;
  board[x][y] = "O";
  const idx = x * size + y;
  const cell = boardElement.children[idx];
  cell.textContent = "O";
  cell.classList.add("o");

  if (checkWin(x, y)) {
    statusText.textContent = "🤖 AI thắng rồi!";
    gameOver = true;
  } else currentPlayer = "X";
}

// --- Chỉ xét vị trí gần nước đã đánh ---
function hasNeighbor(x, y, dist) {
  for (let dx = -dist; dx <= dist; dx++) {
    for (let dy = -dist; dy <= dist; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < size && ny < size) {
        if (board[nx][ny] !== "") return true;
      }
    }
  }
  return false;
}

// --- Đánh giá chiến lược AI ---
function evaluateMove(x, y, player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  let score = 0;

  for (const [dx, dy] of dirs) {
    let count = 1;
    let open = 0;

    for (let k = 1; k < 5; k++) {
      const nx = x + dx * k, ny = y + dy * k;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) break;
      if (board[nx][ny] === player) count++;
      else if (board[nx][ny] === "") { open++; break; }
      else break;
    }

    for (let k = 1; k < 5; k++) {
      const nx = x - dx * k, ny = y - dy * k;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) break;
      if (board[nx][ny] === player) count++;
      else if (board[nx][ny] === "") { open++; break; }
      else break;
    }

    if (count >= 5) score += 100000;
    else if (count === 4 && open === 2) score += 10000;
    else if (count === 4 && open === 1) score += 2000;
    else if (count === 3 && open === 2) score += 1000;
    else if (count === 3 && open === 1) score += 200;
    else if (count === 2 && open === 2) score += 100;
    else score += count * 10;
  }

  return score;
}

// --- Kiểm tra thắng ---
function checkWin(x, y) {
  const player = board[x][y];
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];

  for (const [dx, dy] of dirs) {
    let count = 1;
    for (let k = 1; k < 5; k++) {
      const nx = x + dx * k, ny = y + dy * k;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) break;
      if (board[nx][ny] === player) count++;
      else break;
    }
    for (let k = 1; k < 5; k++) {
      const nx = x - dx * k, ny = y - dy * k;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) break;
      if (board[nx][ny] === player) count++;
      else break;
    }
    if (count >= 5) return true;
  }

  return false;
}

resetBtn.addEventListener("click", () => location.reload());
