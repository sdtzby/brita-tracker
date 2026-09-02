export class WaterGauge {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.targetPercent = 100;
    this.currentPercent = 100;
    this.animationFrame = null;
    this.pulsePhase = 0;
    
    this.setupCanvas();
    this.startLoop();
    window.addEventListener('resize', () => this.setupCanvas());
  }

  setupCanvas() {
    const dpr = window.devicePixelRatio || 2;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 280;
    const height = rect.height || 230;
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = width;
    this.height = height;
  }

  setPercent(percent) {
    this.targetPercent = Math.max(0, Math.min(100, percent));
  }

  startLoop() {
    const render = () => {
      // Smooth asymptotic dampening
      this.currentPercent += (this.targetPercent - this.currentPercent) * 0.08;
      this.pulsePhase += 0.035;
      
      this.draw();
      this.animationFrame = requestAnimationFrame(render);
    };
    render();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h * 0.58;
    const radius = Math.min(w * 0.38, 105);

    // 270° Open Horseshoe Arc:
    // Starts at 135° (bottom-left) and ends at 45° (bottom-right)
    const startAngle = Math.PI * 0.75; // 135 deg
    const endAngle = Math.PI * 2.25;   // 405 deg (45 deg)
    const totalSpan = Math.PI * 1.5;   // 270 deg

    // 1. Ambient Center Hydro Glow
    const glowGrad = ctx.createRadialGradient(cx, cy - 10, 10, cx, cy - 10, radius * 1.1);
    if (this.currentPercent < 15) {
      glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.12)');
      glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    } else if (this.currentPercent < 35) {
      glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
      glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    } else {
      glowGrad.addColorStop(0, 'rgba(0, 153, 229, 0.14)');
      glowGrad.addColorStop(0.7, 'rgba(0, 119, 182, 0.04)');
      glowGrad.addColorStop(1, 'rgba(0, 153, 229, 0)');
    }
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - 10, radius * 1.1, 0, Math.PI * 2);
    ctx.fill();

    // 2. Precision Outer Graduation Ticks (Swiss Instrument Dial)
    const tickCount = 37;
    for (let i = 0; i < tickCount; i++) {
      const angle = startAngle + (i / (tickCount - 1)) * totalSpan;
      const isMajor = i % 6 === 0;
      const tickLength = isMajor ? 7 : 3.5;
      const rInner = radius + 15;
      const rOuter = rInner + tickLength;

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(cx + cos * rInner, cy + sin * rInner);
      ctx.lineTo(cx + cos * rOuter, cy + sin * rOuter);
      ctx.lineWidth = isMajor ? 1.5 : 1;
      ctx.strokeStyle = isMajor ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.08)';
      ctx.stroke();
    }

    // 3. Base Arc Track (Matte Slate)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
    ctx.stroke();

    // 4. Subtle Inner Guide Line
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 10, startAngle, endAngle);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.stroke();

    // 5. Active Progress Arc
    const progressRatio = Math.max(0, Math.min(1, this.currentPercent / 100));
    const activeSpan = progressRatio * totalSpan;
    const currentAngle = startAngle + activeSpan;

    if (progressRatio > 0.005) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, currentAngle);
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';

      // Gradient Stroke
      const arcGrad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy - radius);
      if (this.currentPercent < 15) {
        arcGrad.addColorStop(0, '#f87171');
        arcGrad.addColorStop(1, '#ef4444');
      } else if (this.currentPercent < 35) {
        arcGrad.addColorStop(0, '#fbbf24');
        arcGrad.addColorStop(1, '#f59e0b');
      } else {
        arcGrad.addColorStop(0, '#00b4d8');
        arcGrad.addColorStop(0.5, '#0099e5');
        arcGrad.addColorStop(1, '#38bdf8');
      }

      ctx.strokeStyle = arcGrad;
      ctx.shadowColor = this.currentPercent < 15 ? 'rgba(239, 68, 68, 0.4)' : (this.currentPercent < 35 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(0, 153, 229, 0.45)');
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.restore();

      // 6. Glowing Indicator Pointer Bead at Current Progress
      const tipCos = Math.cos(currentAngle);
      const tipSin = Math.sin(currentAngle);
      const tipX = cx + tipCos * radius;
      const tipY = cy + tipSin * radius;

      // Outer Halo
      const pulseSize = 9 + Math.sin(this.pulsePhase) * 1.5;
      ctx.beginPath();
      ctx.arc(tipX, tipY, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = this.currentPercent < 15 ? 'rgba(239, 68, 68, 0.25)' : (this.currentPercent < 35 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 153, 229, 0.3)');
      ctx.fill();

      // Core Solid Dot
      ctx.beginPath();
      ctx.arc(tipX, tipY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.fill();
    }

    // 7. Scale Endpoints Labels (0 L and 150 L)
    ctx.save();
    ctx.font = '700 9px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';

    // Left start point (0L)
    const leftCos = Math.cos(startAngle);
    const leftSin = Math.sin(startAngle);
    const lx = cx + leftCos * (radius + 2);
    const ly = cy + leftSin * (radius + 2) + 16;
    ctx.textAlign = 'center';
    ctx.fillText('0 L', lx, ly);

    // Right end point (150L)
    const rightCos = Math.cos(endAngle);
    const rightSin = Math.sin(endAngle);
    const rx = cx + rightCos * (radius + 2);
    const ry = cy + rightSin * (radius + 2) + 16;
    ctx.textAlign = 'center';
    ctx.fillText('150 L', rx, ry);
    ctx.restore();
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
