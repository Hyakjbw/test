const size = 50;
let board = [];
let currentPlayer = "X";
let gameOver = false;
let offsetX = 0, offsetY = 0, scale = 1, rotation = 0;
let isDragging = false, lastX, lastY;

const boardElement = document.getElementById("board");
const statusText = document.getElementById("status");
const resetBtn = document.getElementById("reset");

for (let i = 0; i < size; i++) {
  board[i] = [];
  for (let j = 0; j < size; j++) {
    board[i][j] = "";
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.addEventListener("click", () => handleClick(i, j, cell));
    boardElement.appendChild(cell);
  }
}

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

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  if (currentPlayer === "O") aiMove();
}

function aiMove() {
  let bestScore = -Infinity;
  let move = null;

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === "") {
        board[i][j] = "O";
        let score = evaluate(i, j, "O");
        board[i][j] = "";
        if (score > bestScore) {
          bestScore = score;
          move = [i, j];
        }
      }
    }
  }

  if (move) {
    const idx = move[0] * size + move[1];
    const cell = boardElement.children[idx];
    board[move[0]][move[1]] = "O";
    cell.textContent = "O";
    cell.classList.add("o");

    if (checkWin(move[0], move[1])) {
      statusText.textContent = "🤖 AI thắng rồi!";
      gameOver = true;
    } else currentPlayer = "X";
  }
}

function evaluate(x, y, player) {
  let score = 0;
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  for (const [dx, dy] of dirs) {
    let count = 1;

    for (let k = 1; k < 5; k++) {
      const nx = x + dx * k, ny = y + dy * k;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size || board[nx][ny] !== player) break;
      count++;
    }
    for (let k = 1; k < 5; k++) {
      const nx = x - dx * k, ny = y - dy * k;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size || board[nx][ny] !== player) break;
      count++;
    }
    score = Math.max(score, count);
  }
  return score;
}

function checkWin(x, y) {
  const player = board[x][y];
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  for (const [dx, dy] of dirs) {
    let count = 1;
    for (let k = 1; k < 5; k++) {
      const nx = x + dx * k, ny = y + dy * k;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size || board[nx][ny] !== player) break;
      count++;
    }
    for (let k = 1; k < 5; k++) {
      const nx = x - dx * k, ny = y - dy * k;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size || board[nx][ny] !== player) break;
      count++;
    }
    if (count >= 5) return true;
  }
  return false;
}

resetBtn.addEventListener("click", () => location.reload());

// ----- Kéo / zoom / xoay khung -----
const container = document.getElementById("board-container");

container.addEventListener("pointerdown", (e) => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  container.style.cursor = "grabbing";
});

container.addEventListener("pointermove", (e) => {
  if (!isDragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  offsetX += dx;
  offsetY += dy;
  lastX = e.clientX;
  lastY = e.clientY;
  updateTransform();
});

container.addEventListener("pointerup", () => {
  isDragging = false;
  container.style.cursor = "grab";
});

container.addEventListener("wheel", (e) => {
  e.preventDefault();
  if (e.ctrlKey) rotation += e.deltaY * 0.02;
  else scale = Math.min(2.5, Math.max(0.5, scale - e.deltaY * 0.001));
  updateTransform();
});

function updateTransform() {
  boardElement.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale}) rotate(${rotation}deg)`;
}
