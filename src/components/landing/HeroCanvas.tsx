'use client';
import { useEffect, useRef } from 'react';

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let t = 0;
    let mouseX = 0.5;
    let mouseY = 0.5;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function onMouse(e: MouseEvent) {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
    }
    window.addEventListener('mousemove', onMouse);

    // Sri Lankan theme: warm gold/purple topology
    function drawTopoLines() {
      if (!canvas || !ctx) return;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Deep dark background
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.8);
      bg.addColorStop(0, '#0D0A1A');
      bg.addColorStop(0.5, '#07050F');
      bg.addColorStop(1, '#020208');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Topographic contour lines — Sri Lankan island silhouette feel
      const cx = W * (0.4 + mouseX * 0.2);
      const cy = H * (0.4 + mouseY * 0.2);
      const numContours = 28;

      for (let i = numContours; i >= 0; i--) {
        const progress = i / numContours;
        const wave = Math.sin(t * 0.4 + i * 0.3) * 18;
        const wave2 = Math.cos(t * 0.25 + i * 0.5) * 12;
        const rx = (W * 0.55 - i * 18 + wave) * (0.85 + progress * 0.3);
        const ry = (H * 0.42 - i * 12 + wave2) * (0.85 + progress * 0.3);

        // Color gradient: deep purple → warm gold → amber
        const r = Math.round(60 + progress * 195);
        const g = Math.round(20 + progress * 110);
        const b = Math.round(120 - progress * 80);
        const alpha = 0.06 + progress * 0.18;

        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(rx, 10), Math.max(ry, 10), -0.35 + Math.sin(t * 0.1) * 0.05, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = progress > 0.7 ? 1.5 : 0.8;
        ctx.stroke();

        // Inner glow on top contours
        if (i < 5) {
          ctx.strokeStyle = `rgba(255,${150 + i * 20},${50 + i * 10},${0.35 - i * 0.05})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // Agent node constellation overlay
      const agentNodes = [
        { lx: 0.18, ly: 0.28, emoji: '🎯', color: '#A78BFA', label: 'Concierge' },
        { lx: 0.5,  ly: 0.15, emoji: '🌟', color: '#FCD34D', label: 'Life Events' },
        { lx: 0.82, ly: 0.3,  emoji: '🛒', color: '#34D399', label: 'Shopping' },
        { lx: 0.14, ly: 0.68, emoji: '🎉', color: '#F87171', label: 'Festival' },
        { lx: 0.5,  ly: 0.82, emoji: '💰', color: '#A78BFA', label: 'Budget' },
        { lx: 0.86, ly: 0.68, emoji: '🚚', color: '#22D3EE', label: 'Delivery' },
        { lx: 0.5,  ly: 0.5,  emoji: '💾', color: '#FB923C', label: 'Memory' },
      ];

      // Draw connections
      for (let i = 0; i < agentNodes.length; i++) {
        for (let j = i + 1; j < agentNodes.length; j++) {
          const a = agentNodes[i], b = agentNodes[j];
          const ax = a.lx * W + Math.sin(t * 0.5 + i) * 8;
          const ay = a.ly * H + Math.cos(t * 0.4 + i) * 6;
          const bx = b.lx * W + Math.sin(t * 0.5 + j) * 8;
          const by = b.ly * H + Math.cos(t * 0.4 + j) * 6;
          const dist = Math.hypot(ax - bx, ay - by);
          if (dist < W * 0.35) {
            const alpha = (1 - dist / (W * 0.35)) * 0.12;
            const grad = ctx.createLinearGradient(ax, ay, bx, by);
            grad.addColorStop(0, a.color + '20');
            grad.addColorStop(1, b.color + '20');
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw agent nodes
      for (let i = 0; i < agentNodes.length; i++) {
        const n = agentNodes[i];
        const x = n.lx * W + Math.sin(t * 0.5 + i * 1.1) * 8;
        const y = n.ly * H + Math.cos(t * 0.4 + i * 0.9) * 6;
        const pulse = 0.7 + 0.3 * Math.sin(t * 1.5 + i * 0.8);

        // Outer glow
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 36 * pulse);
        grd.addColorStop(0, n.color + '25');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, 36 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Circle
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fillStyle = n.color + '15';
        ctx.strokeStyle = n.color + '50';
        ctx.lineWidth = 1.2;
        ctx.fill();
        ctx.stroke();

        // Emoji
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(n.emoji, x, y);

        // Label (subtle)
        ctx.font = '500 9px Inter, sans-serif';
        ctx.fillStyle = n.color + '80';
        ctx.fillText(n.label, x, y + 26);
      }

      // Subtle Sri Lanka island silhouette dots
      const dots = 60;
      for (let i = 0; i < dots; i++) {
        const angle = (i / dots) * Math.PI * 2;
        const r = W * 0.28 + Math.sin(angle * 3 + t * 0.2) * W * 0.06;
        const dx = cx + Math.cos(angle) * r;
        const dy = cy + Math.sin(angle) * r * 0.7;
        const alpha = 0.06 + 0.04 * Math.sin(t + i * 0.3);
        ctx.beginPath();
        ctx.arc(dx, dy, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,160,255,${alpha})`;
        ctx.fill();
      }

      t += 0.012;
      animFrame = requestAnimationFrame(drawTopoLines);
    }

    drawTopoLines();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
}
