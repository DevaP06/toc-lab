import React from 'react';

const Aurora = ({ intensity = 1, variant = 'aurora' }) => {
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(0);

  React.useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = cvs.getBoundingClientRect();
      w = rect.width; h = rect.height;
      cvs.width = w * dpr; cvs.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cvs);

    const blobs = [
      { cx: 0.25, cy: 0.35, r: 0.55, c: [0, 245, 196],   sp: 0.00018, ph: 0 },
      { cx: 0.75, cy: 0.55, r: 0.50, c: [31, 59, 115],   sp: 0.00022, ph: 1.7 },
      { cx: 0.55, cy: 0.25, r: 0.45, c: [124, 255, 178], sp: 0.00015, ph: 3.1 },
      { cx: 0.40, cy: 0.75, r: 0.40, c: [0, 186, 151],   sp: 0.00020, ph: 4.4 },
      { cx: 0.85, cy: 0.20, r: 0.35, c: [84, 208, 255],  sp: 0.00017, ph: 2.2 },
    ];

    const render = (ts) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0B0F14';
      ctx.fillRect(0, 0, w, h);

      if (variant === 'minimal') {
        const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, Math.max(w, h) * 0.6);
        g.addColorStop(0, `rgba(0,245,196,${0.22 * intensity})`);
        g.addColorStop(1, 'rgba(0,245,196,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      } else if (variant === 'mesh') {
        ctx.strokeStyle = 'rgba(31,59,115,0.24)';
        ctx.lineWidth = 1;
        const step = 48;
        for (let x = 0; x < w; x += step) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += step) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        drawBlobs(0.6, ts);
      } else {
        drawBlobs(1, ts);
      }

      const fade = ctx.createLinearGradient(0, h * 0.5, 0, h);
      fade.addColorStop(0, 'rgba(11,15,20,0)');
      fade.addColorStop(1, 'rgba(11,15,20,0.9)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(render);
    };

    function drawBlobs(mul, ts) {
      ctx.globalCompositeOperation = 'lighter';
      const t = ts || 0;
      for (const b of blobs) {
        const tt = t * b.sp + b.ph;
        const cx = (b.cx + Math.cos(tt) * 0.12) * w;
        const cy = (b.cy + Math.sin(tt * 1.3) * 0.12) * h;
        const r = b.r * Math.max(w, h) * (0.9 + Math.sin(tt * 2) * 0.08);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${b.c.join(',')},${0.28 * intensity * mul})`);
        g.addColorStop(0.5, `rgba(${b.c.join(',')},${0.08 * intensity * mul})`);
        g.addColorStop(1, `rgba(${b.c.join(',')},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    rafRef.current = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [intensity, variant]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          filter: 'blur(28px) saturate(1.2)', opacity: 0.95,
        }}
      />
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.35 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
        opacity: 0.06, mixBlendMode: 'overlay',
      }} />
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(circle at 50% 40%, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black 30%, transparent 75%)',
      }} />
    </>
  );
};

export { Aurora };
