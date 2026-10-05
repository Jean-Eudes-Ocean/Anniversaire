import React, { useEffect, useRef } from 'react';

export default function AmbientBackground() {
  const canvasRef = useRef(null);
  const sparkleRef = useRef(null);

  useEffect(() => {
    // 1. Pétales et cœurs flottants
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 4 + 2,
      speedX: Math.random() * 0.8 - 0.4,
      speedY: Math.random() * 0.8 + 0.3,
      alpha: Math.random() * 0.5 + 0.2,
      isHeart: Math.random() > 0.65,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: Math.random() * 0.02 - 0.01
    }));

    let animId;
    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
        if (p.x > w + 20) p.x = -20;
        if (p.x < -20) p.x = w + 20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#fbcfe8';

        if (p.isHeart) {
          ctx.font = `${p.radius * 3}px sans-serif`;
          ctx.fillText('💖', 0, 0);
        } else {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.radius, p.radius * 1.8, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      animId = requestAnimationFrame(animate);
    };

    animate();

    // 2. Traînée d'étincelles magiques sous la souris
    const sparkleCanvas = sparkleRef.current;
    const sCtx = sparkleCanvas ? sparkleCanvas.getContext('2d') : null;
    let sW = sparkleCanvas ? (sparkleCanvas.width = window.innerWidth) : 0;
    let sH = sparkleCanvas ? (sparkleCanvas.height = window.innerHeight) : 0;

    const sparkles = [];
    const handleMouseMove = (e) => {
      if (Math.random() > 0.4) {
        sparkles.push({
          x: e.clientX + (Math.random() * 8 - 4),
          y: e.clientY + (Math.random() * 8 - 4),
          size: Math.random() * 5 + 3,
          alpha: 1,
          color: Math.random() > 0.5 ? '#f59e0b' : '#ec4899',
          decay: Math.random() * 0.03 + 0.02
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    let sAnimId;
    const animateSparkles = () => {
      if (!sCtx) return;
      sCtx.clearRect(0, 0, sW, sH);

      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparkles.splice(i, 1);
          continue;
        }

        sCtx.save();
        sCtx.globalAlpha = s.alpha;
        sCtx.fillStyle = s.color;
        sCtx.shadowColor = s.color;
        sCtx.shadowBlur = 6;
        sCtx.beginPath();
        sCtx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
        sCtx.fill();
        sCtx.restore();
      }

      sAnimId = requestAnimationFrame(animateSparkles);
    };

    if (sCtx) animateSparkles();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animId) cancelAnimationFrame(animId);
      if (sAnimId) cancelAnimationFrame(sAnimId);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="ambient-canvas" />
      <canvas ref={sparkleRef} className="sparkle-canvas" />
    </>
  );
}
