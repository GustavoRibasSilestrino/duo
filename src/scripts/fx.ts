/**
 * Efeitos de movimento: mouse (cursor, ímã nos botões, inclinação da peça, luz nos furinhos),
 * rolagem (camisa que gira, peças que flutuam, parallax do herói).
 * Tudo só com transform e opacidade. Nada disso é necessário para usar o site:
 * sem mouse fino ou com "reduzir movimento", os efeitos simplesmente não ligam.
 */
import { layoutPrint } from './layout';

const html = document.documentElement;
const reduced =
  matchMedia('(prefers-reduced-motion: reduce)').matches || html.classList.contains('rm');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

/* ------------------------------------------------------------------ */
/* Camisa que gira com a rolagem                                      */
/* ------------------------------------------------------------------ */
const turn = $('[data-turn]');
if (turn && !reduced) {
  const track = $('.turn__track', turn)!;
  const rot = $('[data-turn-rot]', turn)!;
  const faces = $$<SVGSVGElement>('svg.piece-svg', rot);
  const back = $<SVGGElement>('[data-print]', rot);
  const floats = $$('.turn__float', turn);
  const TONE: Record<string, string> = { preta: 'dark', branca: 'light', roxa: 'purple' };

  let target = 0;
  let cur = 0;
  let raf = 0;
  let color = '';
  let text = '';

  const setPrint = (name: string, num: string) => {
    if (!back) return;
    const area = {
      cx: Number(back.dataset.cx),
      cy: Number(back.dataset.cy),
      pw: Number(back.dataset.pw),
      ph: Number(back.dataset.ph),
    };
    const lay = layoutPrint(name, num, area);
    for (const [key, l, w, dx, dy, t] of [
      ['name', lay.name, 0.1, 0.04, 0.055, name],
      ['num', lay.num, 0.08, 0.03, 0.045, num],
    ] as const) {
      const g = $<SVGGElement>(`[data-line="${key}"]`, back);
      if (!g) continue;
      g.style.setProperty('--tw-w', `${(l.fs * w).toFixed(1)}px`);
      g.style.setProperty('--tw-dx', `${(l.fs * dx).toFixed(1)}px`);
      g.style.setProperty('--tw-dy', `${(l.fs * dy).toFixed(1)}px`);
      for (const el of $$<SVGTextElement>('text', g)) {
        el.textContent = t;
        el.setAttribute('x', String(l.x));
        el.setAttribute('y', String(l.y));
        el.setAttribute('font-size', String(l.fs));
      }
    }
  };

  const apply = (p: number) => {
    const deg = p * 720;
    turn.style.setProperty('--p', p.toFixed(4));
    rot.style.setProperty('--r', deg.toFixed(2));

    // a cor muda enquanto a camisa está de frente: preta, branca, roxa
    const c = deg < 290 ? 'preta' : deg < 560 ? 'branca' : 'roxa';
    if (c !== color) {
      color = c;
      for (const f of faces) {
        f.dataset.color = c;
        f.classList.remove('twill--dark', 'twill--light', 'twill--purple');
        f.classList.add(`twill--${TONE[c]}`);
      }
    }
    // o nome nas costas troca enquanto a camisa está de frente
    const t = deg < 360 ? 'YASMIN|1' : 'GABRIEL|2';
    if (t !== text) {
      text = t;
      const [n, num] = t.split('|');
      setPrint(n, num);
    }
    const cap = deg < 150 ? '1' : deg < 420 ? '2' : '3';
    if (turn.dataset.cap !== cap) turn.dataset.cap = cap;
  };

  const read = () => {
    const r = track.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    target = total > 0 ? clamp(-r.top / total) : 0;
  };
  // suaviza: a camisa persegue a rolagem em vez de pular
  const tick = () => {
    cur += (target - cur) * 0.14;
    if (Math.abs(target - cur) < 0.0004) cur = target;
    apply(cur);
    raf = cur === target ? 0 : requestAnimationFrame(tick);
  };
  const kick = () => {
    read();
    if (!raf) raf = requestAnimationFrame(tick);
  };
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
  read();
  cur = target;
  apply(cur);
  void floats;
}

/* ------------------------------------------------------------------ */
/* Herói: parallax de rolagem + inclinação e luz seguindo o mouse     */
/* ------------------------------------------------------------------ */
const hero = $('[data-hero]');
if (hero && !reduced) {
  // as peças sobem devagar enquanto o herói sai de cena
  let hsRaf = 0;
  const hsUpdate = () => {
    hsRaf = 0;
    const h = hero.offsetHeight || 1;
    hero.style.setProperty('--hs', clamp(window.scrollY / h).toFixed(3));
  };
  addEventListener(
    'scroll',
    () => {
      if (!hsRaf) hsRaf = requestAnimationFrame(hsUpdate);
    },
    { passive: true },
  );
  hsUpdate();
}

// zonas que inclinam e acendem seguindo o mouse (herói e "monte a sua")
if (finePointer && !reduced) {
  for (const zone of $$('[data-tilt]')) {
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.085;
      cy += (ty - cy) * 0.085;
      zone.style.setProperty('--tx', cx.toFixed(4));
      zone.style.setProperty('--ty', cy.toFixed(4));
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.0005 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    zone.addEventListener(
      'pointermove',
      (e) => {
        const r = zone.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width;
        const ny = (e.clientY - r.top) / r.height;
        tx = nx - 0.5;
        ty = ny - 0.5;
        zone.style.setProperty('--mx', `${(nx * 100).toFixed(1)}%`);
        zone.style.setProperty('--my', `${(ny * 100).toFixed(1)}%`);
        kick();
      },
      { passive: true },
    );
    zone.addEventListener('pointerleave', () => {
      tx = 0;
      ty = 0;
      kick();
    });
  }
}

/* ------------------------------------------------------------------ */
/* Só com mouse de verdade: cursor, ímã nos botões, inclinação das peças */
/* ------------------------------------------------------------------ */
if (finePointer && !reduced) {
  // cursor: um ponto e um anel que persegue
  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(dot, ring);

  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let rx = x;
  let ry = y;
  let scale = 1;
  let want = 1;
  let running = false;
  const frame = () => {
    rx += (x - rx) * 0.2;
    ry += (y - ry) * 0.2;
    scale += (want - scale) * 0.18;
    ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    const moving = Math.abs(x - rx) + Math.abs(y - ry) > 0.1 || Math.abs(want - scale) > 0.002;
    if (moving) requestAnimationFrame(frame);
    else running = false;
  };
  const go = () => {
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  };
  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      html.classList.add('has-cursor');
      go();
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => html.classList.remove('has-cursor'));
  document.addEventListener('pointerover', (e) => {
    const t = e.target as Element | null;
    const hit = t?.closest('a, button, label, select, textarea, input, summary, [data-cursor]');
    ring.classList.toggle('is-link', !!hit);
    const view = t?.closest('[data-cursor]') as HTMLElement | null;
    ring.textContent = view?.dataset.cursor || '';
    want = view ? 2.3 : hit ? 1.7 : 1;
    go();
  });
  addEventListener('pointerdown', () => {
    want = Math.max(0.7, want - 0.5);
    go();
  });
  addEventListener('pointerup', () => {
    want = ring.classList.contains('is-link') ? 1.7 : 1;
    go();
  });

  // botões que puxam o cursor (ímã)
  for (const el of $$<HTMLElement>('.btn, .item__pick')) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      el.style.transform = `translate(${(dx * 12).toFixed(1)}px, ${(dy * 9 - 2).toFixed(1)}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  }

  // peças do cabide e figurinhas: inclinam em direção ao mouse
  for (const el of $$<HTMLElement>('.item__art, .fig__card')) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--ix', nx.toFixed(3));
      el.style.setProperty('--iy', ny.toFixed(3));
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--ix', '0');
      el.style.setProperty('--iy', '0');
    });
  }
}
