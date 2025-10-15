const size = 50;
const winLen = 5;
let board = Array.from({ length: size }, () => Array(size).fill(''));
let gameOver = false;

const boardDiv = document.getElementById("board");
const statusDiv = document.getElementById("status");

// 🎯 Vẽ bàn
function renderBoard() {
  boardDiv.innerHTML = "";
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.textContent = board[i][j];
      if (board[i][j] === "X") cell.classList.add("x");
      if (board[i][j] === "O") cell.classList.add("o");
      cell.onclick = () => playerMove(i, j);
      boardDiv.appendChild(cell);
    }
  }
}
renderBoard();

// 🧍 Người chơi
function playerMove(i, j) {
  if (gameOver || board[i][j] !== "") return;
  board[i][j] = "X";
  renderBoard();
  if (checkWin("X")) {
    statusDiv.textContent = "🎉 Bạn thắng rồi! AI bị hạ gục 😅";
    gameOver = true;
    return;
  }
  statusDiv.textContent = "AI đang suy nghĩ...";
  setTimeout(aiMove, 300);
}

// 🤖 AI nâng cấp thông minh
function aiMove() {
  if (gameOver) return;
  const [x, y] = findBestMove();
  board[x][y] = "O";
  renderBoard();
  if (checkWin("O")) {
    statusDiv.textContent = "🤖 AI thắng! Trí tuệ nhân tạo tối thượng!";
    gameOver = true;
    return;
  }
  statusDiv.textContent = "Lượt của bạn (X)";
}

// 🧠 AI logic
function findBestMove() {
  let bestScore = -Infinity;
  let move = null;

  const activeCells = getActiveCells(3);
  // Kiểm tra nếu có nước thắng hoặc chặn thắng
  for (let [i, j] of activeCells) {
    if (board[i][j] !== "") continue;
    board[i][j] = "O";
    if (checkWin("O")) {
      board[i][j] = "";
      return [i, j];
    }
    board[i][j] = "";
  }

  for (let [i, j] of activeCells) {
    if (board[i][j] !== "") continue;
    board[i][j] = "X";
    if (checkWin("X")) {
      board[i][j] = "";
      return [i, j]; // Chặn thắng ngay
    }
    board[i][j] = "";
  }

  // Nếu không có nước thắng ngay → đánh chiến thuật
  for (let [i, j] of activeCells) {
    if (board[i][j] === "") {
      board[i][j] = "O";
      const score = evaluate(i, j, "O") + Math.random() * 5;
      board[i][j] = "";
      if (score > bestScore) {
        bestScore = score;
        move = [i, j];
      }
    }
  }

  return move || [Math.floor(size / 2), Math.floor(size / 2)];
}

// 🔍 Chỉ xem vùng quanh các nước đã đánh
function getActiveCells(radius) {
  const cells = new Set();
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] !== "") {
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            let nx = i + dx,
              ny = j + dy;
            if (nx >= 0 && ny >= 0 && nx < size && ny < size) {
              cells.add(nx + "," + ny);
            }
          }
        }
      }
    }
  }
  return [...cells].map((s) => s.split(",").map(Number));
}

// ⚖️ Đánh giá vị trí
function evaluate(x, y, player) {
  let total = 0;
  const opponent = player === "O" ? "X" : "O";
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];
  for (let [dx, dy] of dirs) total += scoreLine(x, y, dx, dy, player, opponent);
  return total;
}

// 🔢 Tính điểm tấn công / phòng thủ
function scoreLine(x, y, dx, dy, me, enemy) {
  let countMe = 0,
    countEnemy = 0,
    openEnds = 0;

  for (let dir = -1; dir <= 1; dir += 2) {
    let step = 1;
    while (true) {
      let nx = x + dx * step * dir,
        ny = y + dy * step * dir;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) break;
      if (board[nx][ny] === me) countMe++;
      else if (board[nx][ny] === "") {
        openEnds++;
        break;
      } else break;
      step++;
    }
  }

  let myScore = [0, 10, 80, 800, 8000, 99999][countMe] || 0;
  if (openEnds === 2) myScore *= 2;

  // Phòng thủ
  for (let dir = -1; dir <= 1; dir += 2) {
    let step = 1;
    while (true) {
      let nx = x + dx * step * dir,
        ny = y + dy * step * dir;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) break;
      if (board[nx][ny] === enemy) countEnemy++;
      else if (board[nx][ny] === "") break;
      else break;
      step++;
    }
  }
  let defScore = [0, 10, 100, 900, 9000, 100000][countEnemy] || 0;
  return myScore + defScore;
}

// 🏆 Kiểm tra thắng
function checkWin(p) {
  const win = p.repeat(winLen);
  for (let i = 0; i < size; i++) {
    if (board[i].join("").includes(win)) return true;
    if (board.map((r) => r[i]).join("").includes(win)) return true;
  }
  for (let x = 0; x <= size - winLen; x++) {
    for (let y = 0; y <= size - winLen; y++) {
      let d1 = "",
        d2 = "";
      for (let k = 0; k < winLen; k++) {
        d1 += board[x + k][y + k];
        d2 += board[x + k][y + winLen - 1 - k];
      }
      if (d1 === win || d2 === win) return true;
    }
  }
  return false;
}

function resetGame() {
  board = Array.from({ length: size }, () => Array(size).fill(""));
  gameOver = false;
  statusDiv.textContent = "Bạn đi trước (X)";
  renderBoard();
}
