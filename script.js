// ---------- Config ----------
const WIN = 5;
let SIZE = 15; // default (can change with UI)
let board = [];
let current = 'X';
let gameOver = false;
let user = null;

// UI refs
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const sizeSelect = document.getElementById('sizeSelect');
const difficultySel = document.getElementById('difficulty');
const newGameBtn = document.getElementById('newGame');
const resetBtn = document.getElementById('resetBtn');
const loginModal = document.getElementById('loginModal');
const btnOpenLogin = document.getElementById('btnOpenLogin');
const btnClose = document.getElementById('btnClose') || document.getElementById('btnClose');
const inpUser = document.getElementById('inpUser');
const inpPass = document.getElementById('inpPass');
const btnRegister = document.getElementById('btnRegister');
const btnLogin = document.getElementById('btnLogin');
const loginMsg = document.getElementById('loginMsg');
const userLabel = document.getElementById('userLabel');
const btnLogout = document.getElementById('btnLogout');

// ---------- Simple client-side auth (localStorage, SHA-256) ----------
async function hash(text){
  const enc = new TextEncoder();
  const data = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(data)).map(b => b.toString(16).padStart(2,'0')).join('');
}
function loadUsers(){ return JSON.parse(localStorage.getItem('CARO_USERS')||'{}'); }
function saveUsers(u){ localStorage.setItem('CARO_USERS', JSON.stringify(u)); }

btnOpenLogin.addEventListener('click', ()=>{ loginModal.classList.remove('hidden'); loginMsg.textContent='';});
document.getElementById('btnClose').addEventListener('click', ()=> loginModal.classList.add('hidden'));

btnRegister.addEventListener('click', async ()=>{
  const name = inpUser.value.trim();
  const pass = inpPass.value;
  if(!name||!pass){ loginMsg.textContent='Nhập tên và mật khẩu'; return; }
  const users = loadUsers();
  if(users[name]){ loginMsg.textContent='Tài khoản đã tồn tại'; return; }
  users[name] = await hash(pass);
  saveUsers(users);
  loginMsg.textContent='Đăng ký thành công — đăng nhập ngay.';
});

btnLogin.addEventListener('click', async ()=>{
  const name = inpUser.value.trim();
  const pass = inpPass.value;
  if(!name||!pass){ loginMsg.textContent='Nhập tên và mật khẩu'; return; }
  const users = loadUsers();
  if(!users[name]){ loginMsg.textContent='Tài khoản không tồn tại'; return; }
  const h = await hash(pass);
  if(h !== users[name]){ loginMsg.textContent='Sai mật khẩu'; return; }
  user = name;
  userLabel.textContent = `Xin chào, ${user}`;
  btnOpenLogin.style.display='none';
  btnLogout.style.display='inline-block';
  loginModal.classList.add('hidden');
});

btnLogout.addEventListener('click', ()=>{
  user = null;
  userLabel.textContent='';
  btnOpenLogin.style.display='';
  btnLogout.style.display='none';
});

// ---------- Game initialization ----------
function initBoard(s){
  SIZE = s;
  board = Array.from({length:SIZE}, ()=>Array(SIZE).fill(''));
  current = 'X';
  gameOver = false;
  renderGrid();
  setStatus('Lượt của bạn (X)');
}

// render grid with square cells
function renderGrid(){
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${SIZE}, 1fr)`;
  for(let i=0;i<SIZE;i++){
    for(let j=0;j<SIZE;j++){
      const cell = document.createElement('div');
      cell.className='cell';
      cell.dataset.r = i; cell.dataset.c = j;
      cell.addEventListener('click', onCellClick);
      boardEl.appendChild(cell);
    }
  }
  syncVisual();
}

function syncVisual(){
  const cells = boardEl.children;
  for(let i=0;i<SIZE;i++){
    for(let j=0;j<SIZE;j++){
      const idx = i*SIZE+j;
      const c = cells[idx];
      c.textContent = board[i][j] || '';
      c.classList.toggle('x', board[i][j]==='X');
      c.classList.toggle('o', board[i][j]==='O');
    }
  }
}

function setStatus(t){ statusEl.textContent = 'Trạng thái: '+t; }

// ---------- click handler ----------
function onCellClick(e){
  if(gameOver) return;
  const r = +this.dataset.r, c = +this.dataset.c;
  if(board[r][c]) return;
  board[r][c] = 'X';
  syncVisual();
  if(checkWinAt(r,c,'X')){ gameOver=true; setStatus('Bạn thắng 🎉'); return; }
  setStatus('Máy đang suy nghĩ...');
  // AI move in next tick
  setTimeout(()=> aiMove(), 80);
}

// ---------- AI logic (strong) ----------
// Steps per AI turn:
// 1) if AI can win now -> do it
// 2) if player can win next -> block
// 3) threat search / double attack
// 4) heuristic + minimax limited depth on candidate moves (neighbor radius)
// Candidate generation: cells with neighbor within radius r (r depends on difficulty)

function aiMove(){
  if(gameOver) return;
  const diff = +difficultySel.value || 3;
  const radii = {1:2, 2:3, 3:4, 4:6};
  const depthMap = {1:1,2:2,3:3,4:4};
  const radius = radii[diff] || 4;
  const depth = depthMap[diff] || 3;

  // 1) immediate win?
  let cand = getCandidates(radius);
  for(const [r,c] of cand){
    board[r][c] = 'O';
    if(checkWinAt(r,c,'O')){ syncVisual(); setStatus('AI thắng 🤖'); gameOver=true; return; }
    board[r][c] = '';
  }
  // 2) immediate block?
  for(const [r,c] of cand){
    board[r][c] = 'X';
    if(checkWinAt(r,c,'X')){ board[r][c]='O'; syncVisual(); if(checkWinAt(r,c,'O')){ setStatus('AI thắng 🤖'); gameOver=true; } else setStatus('Lượt của bạn'); return; }
    board[r][c] = '';
  }

  // 3) try to create double threats (simple)
  const double = findDoubleThreat(cand);
  if(double){ const [rr,cc] = double; board[rr][cc]='O'; syncVisual(); if(checkWinAt(rr,cc,'O')){ setStatus('AI thắng 🤖'); gameOver=true; } else setStatus('Lượt của bạn'); return; }

  // 4) minimax with alpha-beta on limited candidates
  let best = null, bestScore = -Infinity;
  const candidates = cand.slice(0,200); // safety cap
  for(const [r,c] of candidates){
    board[r][c] = 'O';
    const score = -negamax(depth-1, -Infinity, Infinity, 'X');
    board[r][c] = '';
    if(score > bestScore){ bestScore=score; best=[r,c]; }
  }
  if(!best){ // fallback center
    best = [Math.floor(SIZE/2), Math.floor(SIZE/2)];
  }
  board[best[0]][best[1]]='O';
  syncVisual();
  if(checkWinAt(best[0],best[1],'O')){ setStatus('AI thắng 🤖'); gameOver=true; } else setStatus('Lượt của bạn');
}

// Candidate cells: near existing stones
function getCandidates(radius=3){
  const s = new Set();
  for(let i=0;i<SIZE;i++){
    for(let j=0;j<SIZE;j++){
      if(board[i][j]){
        for(let dx=-radius;dx<=radius;dx++){
          for(let dy=-radius;dy<=radius;dy++){
            const nx=i+dx, ny=j+dy;
            if(nx>=0 && ny>=0 && nx<SIZE && ny<SIZE && !board[nx][ny]){
              s.add(nx+','+ny);
            }
          }
        }
      }
    }
  }
  // if board empty, return center
  if(s.size===0) { return [[Math.floor(SIZE/2),Math.floor(SIZE/2)]]; }
  // convert to array and sort by proximity to center (heuristic)
  const arr = [...s].map(t=>t.split(',').map(Number));
  arr.sort((a,b)=>{
    const da = Math.hypot(a[0]-SIZE/2,a[1]-SIZE/2);
    const db = Math.hypot(b[0]-SIZE/2,b[1]-SIZE/2);
    return da-db;
  });
  return arr;
}

// check win at position r,c for player
function checkWinAt(r,c,player){
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  for(const [dx,dy] of dirs){
    let cnt = 1;
    for(let k=1;k<WIN;k++){
      const nx=r+dx*k, ny=c+dy*k;
      if(nx<0||ny<0||nx>=SIZE||ny>=SIZE) break;
      if(board[nx][ny]===player) cnt++; else break;
    }
    for(let k=1;k<WIN;k++){
      const nx=r-dx*k, ny=c-dy*k;
      if(nx<0||ny<0||nx>=SIZE||ny>=SIZE) break;
      if(board[nx][ny]===player) cnt++; else break;
    }
    if(cnt>=WIN) return true;
  }
  return false;
}

// find simple double threats (place that creates >=2 ways to make 4 open)
function findDoubleThreat(cand){
  for(const [r,c] of cand){
    board[r][c]='O';
    let ways=0;
    const cand2 = getCandidates(2);
    for(const [r2,c2] of cand2){
      board[r2][c2]='O';
      if(checkWinAt(r2,c2,'O')) ways++;
      board[r2][c2]='';
      if(ways>=2) break;
    }
    board[r][c]='';
    if(ways>=2) return [r,c];
  }
  return null;
}

// Negamax with simple eval
function negamax(depth, alpha, beta, who){
  if(depth===0) return evaluateBoard('O') - evaluateBoard('X')*0.9;
  const cand = getCandidates(4);
  if(cand.length===0) return 0;
  let value = -Infinity;
  for(const [r,c] of cand.slice(0,120)){
    board[r][c] = who;
    if(checkWinAt(r,c,who)){
      board[r][c] = '';
      return 1000000; // immediate win
    }
    const score = -negamax(depth-1, -beta, -alpha, who==='O' ? 'X' : 'O');
    board[r][c] = '';
    if(score > value) value = score;
    if(value > alpha) alpha = value;
    if(alpha >= beta) break;
  }
  return value;
}

// heuristic eval: count patterns
function evaluateBoard(player){
  let score = 0;
  const lines = getAllLines();
  for(const s of lines){
    score += evaluateLine(s.join(''), player);
  }
  return score;
}

function evaluateLine(line, player){
  const opp = player==='O' ? 'X' : 'O';
  let sc = 0;
  // patterns (prioritized)
  const patterns = [
    {pat: new RegExp(player.repeat(5)), val:100000},
    {pat: new RegExp(`[^${opp}]${player}{4}[^${opp}]`), val:50000}, // open four
    {pat: new RegExp(`[^${opp}]${player}{3}[^${opp}]`), val:4000},
    {pat: new RegExp(`[^${opp}]${player}{2}[^${opp}]`), val:200},
    {pat: new RegExp(player), val:10},
  ];
  for(const p of patterns){
    if(p.pat.test(line)) sc += p.val;
  }
  // subtract opponent threats
  return sc;
}

function getAllLines(){
  const res = [];
  // rows
  for(let i=0;i<SIZE;i++) res.push(board[i].map(x=>x||'.'));
  // cols
  for(let j=0;j<SIZE;j++){
    const col=[];
    for(let i=0;i<SIZE;i++) col.push(board[i][j]||'.');
    res.push(col);
  }
  // diagonals
  for(let k=0;k<2;k++){
    for(let i=0;i<SIZE;i++){
      let diag=[];
      for(let j=0;j<SIZE;j++){
        const x = k===0 ? i+j : (i+j);
        const y = k===0 ? j : (SIZE-1-j);
        const rx = k===0 ? x - j : x - j;
        // instead build main diagonals:
      }
    }
  }
  // simpler: build all diagonals programmatically:
  // TL-BR
  for(let s=0;s<2*SIZE;s++){
    const diag=[];
    for(let i=0;i<SIZE;i++){
      const j = s - i;
      if(j>=0 && j<SIZE) diag.push(board[i][j]||'.');
    }
    if(diag.length) res.push(diag);
  }
  // TR-BL
  for(let s=-SIZE;s<SIZE;s++){
    const diag=[];
    for(let i=0;i<SIZE;i++){
      const j = i - s;
      if(j>=0 && j<SIZE) diag.push(board[i][j]||'.');
    }
    if(diag.length) res.push(diag);
  }
  return res.map(a=>a.map(x=>x).join(''));
}

// ---------- utility: check whole-board for win (not used often) ----------
function checkWhole(){
  for(let i=0;i<SIZE;i++) for(let j=0;j<SIZE;j++) if(board[i][j]) if(checkWinAt(i,j,board[i][j])) return board[i][j];
  return null;
}

// ---------- UI events ----------
newGameBtn.addEventListener('click', ()=> {
  const s = parseInt(sizeSelect.value,10);
  const d = parseInt(difficultySel.value,10);
  initBoardState(s,d);
});

resetBtn.addEventListener('click', ()=> initBoardState(SIZE, +difficultySel.value));

function initBoardState(s,d){
  SIZE = s;
  board = Array.from({length:SIZE}, ()=>Array(SIZE).fill(''));
  current='X'; gameOver=false;
  // rebuild grid
  renderGrid();
  setStatus('Lượt của bạn (X)');
}

function setStatus(t){ statusEl.textContent = 'Trạng thái: '+t; }

// init
initBoardState(SIZE, +difficultySel.value);
