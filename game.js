// Ghi chú: Sử dụng CDN của Firebase v10.x (hoàn toàn tương thích ngược với chuẩn Modular của v9)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, remove, onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// ==========================================
// 1. CẤU HÌNH FIREBASE (Điền config của bạn)
// ==========================================
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// 2. HỆ THỐNG BẢN ĐỒ (Map System)
// ==========================================
class GameMap {
    constructor(mapType) {
        this.width = 2000;
        this.height = 2000;
        this.type = mapType;
        this.obstacles = [];
        this.buildMap();
    }

    buildMap() {
        if (this.type === 'grass') {
            this.bgColor = '#4CAF50';
            // Vài chướng ngại vật nhỏ
            this.obstacles.push({x: 500, y: 500, w: 200, h: 50}, {x: 1200, y: 800, w: 50, h: 300});
        } else {
            this.bgColor = '#8B0000'; // Lava
            // Nhiều chướng ngại vật hơn
            this.obstacles.push({x: 400, y: 400, w: 300, h: 100}, {x: 1000, y: 1000, w: 200, h: 200}, {x: 800, y: 200, w: 100, h: 400});
        }
    }

    draw(ctx, camera) {
        // Nền
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(-camera.x, -camera.y, this.width, this.height);
        
        // Chướng ngại vật
        ctx.fillStyle = this.type === 'grass' ? '#5D4037' : '#000000';
        for (let obs of this.obstacles) {
            ctx.fillRect(obs.x - camera.x, obs.y - camera.y, obs.w, obs.h);
        }
    }

    checkCollision(x, y, radius) {
        // Ranh giới map
        if (x - radius < 0 || x + radius > this.width || y - radius < 0 || y + radius > this.height) return true;
        // Chướng ngại vật (AABB + Circle approximation đơn giản)
        for (let obs of this.obstacles) {
            let testX = x; let testY = y;
            if (x < obs.x) testX = obs.x; else if (x > obs.x + obs.w) testX = obs.x + obs.w;
            if (y < obs.y) testY = obs.y; else if (y > obs.y + obs.h) testY = obs.y + obs.h;
            let distX = x - testX; let distY = y - testY;
            if ((distX*distX) + (distY*distY) <= radius*radius) return true;
        }
        return false;
    }
}

// ==========================================
// 3. HỆ THỐNG VŨ KHÍ (Weapon System)
// ==========================================
class Weapon {
    constructor(player) {
        this.player = player;
        this.lastAttack = 0;
        this.lastSkill = 0;
    }
    canAttack() { return Date.now() - this.lastAttack >= this.atkSpeed; }
    canSkill() { return Date.now() - this.lastSkill >= this.skillCd; }
    getSkillCooldownPercent() {
        let elapsed = Date.now() - this.lastSkill;
        return Math.min(100, (elapsed / this.skillCd) * 100);
    }
}

class Sword extends Weapon {
    constructor(player) {
        super(player);
        this.type = 'sword'; this.damage = 25; this.atkSpeed = 400; this.skillCd = 5000;
    }
    attack(engine, angle) {
        this.lastAttack = Date.now();
        // Cận chiến: Tạo hitbox hình chữ nhật ngắn trước mặt
        let reach = 60;
        let hx = this.player.x + Math.cos(angle) * reach;
        let hy = this.player.y + Math.sin(angle) * reach;
        engine.registerMeleeHitbox(this.player.id, hx, hy, 50, this.damage);
    }
    useSkill(engine, angle) {
        this.lastSkill = Date.now();
        // Lướt (Dash)
        this.player.vx += Math.cos(angle) * 1500;
        this.player.vy += Math.sin(angle) * 1500;
    }
}

class Bow extends Weapon {
    constructor(player) {
        super(player);
        this.type = 'bow'; this.damage = 15; this.atkSpeed = 300; this.skillCd = 8000;
    }
    attack(engine, angle) {
        this.lastAttack = Date.now();
        engine.spawnProjectile(this.player.id, this.player.x, this.player.y, angle, 800, 10, this.damage, '#fff');
    }
    useSkill(engine, angle) {
        this.lastSkill = Date.now();
        // Bắn 3 tia
        engine.spawnProjectile(this.player.id, this.player.x, this.player.y, angle, 800, 10, this.damage, '#ff0');
        engine.spawnProjectile(this.player.id, this.player.x, this.player.y, angle - 0.2, 800, 10, this.damage, '#ff0');
        engine.spawnProjectile(this.player.id, this.player.x, this.player.y, angle + 0.2, 800, 10, this.damage, '#ff0');
    }
}

class Staff extends Weapon {
    constructor(player) {
        super(player);
        this.type = 'staff'; this.damage = 30; this.atkSpeed = 800; this.skillCd = 10000;
    }
    attack(engine, angle) {
        this.lastAttack = Date.now();
        engine.spawnProjectile(this.player.id, this.player.x, this.player.y, angle, 400, 20, this.damage, '#0ff'); // Quả cầu chậm, to
    }
    useSkill(engine, angle, targetX, targetY) {
        this.lastSkill = Date.now();
        // AoE tại vị trí chuột (được cộng dồn camera)
        engine.registerAoE(this.player.id, targetX, targetY, 150, 50); // Bán kính 150, dmg 50
    }
}

// ==========================================
// 4. THỰC THỂ (Player & Projectile)
// ==========================================
class Player {
    constructor(id, name, weaponType, isLocal) {
        this.id = id;
        this.name = name;
        this.isLocal = isLocal;
        this.x = Math.random() * 500 + 100; // Khởi tạo ngẫu nhiên
        this.y = Math.random() * 500 + 100;
        this.vx = 0; this.vy = 0;
        this.speed = 250;
        this.radius = 20;
        this.angle = 0;
        this.hp = 100; this.maxHp = 100;
        
        // Phục vụ nội suy (Interpolation) cho Remote Player
        this.targetX = this.x; 
        this.targetY = this.y;
        this.targetAngle = this.angle;

        if (weaponType === 'sword') this.weapon = new Sword(this);
        else if (weaponType === 'bow') this.weapon = new Bow(this);
        else this.weapon = new Staff(this);
    }

    updateLocal(dt, input, map) {
        if (this.hp <= 0) return;

        // Xử lý ma sát (Friction) cho cảm giác mượt mà
        this.vx *= 0.8; 
        this.vy *= 0.8;

        // Input di chuyển
        if (input.keys['w']) this.vy -= this.speed * dt;
        if (input.keys['s']) this.vy += this.speed * dt;
        if (input.keys['a']) this.vx -= this.speed * dt;
        if (input.keys['d']) this.vx += this.speed * dt;

        let nx = this.x + this.vx;
        let ny = this.y + this.vy;

        // Xử lý va chạm Map
        if (!map.checkCollision(nx, this.y, this.radius)) this.x = nx;
        if (!map.checkCollision(this.x, ny, this.radius)) this.y = ny;
        
        // Góc xoay theo chuột
        this.angle = Math.atan2(input.mouseY - (window.innerHeight/2), input.mouseX - (window.innerWidth/2));
    }

    updateRemote(dt) {
        // Linear Interpolation (Lerp) làm mượt chuyển động của đối thủ
        this.x += (this.targetX - this.x) * 10 * dt;
        this.y += (this.targetY - this.y) * 10 * dt;
        // Xoay mượt
        let angleDiff = this.targetAngle - this.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        this.angle += angleDiff * 10 * dt;
    }

    draw(ctx, camera) {
        if (this.hp <= 0) return;
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        
        // Vẽ tên & HP (Nhỏ)
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, 0, -35);
        ctx.fillStyle = '#f00'; ctx.fillRect(-20, -30, 40, 5);
        ctx.fillStyle = '#0f0'; ctx.fillRect(-20, -30, 40 * (this.hp/this.maxHp), 5);

        // Xoay và vẽ nhân vật
        ctx.rotate(this.angle);
        ctx.fillStyle = this.isLocal ? '#4287f5' : '#f54242';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Hướng nhìn/Vũ khí
        ctx.fillStyle = '#ddd';
        ctx.fillRect(10, -5, 20, 10);
        
        ctx.restore();
    }
}

class Projectile {
    constructor(ownerId, x, y, angle, speed, radius, damage, color) {
        this.ownerId = ownerId; this.x = x; this.y = y; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.radius = radius; this.damage = damage; this.color = color;
        this.life = 1.5; // Tồn tại 1.5s
        this.active = true;
    }
    update(dt) {
        this.x += this.vx * dt; this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) this.active = false;
    }
    draw(ctx, camera) {
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI*2); ctx.fill();
    }
}

// ==========================================
// 5. QUẢN LÝ MẠNG (Firebase NetworkManager)
// ==========================================
class NetworkManager {
    constructor(engine) {
        this.engine = engine;
        this.roomId = null;
        this.playerId = 'p_' + Math.random().toString(36).substr(2, 9); // Random ID
        this.roomRef = null;
        this.playerRef = null;
        this.lastSync = 0;
        this.syncRate = 1000 / 15; // Đồng bộ 15 lần/giây để tiết kiệm băng thông
    }

    joinRoom(roomId, name, weaponType, mapType) {
        this.roomId = roomId;
        this.roomRef = ref(db, `rooms/${roomId}`);
        this.playerRef = ref(db, `rooms/${roomId}/players/${this.playerId}`);

        // Set map info if first
        update(this.roomRef, { map: mapType });

        // Cấu hình khi ngắt kết nối
        onDisconnect(this.playerRef).remove();

        // Lắng nghe dữ liệu người chơi khác
        onValue(ref(db, `rooms/${roomId}/players`), (snapshot) => {
            const data = snapshot.val() || {};
            this.engine.syncOpponents(data);
        });

        // Lắng nghe sự kiện trừ máu của chính mình (Do người khác đánh)
        onValue(ref(db, `rooms/${roomId}/players/${this.playerId}/hp`), (snapshot) => {
            let hp = snapshot.val();
            if (hp !== null && this.engine.localPlayer) {
                this.engine.localPlayer.hp = hp;
                if (hp <= 0) this.engine.triggerGameOver();
            }
        });
    }

    sendLocalState(player) {
        let now = Date.now();
        if (now - this.lastSync > this.syncRate) {
            update(this.playerRef, {
                x: Math.round(player.x),
                y: Math.round(player.y),
                angle: parseFloat(player.angle.toFixed(2)),
                name: player.name,
                weapon: player.weapon.type
            });
            this.lastSync = now;
        }
    }

    sendDamage(targetId, newHp) {
        update(ref(db, `rooms/${this.roomId}/players/${targetId}`), { hp: newHp });
    }
}

// ==========================================
// 6. GAME ENGINE (Vòng lặp & Logic chính)
// ==========================================
class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.network = new NetworkManager(this);
        this.map = null;
        this.localPlayer = null;
        this.opponents = {};
        this.projectiles = [];
        
        this.camera = { x: 0, y: 0 };
        this.input = { keys: {}, mouseX: 0, mouseY: 0, isMouseDown: false, isRightMouseDown: false };
        
        this.lastTime = performance.now();
        this.isRunning = false;

        this.setupInputs();
    }

    setupInputs() {
        window.addEventListener('keydown', e => this.input.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', e => this.input.keys[e.key.toLowerCase()] = false);
        window.addEventListener('mousemove', e => { this.input.mouseX = e.clientX; this.input.mouseY = e.clientY; });
        window.addEventListener('mousedown', e => {
            if (e.button === 0) this.input.isMouseDown = true; // Chuột trái đánh thường
            if (e.button === 2) this.input.isRightMouseDown = true; // Chuột phải dùng Skill
        });
        window.addEventListener('mouseup', e => {
            if (e.button === 0) this.input.isMouseDown = false;
            if (e.button === 2) this.input.isRightMouseDown = false;
        });
        window.addEventListener('contextmenu', e => e.preventDefault()); // Chặn menu chuột phải
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start(name, weaponType, mapType, roomId) {
        document.getElementById('lobbyOverlay').classList.add('hidden');
        document.getElementById('hud').style.display = 'block';
        this.canvas.style.display = 'block';
        
        this.map = new GameMap(mapType);
        this.localPlayer = new Player(this.network.playerId, name, weaponType, true);
        
        this.network.joinRoom(roomId, name, weaponType, mapType);
        this.network.sendLocalState(this.localPlayer); // Gửi state khởi tạo

        this.isRunning = true;
        requestAnimationFrame((t) => this.loop(t));
    }

    syncOpponents(playersData) {
        let currentIds = Object.keys(playersData);
        // Cập nhật hoặc thêm mới đối thủ
        for (let id of currentIds) {
            if (id === this.localPlayer.id) continue;
            let pData = playersData[id];
            
            if (!this.opponents[id]) {
                this.opponents[id] = new Player(id, pData.name, pData.weapon, false);
            }
            // Cập nhật target cho Lerp
            this.opponents[id].targetX = pData.x;
            this.opponents[id].targetY = pData.y;
            this.opponents[id].targetAngle = pData.angle;
            if(pData.hp !== undefined) this.opponents[id].hp = pData.hp;
        }
        // Xóa người chơi đã thoát
        for (let id in this.opponents) {
            if (!currentIds.includes(id)) delete this.opponents[id];
        }
    }

    spawnProjectile(ownerId, x, y, angle, speed, radius, damage, color) {
        this.projectiles.push(new Projectile(ownerId, x, y, angle, speed, radius, damage, color));
    }

    registerMeleeHitbox(ownerId, x, y, radius, damage) {
        // Hitbox tức thời cho Cận chiến
        this.checkHitboxDamage(ownerId, x, y, radius, damage);
    }

    registerAoE(ownerId, x, y, radius, damage) {
        // Hiệu ứng nổ (Vẽ 1 hình tròn nhạt tàn phai nhanh) - Trong Prototype ta chỉ tính dmg tức thì
        this.checkHitboxDamage(ownerId, x, y, radius, damage);
    }

    checkHitboxDamage(ownerId, x, y, radius, damage) {
        if (ownerId !== this.localPlayer.id) return; // Chỉ tính sát thương do local đánh ra để tránh tính double
        
        for (let id in this.opponents) {
            let opp = this.opponents[id];
            if (opp.hp <= 0) continue;
            let dist = Math.hypot(opp.x - x, opp.y - y);
            if (dist < opp.radius + radius) {
                let newHp = Math.max(0, opp.hp - damage);
                this.network.sendDamage(id, newHp);
            }
        }
    }

    triggerGameOver() {
        this.isRunning = false;
        document.getElementById('gameOverOverlay').classList.remove('hidden');
    }

    updateHUD() {
        let hpPerc = Math.max(0, (this.localPlayer.hp / this.localPlayer.maxHp) * 100);
        document.getElementById('hp-bar').style.width = hpPerc + '%';
        document.getElementById('skill-cd-bar').style.width = this.localPlayer.weapon.getSkillCooldownPercent() + '%';
    }

    update(dt) {
        if (!this.localPlayer || this.localPlayer.hp <= 0) return;

        // Xử lý Input Tấn công / Kỹ năng
        if (this.input.isMouseDown && this.localPlayer.weapon.canAttack()) {
            this.localPlayer.weapon.attack(this, this.localPlayer.angle);
        }
        if (this.input.isRightMouseDown && this.localPlayer.weapon.canSkill()) {
            let worldMouseX = this.input.mouseX + this.camera.x;
            let worldMouseY = this.input.mouseY + this.camera.y;
            this.localPlayer.weapon.useSkill(this, this.localPlayer.angle, worldMouseX, worldMouseY);
        }

        this.localPlayer.updateLocal(dt, this.input, this.map);
        this.network.sendLocalState(this.localPlayer);

        for (let id in this.opponents) this.opponents[id].updateRemote(dt);

        // Update Projectiles và kiểm tra va chạm
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update(dt);
            
            // Xóa nếu dội tường
            if (this.map.checkCollision(p.x, p.y, p.radius)) p.active = false;
            
            // Va chạm với Remote Players (Client-authoritative)
            if (p.active && p.ownerId === this.localPlayer.id) {
                for (let id in this.opponents) {
                    let opp = this.opponents[id];
                    if (opp.hp > 0 && Math.hypot(opp.x - p.x, opp.y - p.y) < opp.radius + p.radius) {
                        p.active = false;
                        this.network.sendDamage(id, Math.max(0, opp.hp - p.damage));
                        break;
                    }
                }
            }
            if (!p.active) this.projectiles.splice(i, 1);
        }

        // Cập nhật Camera theo nhân vật chính (Camera follow)
        this.camera.x = this.localPlayer.x - this.canvas.width / 2;
        this.camera.y = this.localPlayer.y - this.canvas.height / 2;
        
        this.updateHUD();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.map) this.map.draw(this.ctx, this.camera);
        for (let p of this.projectiles) p.draw(this.ctx, this.camera);
        for (let id in this.opponents) this.opponents[id].draw(this.ctx, this.camera);
        if (this.localPlayer) this.localPlayer.draw(this.ctx, this.camera);
    }

    loop(timestamp) {
        if (!this.isRunning) return;
        let dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // Giới hạn dt tránh bug nhảy bước khi chuyển tab
        if (dt > 0.1) dt = 0.1; 

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}

// ==========================================
// 7. KHỞI CHẠY (Init)
// ==========================================
const engine = new GameEngine();

document.getElementById('joinBtn').addEventListener('click', () => {
    let name = document.getElementById('playerName').value || "Guest";
    let weapon = document.getElementById('weaponSelect').value;
    let map = document.getElementById('mapSelect').value;
    let roomId = document.getElementById('roomId').value || "room_test";
    
    engine.start(name, weapon, map, roomId);
});
