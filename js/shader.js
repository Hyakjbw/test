// logic Shader Aurora cho toàn bộ website
const canvas = document.getElementById('shader-canvas');
if (canvas) {
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
    resize();
    particles = [];
    for (let i = 0; i < 8; i++) particles.push(new Particle());
    animate();
}
