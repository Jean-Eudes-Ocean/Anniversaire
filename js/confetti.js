/**
 * Système de Feux d'artifice et Confettis Spectaculaires en Canvas
 * 7 vagues d'explosions successives sur 12 secondes, 800+ particules,
 * étoiles, cœurs, cercles et étincelles avec physique réaliste.
 */

class FireworksShow {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.isRunning = false;
    this.animationId = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  random(min, max) {
    return Math.random() * (max - min) + min;
  }

  launchRocket(x, y, colorPalette) {
    const particleCount = 110;
    const colors = colorPalette || [
      '#ec4899', '#db2777', '#f43f5e', '#fbbf24', '#f59e0b',
      '#a855f7', '#c084fc', '#ffffff', '#38bdf8', '#34d399'
    ];

    for (let i = 0; i < particleCount; i++) {
      const angle = this.random(0, Math.PI * 2);
      const speed = this.random(2, 9);
      const typeChoice = Math.random();

      let shape = 'circle';
      if (typeChoice < 0.25) shape = 'star';
      else if (typeChoice < 0.5) shape = 'heart';
      else if (typeChoice < 0.75) shape = 'ribbon';

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: this.random(4, 9),
        alpha: 1,
        decay: this.random(0.006, 0.014),
        gravity: 0.12,
        friction: 0.985,
        rotation: this.random(0, 360),
        rotationSpeed: this.random(-6, 6),
        shape: shape
      });
    }
  }

  drawHeart(ctx, x, y, size) {
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2 + topCurveHeight, x, y + size);
    ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2 + topCurveHeight, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
    ctx.closePath();
    ctx.fill();
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  update() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.alpha -= p.decay;
      p.rotation += p.rotationSpeed;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);

      if (p.shape === 'star') {
        this.drawStar(this.ctx, 0, 0, 5, p.size, p.size / 2);
      } else if (p.shape === 'heart') {
        this.drawHeart(this.ctx, 0, -p.size / 2, p.size);
      } else if (p.shape === 'ribbon') {
        this.ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size * 0.8);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0 || this.isRunning) {
      this.animationId = requestAnimationFrame(() => this.update());
    } else {
      this.canvas.style.display = 'none';
    }
  }

  startGrandSpectacle() {
    this.canvas.style.display = 'block';
    this.resize();
    this.isRunning = true;
    this.particles = [];

    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.update();

    // 7 vagues réparties sur 12 secondes
    const waves = [
      { delay: 100, x: 0.5, y: 0.35 },
      { delay: 800, x: 0.25, y: 0.4 },
      { delay: 1600, x: 0.75, y: 0.35 },
      { delay: 2800, x: 0.4, y: 0.25 },
      { delay: 3500, x: 0.6, y: 0.3 },
      { delay: 5200, x: 0.2, y: 0.45 },
      { delay: 6000, x: 0.8, y: 0.4 },
      { delay: 7800, x: 0.5, y: 0.28 },
      { delay: 9200, x: 0.35, y: 0.35 },
      { delay: 10500, x: 0.65, y: 0.3 }
    ];

    waves.forEach(w => {
      setTimeout(() => {
        const posX = this.canvas.width * w.x;
        const posY = this.canvas.height * w.y;
        this.launchRocket(posX, posY);
      }, w.delay);
    });

    setTimeout(() => {
      this.isRunning = false;
    }, 12500);
  }
}

window.fireworks = new FireworksShow('fireworks-canvas');
