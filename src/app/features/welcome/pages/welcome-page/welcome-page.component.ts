import {
  Component, OnInit, OnDestroy, AfterViewInit,
  Renderer2, ElementRef, ViewChild, HostListener, NgZone
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface ConstellationNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  pulsePhase: number;
  color: string;
}

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome-page.component.html',
  styleUrls: ['./welcome-page.component.css']
})
export class WelcomePageComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('cursorGlow') cursorGlowRef!: ElementRef;
  @ViewChild('bgCanvas') bgCanvasRef!: ElementRef<HTMLCanvasElement>;

  /* ── State ── */
  clock: string = '';
  date: string = '';
  greetingWord: string = 'Valued Guest';
  visitorCount: number = 0;
  weeklyCount: number = 0;
  pendingCount: number = 0;

  /* ── Private ── */
  private timer: any;
  private countTimer: any;
  private greetTimer: any;
  private rafId: number = 0;
  private ctx!: CanvasRenderingContext2D;
  private nodes: ConstellationNode[] = [];
  private mouse = { x: -9999, y: -9999 };
  private greetIndex = 0;

  private updateGreeting(): void {
  const hour = new Date().getHours();

  if (hour < 12) {
    this.greetingWord = 'Good Morning';
  } else if (hour < 18) {
    this.greetingWord = 'Good Afternoon';
  } else {
    this.greetingWord = 'Good Evening';
  }
}

  private readonly NODE_COLORS = [
    'rgba(26,111,232,',
    'rgba(14,175,168,',
    'rgba(242,123,22,',
    'rgba(90,120,220,'
  ];

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) { }

  /* ═══════════════════ LIFECYCLE ═══════════════════ */

  ngOnInit(): void {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);
    this.animateCounter('visitorCount', 47);
    this.animateCounter('weeklyCount', 312);
    this.animateCounter('pendingCount', 8);
    this.updateGreeting();
    setInterval(() => {
      this.updateGreeting();
    }, 60000); // update every minute
  }
  

  ngAfterViewInit(): void {
    this.initCanvas();
    this.initCardTilt();
    this.initMagneticButtons();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    clearInterval(this.countTimer);
    clearInterval(this.greetTimer);
    cancelAnimationFrame(this.rafId);
  }

  /* ═══════════════════ MOUSE ═══════════════════ */

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;

    /* Cursor glow follow */
    if (this.cursorGlowRef) {
      const el = this.cursorGlowRef.nativeElement;
      this.renderer.setStyle(el, 'left', e.clientX + 'px');
      this.renderer.setStyle(el, 'top', e.clientY + 'px');
    }

    /* Parallax layers */
    this.applyParallax(e);
  }

  private applyParallax(e: MouseEvent): void {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;

    const layers: Array<{ sel: string; factor: number }> = [
      { sel: '.aurora-1', factor: 18 },
      { sel: '.aurora-2', factor: 14 },
      { sel: '.aurora-3', factor: 10 },
      { sel: '.aurora-4', factor: 22 },
      { sel: '.blob-1', factor: 12 },
      { sel: '.blob-2', factor: 16 },
      { sel: '.blob-3', factor: 8 },
    ];

    layers.forEach(({ sel, factor }) => {
      const el = document.querySelector(sel) as HTMLElement;
      if (el) {
        el.style.transform = `translate(${dx * factor}px, ${dy * factor}px)`;
      }
    });
  }

  /* ═══════════════════ CLOCK ═══════════════════ */

  updateClock(): void {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = ((h % 12) || 12).toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');

    this.clock = `${hh}:${mm} ${ampm}`;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.date = `${days[now.getDay()]} · ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }

  /* ═══════════════════ ANIMATED COUNTERS ═══════════════════ */

  private animateCounter(prop: keyof this, target: number): void {
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 45));
    const ticker = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(ticker);
      }
      (this as any)[prop] = current;
    }, 35);
  }



 

  /* ═══════════════════ CANVAS CONSTELLATION ═══════════════════ */

  private initCanvas(): void {
    const canvas = this.bgCanvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas(canvas);

    window.addEventListener('resize', () => this.resizeCanvas(canvas));

    /* Spawn nodes */
    const count = Math.floor((canvas.width * canvas.height) / 14000);
    for (let i = 0; i < count; i++) {
      this.nodes.push(this.createNode(canvas.width, canvas.height));
    }

    /* Run outside Angular zone for performance */
    this.ngZone.runOutsideAngular(() => {
      this.animateCanvas();
    });
  }

  private resizeCanvas(canvas: HTMLCanvasElement): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private createNode(w: number, h: number): ConstellationNode {
    const colorBase = this.NODE_COLORS[Math.floor(Math.random() * this.NODE_COLORS.length)];
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2.5 + 1,
      alpha: Math.random() * 0.5 + 0.2,
      pulsePhase: Math.random() * Math.PI * 2,
      color: colorBase,
    };
  }

  private animateCanvas(): void {
    const canvas = this.bgCanvasRef.nativeElement;
    const ctx = this.ctx;
    const w = canvas.width;
    const h = canvas.height;
    const t = performance.now() * 0.001;

    ctx.clearRect(0, 0, w, h);

    /* Update & draw nodes */
    for (const node of this.nodes) {
      node.x += node.vx;
      node.y += node.vy;

      /* Wrap around edges */
      if (node.x < -10) node.x = w + 10;
      if (node.x > w + 10) node.x = -10;
      if (node.y < -10) node.y = h + 10;
      if (node.y > h + 10) node.y = -10;

      /* Mouse repulsion */
      const dx = node.x - this.mouse.x;
      const dy = node.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120 * 0.8;
        node.vx += (dx / dist) * force;
        node.vy += (dy / dist) * force;
      }

      /* Damping */
      node.vx *= 0.995;
      node.vy *= 0.995;

      /* Clamp speed */
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > 1.5) {
        node.vx = (node.vx / speed) * 1.5;
        node.vy = (node.vy / speed) * 1.5;
      }

      /* Pulsing alpha */
      const pulse = Math.sin(t * 1.5 + node.pulsePhase) * 0.15;
      const alpha = Math.max(0.05, node.alpha + pulse);

      /* Draw node */
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${node.color}${alpha})`;
      ctx.fill();
    }

    /* Draw edges */
    const maxDist = 130;
    const maxMouse = 180;

    for (let i = 0; i < this.nodes.length; i++) {
      const a = this.nodes[i];

      /* Node-to-node edges */
      for (let j = i + 1; j < this.nodes.length; j++) {
        const b = this.nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < maxDist) {
          const alpha = (1 - d / maxDist) * 0.18;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(26,111,232,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      /* Mouse-to-node edges */
      if (this.mouse.x > 0) {
        const dx = a.x - this.mouse.x;
        const dy = a.y - this.mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < maxMouse) {
          const alpha = (1 - d / maxMouse) * 0.35;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(this.mouse.x, this.mouse.y);
          ctx.strokeStyle = `rgba(26,111,232,${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }

    this.rafId = requestAnimationFrame(() => this.animateCanvas());
  }

  /* ═══════════════════ 3D CARD TILT ═══════════════════ */

  private initCardTilt(): void {
    /* Handled via template bindings (onCardMouseMove / Leave) */
  }

  onCardMouseMove(e: MouseEvent): void {
    const card = e.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = (y - cy) / 12;
    const rotY = (cx - x) / 12;

    this.renderer.setStyle(card, 'transition', 'transform 0.08s ease, box-shadow 0.2s ease');
    this.renderer.setStyle(card, 'transform',
      `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.05) translateZ(16px)`
    );
  }

  onCardMouseLeave(e: MouseEvent): void {
    const card = e.currentTarget as HTMLElement;
    this.renderer.setStyle(card, 'transition',
      'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease');
    this.renderer.setStyle(card, 'transform',
      'rotateX(0) rotateY(0) scale(1) translateZ(0)');
  }

  /* ═══════════════════ MAGNETIC BUTTONS ═══════════════════ */

  private initMagneticButtons(): void {
    document.querySelectorAll('.action-card').forEach((card: any) => {
      card.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        const iconWrap = card.querySelector('.card-icon-wrap') as HTMLElement;
        if (iconWrap) {
          iconWrap.style.transform = `translate(${relX * 0.08}px, ${relY * 0.08}px) scale(1) rotate(-5deg)`;
        }
      });

      card.addEventListener('mouseleave', () => {
        const iconWrap = card.querySelector('.card-icon-wrap') as HTMLElement;
        if (iconWrap) {
          iconWrap.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
          iconWrap.style.transform = '';
        }
      });
    });
  }

  /* ═══════════════════ CLICK + RIPPLE ═══════════════════ */

  handleClick(event: MouseEvent, route: string): void {
    const card = event.currentTarget as HTMLElement;
    const ripple = this.renderer.createElement('div');
    const rect = card.getBoundingClientRect();

    this.renderer.addClass(ripple, 'ripple');
    this.renderer.setStyle(ripple, 'left', (event.clientX - rect.left - 50) + 'px');
    this.renderer.setStyle(ripple, 'top', (event.clientY - rect.top - 50) + 'px');
    this.renderer.appendChild(card, ripple);

    setTimeout(() => this.renderer.removeChild(card, ripple), 800);

    // ✅ navigate with the action as a query param
    setTimeout(() => {
      this.router.navigate(['/auth/login']);
    }, 300);
  }
  /* ═══════════════════ BURST PARTICLES ═══════════════════ */

  private burstParticles(x: number, y: number): void {
    const colors = ['#1A6FE8', '#0EAFA8', '#F27B16', '#ffffff'];
    for (let i = 0; i < 14; i++) {
      const el = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 8 + 3;
      const angle = (Math.PI * 2 / 14) * i + Math.random() * 0.4;
      const dist = Math.random() * 90 + 40;

      Object.assign(el.style, {
        position: 'fixed',
        left: x + 'px',
        top: y + 'px',
        width: size + 'px',
        height: size + 'px',
        borderRadius: '50%',
        background: color,
        pointerEvents: 'none',
        zIndex: '9999',
        transition: `all ${0.4 + Math.random() * 0.4}s cubic-bezier(0.165,0.84,0.44,1)`,
      });

      document.body.appendChild(el);

      requestAnimationFrame(() => {
        el.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`;
        el.style.opacity = '0';
      });

      setTimeout(() => document.body.removeChild(el), 900);
    }
  }
}
