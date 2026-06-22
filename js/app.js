/**
 * TreMC - Core Application Logic
 * Temporary version for interface testing
 */

// ================= SHADER SYSTEM =================
const canvas = document.getElementById('shader-canvas');
const ctx = canvas.getContext('2d');

let width, height, particles;
const colors = [
    'rgba(164, 244, 60, 0.6)', 
    'rgba(187, 247, 84, 0.5)', 
    'rgba(26, 51, 30, 0.8)', 
    'rgba(10, 31, 12, 0.7)'
];

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 300 + 200;
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < -this.radius) this.x = width + this.radius;
        if (this.x > width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = height + this.radius;
        if (this.y > height + this.radius) this.y = -this.radius;
    }
    draw() {
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initShader() {
    resize();
    particles = [];
    for (let i = 0; i < 8; i++) particles.push(new Particle());
    animate();
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
initShader();

// ================= UI INTERACTION =================

function copyIP() {
    const ipText = document.getElementById('server-ip').innerText;
    const btnText = document.getElementById('copy-btn-text');
    
    navigator.clipboard.writeText(ipText).then(() => {
        const originalText = btnText.innerText;
        btnText.innerText = "COPIED! ✓";
        btnText.style.background = "var(--primary)";
        btnText.style.color = "var(--bg-deep)";
        
        setTimeout(() => {
            btnText.innerText = originalText;
            btnText.style.background = "rgba(164, 244, 60, 0.1)";
            btnText.style.color = "var(--primary)";
        }, 2000);
    });
}

// ================= CUSTOM LOGIC (Will be replaced by your original app.js) =================
console.log("TreMC Interface Loaded Successfully!");
// Paste your original app.js logic here later.
