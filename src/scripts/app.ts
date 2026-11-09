import { layoutPrint } from './layout';

type Kind = 'camiseta' | 'ecobag' | 'bolsa' | 'copo';
type Color = 'preta' | 'branca' | 'roxa';

const PIECE_LABEL: Record<Kind, string> = {
  camiseta: 'Camiseta',
  ecobag: 'Ecobag',
  bolsa: 'Bolsa',
  copo: 'Copo',
};
const TONE: Record<Color, string> = { preta: 'dark', branca: 'light', roxa: 'purple' };

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

const cfg: { wa: string; ig: string; slogan: string } = (() => {
  try {
    return JSON.parse($('#duo-config')?.textContent || '{}');
  } catch {
    return { wa: '', ig: '', slogan: '' };
  }
})();
const reduced =
  matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('rm');

/* ------------------------------------------------------------------ */
/* Entrada: o logo se monta, um círculo de tinta revela a página      */
/* ------------------------------------------------------------------ */
const html = document.documentElement;
const splash = $('[data-splash]');
const introOn = html.classList.contains('splash-on');
const revealed = () => !html.classList.contains('intro-wait');

// numerais do slogan: um sorteio de algarismos que pousa no valor final
const counters = $$<SVGSVGElement>('[data-count]');
const setNum = (svg: SVGSVGElement, v: string) => $$('text', svg).forEach((t) => (t.textContent = v));
function shuffleCount() {
  counters.forEach((svg, i) => {
    const target = svg.dataset.count || '';
    const start = performance.now() + i * 170;
    const dur = 750 + i * 170;
    const tick = (now: number) => {
      if (now < start) return void requestAnimationFrame(tick);
      if (now - start >= dur) return setNum(svg, target);
      setNum(svg, String(Math.floor(Math.random() * 10)));
      setTimeout(() => requestAnimationFrame(tick), 70);
    };
    requestAnimationFrame(tick);
  });
}
if (introOn) counters.forEach((svg) => setNum(svg, '0'));

if (introOn && splash) {
  const timers: number[] = [];
  const shell = $$('header, main, footer, [data-sticky-cta]');
  shell.forEach((e) => e.setAttribute('inert', ''));
  let wiping = false;
  let didReveal = false;
  let ended = false;

  const reveal = () => {
    if (didReveal) return;
    didReveal = true;
    html.classList.remove('intro-wait');
    shuffleCount();
    window.dispatchEvent(new Event('duo:reveal'));
  };
  const end = () => {
    if (ended) return;
    ended = true;
    timers.forEach(clearTimeout);
    reveal();
    html.classList.remove('splash-on');
    shell.forEach((e) => e.removeAttribute('inert'));
    try {
      sessionStorage.setItem('duo-intro', '1');
    } catch {}
  };
  const canMask = typeof (window as unknown as { CSS?: { registerProperty?: unknown } }).CSS?.registerProperty === 'function';
  const wipe = (fast: boolean) => {
    if (wiping) return;
    wiping = true;
    if (!canMask) {
      splash.classList.add('is-fading');
      timers.push(window.setTimeout(reveal, 120), window.setTimeout(end, 560));
      return;
    }
    splash.classList.add('is-wiping');
    if (fast) splash.classList.add('is-fast');
    const dur = fast ? 450 : 1250;
    timers.push(window.setTimeout(reveal, dur * 0.5), window.setTimeout(end, dur + 80));
  };
  timers.push(window.setTimeout(() => wipe(false), 2000));
  const skip = () => {
    if (ended) return;
    if (wiping) return end();
    timers.forEach(clearTimeout);
    timers.length = 0;
    wipe(true);
  };
  addEventListener('pointerdown', skip, { once: true });
  addEventListener('keydown', skip, { once: true });
}

/* ------------------------------------------------------------------ */
/* Estado compartilhado: prévia do herói e formulário de pedido        */
/* ------------------------------------------------------------------ */
const state = {
  piece: 'camiseta' as Kind,
  color: 'preta' as Color,
  name: '',
  num: '',
  demo: !reduced,
  demoName: '',
  demoNum: '',
};

const root = $('[data-preview]');
const wraps = $$('.piece-wrap', root || document);
const liveRegion = $('[data-preview-live]');
const view = $('[data-view]');
const inName = $<HTMLInputElement>('#pv-name');
const inNum = $<HTMLInputElement>('#pv-num');

function display() {
  if (state.demo) return { name: state.demoName, num: state.demoNum, ghost: false };
  const name = state.name.trim();
  const num = state.num.trim();
  return {
    name: name || 'SEU NOME',
    num: num || '10',
    ghost: !name && !num,
  };
}

const lastText = new WeakMap<Element, string>();

function paintPiece(wrap: HTMLElement, d: ReturnType<typeof display>) {
  const svg = $<SVGSVGElement>('svg', wrap);
  const print = $<SVGGElement>('[data-print]', wrap);
  if (!svg || !print) return;

  svg.dataset.color = state.color;
  svg.classList.remove('twill--dark', 'twill--light', 'twill--purple');
  svg.classList.add(`twill--${TONE[state.color]}`);
  print.classList.toggle('is-ghost', d.ghost);

  const area = {
    cx: Number(print.dataset.cx),
    cy: Number(print.dataset.cy),
    pw: Number(print.dataset.pw),
    ph: Number(print.dataset.ph),
  };
  const name = d.name.toUpperCase();
  const lay = layoutPrint(name || ' ', d.num || ' ', area);

  const lines: [string, string, typeof lay.name, number, number, number][] = [
    ['name', name, lay.name, 0.1, 0.04, 0.055],
    ['num', d.num, lay.num, 0.08, 0.03, 0.045],
  ];
  for (const [key, text, l, w, dx, dy] of lines) {
    const g = $<SVGGElement>(`[data-line="${key}"]`, print);
    if (!g) continue;
    g.style.setProperty('--tw-w', `${(l.fs * w).toFixed(1)}px`);
    g.style.setProperty('--tw-dx', `${(l.fs * dx).toFixed(1)}px`);
    g.style.setProperty('--tw-dy', `${(l.fs * dy).toFixed(1)}px`);
    const changed = lastText.get(g) !== text;
    lastText.set(g, text);
    for (const t of $$<SVGTextElement>('text', g)) {
      t.textContent = text;
      t.setAttribute('x', String(l.x));
      t.setAttribute('y', String(l.y));
      t.setAttribute('font-size', String(l.fs));
    }
    // aplique: a camada de baixo pousa primeiro e a de cima assenta
    if (changed && !reduced && wrap.classList.contains('is-active')) {
      const under = $<SVGTextElement>('.tw-under', g);
      under?.animate(
        [
          { transform: 'translate(-4px,-5px)', opacity: 0.35 },
          { transform: `translate(${(l.fs * dx).toFixed(1)}px,${(l.fs * dy).toFixed(1)}px)`, opacity: 1 },
        ],
        { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' },
      );
      $$<SVGTextElement>('.tw-top, .tw-stitch', g).forEach((t) =>
        t.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 260, easing: 'ease-out', delay: 60, fill: 'backwards' }),
      );
    }
  }
}

function render() {
  const d = display();
  if (view) view.dataset.color = state.color;
  for (const w of wraps) {
    w.classList.toggle('is-active', w.dataset.kind === state.piece);
    paintPiece(w, d);
  }
  updateLinks();
  updatePreview();
}

/* ---- controles do herói ---- */
function announce() {
  if (!liveRegion) return;
  const d = display();
  liveRegion.textContent = `Prévia: ${PIECE_LABEL[state.piece]} ${state.color}, nome ${d.name || 'vazio'}, número ${d.num || 'vazio'}.`;
}
let announceT = 0;
const announceSoon = () => {
  clearTimeout(announceT);
  announceT = window.setTimeout(announce, 700);
};

function stopDemo() {
  if (!state.demo) return;
  state.demo = false;
  clearTimeout(demoT);
  render();
}

inName?.addEventListener('input', () => {
  stopDemo();
  state.name = inName.value.toUpperCase();
  syncOrderFromState();
  render();
  announceSoon();
});
inNum?.addEventListener('input', () => {
  stopDemo();
  state.num = inNum.value;
  syncOrderFromState();
  render();
  announceSoon();
});
for (const r of $$<HTMLInputElement>('input[name="pv-piece"]')) {
  r.addEventListener('change', () => {
    stopDemo();
    state.piece = r.value as Kind;
    syncOrderFromState();
    render();
    announceSoon();
  });
}
for (const r of $$<HTMLInputElement>('input[name="pv-color"]')) {
  r.addEventListener('change', () => {
    stopDemo();
    state.color = r.value as Color;
    render();
    announceSoon();
  });
}
for (const b of $$<HTMLButtonElement>('[data-pick]')) {
  b.addEventListener('click', () => {
    stopDemo();
    state.piece = b.dataset.pick as Kind;
    const radio = $<HTMLInputElement>(`#pv-piece-${state.piece}`);
    if (radio) radio.checked = true;
    syncOrderFromState();
    render();
    announce();
    $('#topo')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  });
}

/* ---- demonstração: a camisa se digita sozinha até a pessoa mexer ---- */
const samples: [string, string][] = [
  ['Yasmin', '1'],
  ['Gabriel', '2'],
  ['Você', '10'],
];
let demoT = 0;
function runDemo() {
  if (!state.demo) return;
  let si = 0;
  const step = (name: string, num: string, i: number) => {
    if (!state.demo) return;
    state.demoName = name.slice(0, i).toUpperCase();
    state.demoNum = i > 0 ? num : '';
    render();
    if (i < name.length) {
      demoT = window.setTimeout(() => step(name, num, i + 1), 130);
    } else {
      // um ciclo só: depois de "Você 10" a camisa fica parada (WCAG 2.2.2)
      if (si < samples.length - 1) {
        demoT = window.setTimeout(() => {
          si += 1;
          step(samples[si][0], samples[si][1], 0);
        }, 1900);
      }
    }
  };
  demoT = window.setTimeout(() => step(samples[0][0], samples[0][1], 0), 900);
}
for (const el of $$('.controls input, .controls label')) {
  el.addEventListener('pointerdown', stopDemo, { once: true });
  el.addEventListener('focus', stopDemo, { once: true });
}
const startDemo = () => {
  if (!document.hidden && state.demo) runDemo();
};
if (revealed()) startDemo();
else window.addEventListener('duo:reveal', () => setTimeout(startDemo, 600), { once: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearTimeout(demoT);
  else if (state.demo && revealed()) runDemo();
});

/* ------------------------------------------------------------------ */
/* Pedido: mensagem do WhatsApp, validação e cópia                    */
/* ------------------------------------------------------------------ */
const form = $<HTMLFormElement>('#order-form');
const oWho = $<HTMLInputElement>('#o-who');
const oPiece = $<HTMLSelectElement>('#o-piece');
const oQty = $<HTMLInputElement>('#o-qty');
const oName = $<HTMLInputElement>('#o-name');
const oNum = $<HTMLInputElement>('#o-num');
const oIdea = $<HTMLTextAreaElement>('#o-idea');
const preview = $('[data-message-preview]');
const orderStatus = $('[data-order-status]');
const summary = $('[data-error-summary]');

function syncOrderFromState() {
  if (oPiece && oPiece.value !== 'varias') oPiece.value = state.piece;
  if (oName && document.activeElement !== oName) oName.value = state.name;
  if (oNum && document.activeElement !== oNum) oNum.value = state.num;
}

function buildMessage(): string {
  const lines = ['Oi, DUO! Vim pelo site e quero um orçamento.'];
  const who = oWho?.value.trim();
  if (who) lines.push(`Meu nome: ${who}`);
  const pieceVal = oPiece?.value || state.piece;
  if (pieceVal === 'varias') lines.push('Peça: mais de uma peça');
  else lines.push(`Peça: ${PIECE_LABEL[pieceVal as Kind] || PIECE_LABEL[state.piece]} (cor de exemplo: ${state.color})`);
  const qty = oQty?.value.trim();
  if (qty) lines.push(`Quantidade: ${qty}`);
  const name = state.name.trim();
  if (name) lines.push(`Nome na estampa: ${name}`);
  const num = state.num.trim();
  if (num) lines.push(`Número: ${num}`);
  const idea = oIdea?.value.trim();
  if (idea) lines.push(`Ideia: ${idea}`);
  return lines.join('\n');
}

function waHref(): string {
  return cfg.wa ? `https://wa.me/${cfg.wa}?text=${encodeURIComponent(buildMessage())}` : '';
}

function updateLinks() {
  const href = waHref();
  for (const a of $$<HTMLAnchorElement>('[data-wa-link]')) {
    if (href) {
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.href = '#pedido';
      a.removeAttribute('target');
    }
  }
}
function updatePreview() {
  if (preview) preview.textContent = buildMessage();
}

const heroStatus = $('[data-wa-status]');
const heroStatusText = $('[data-wa-status-text]');
const MISSING =
  'O WhatsApp da DUO ainda não foi configurado neste site. Copie a mensagem e mande para a gente pelo número que você já tem.';

// Sem WhatsApp configurado, todo botão explica em vez de apontar para um número falso:
// no herói o aviso aparece ali mesmo; nos outros, a página vai ao pedido e o aviso aparece lá.
$$<HTMLAnchorElement>('[data-wa-link]').forEach((a) =>
  a.addEventListener('click', (e) => {
    if (cfg.wa) return;
    e.preventDefault();
    if (a.closest('.hero') && heroStatus && heroStatusText) {
      heroStatusText.textContent = MISSING;
      heroStatus.classList.add('is-on');
      return;
    }
    $('#pedido')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    if (orderStatus) orderStatus.textContent = MISSING;
  }),
);

async function copyMessage(target: Element | null) {
  const text = buildMessage();
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
  }
  const msg = ok ? 'Mensagem copiada. É só colar no WhatsApp.' : 'Não deu para copiar. Selecione o texto do bilhete e copie.';
  const box = target?.closest('.wa-status') ? heroStatusText : orderStatus;
  if (box) box.textContent = msg;
}
for (const b of $$('[data-copy-msg]')) b.addEventListener('click', () => copyMessage(b));

/* ---- validação: ao sair do campo e ao enviar ---- */
const rules: { el: HTMLInputElement | HTMLSelectElement | null; id: string; label: string; check: (v: string) => string }[] = [
  { el: oWho, id: 'o-who', label: 'Seu nome', check: (v) => (v.trim() ? '' : 'Diga como podemos chamar você.') },
  { el: oPiece, id: 'o-piece', label: 'Peça', check: (v) => (v ? '' : 'Escolha uma peça.') },
  {
    el: oQty,
    id: 'o-qty',
    label: 'Quantidade',
    check: (v) => {
      const n = Number(v);
      if (!v.trim()) return 'Informe a quantidade, mesmo que aproximada.';
      if (!Number.isFinite(n) || n < 1) return 'A quantidade precisa ser 1 ou mais.';
      return '';
    },
  },
];

function showError(r: (typeof rules)[number], msg: string) {
  const p = $(`[data-err="${r.id}"]`);
  if (!p || !r.el) return;
  p.textContent = msg;
  p.hidden = !msg;
  if (msg) r.el.setAttribute('aria-invalid', 'true');
  else r.el.removeAttribute('aria-invalid');
}
for (const r of rules) {
  r.el?.addEventListener('blur', () => showError(r, r.check(r.el!.value)));
  r.el?.addEventListener('input', () => {
    if (r.el!.getAttribute('aria-invalid')) showError(r, r.check(r.el!.value));
  });
}

for (const el of [oWho, oQty, oIdea]) el?.addEventListener('input', () => { updateLinks(); updatePreview(); });
oPiece?.addEventListener('change', () => {
  if (oPiece.value && oPiece.value !== 'varias') {
    state.piece = oPiece.value as Kind;
    const radio = $<HTMLInputElement>(`#pv-piece-${state.piece}`);
    if (radio) radio.checked = true;
  }
  stopDemo();
  render();
});
oName?.addEventListener('input', () => {
  stopDemo();
  state.name = oName.value.toUpperCase();
  if (inName) inName.value = state.name;
  render();
});
oNum?.addEventListener('input', () => {
  stopDemo();
  state.num = oNum.value;
  if (inNum) inNum.value = state.num;
  render();
});

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const errors: { r: (typeof rules)[number]; msg: string }[] = [];
  for (const r of rules) {
    const msg = r.check(r.el?.value ?? '');
    showError(r, msg);
    if (msg) errors.push({ r, msg });
  }
  if (summary) {
    const ul = $('ul', summary);
    if (ul) {
      ul.innerHTML = '';
      for (const { r, msg } of errors) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${r.id}`;
        a.textContent = `${r.label}: ${msg}`;
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          r.el?.focus();
        });
        li.appendChild(a);
        ul.appendChild(li);
      }
    }
    summary.hidden = errors.length === 0;
    if (errors.length) {
      (summary as HTMLElement).focus();
      return;
    }
  }
  if (orderStatus) orderStatus.textContent = '';
  const href = waHref();
  if (href) {
    window.open(href, '_blank', 'noopener');
    if (orderStatus) orderStatus.textContent = 'Abrindo o WhatsApp com a sua mensagem…';
  } else if (orderStatus) {
    orderStatus.textContent = MISSING;
  }
});

/* ------------------------------------------------------------------ */
/* Cabeçalho, menu, revelar, história e barra fixa                    */
/* ------------------------------------------------------------------ */
const header = $('[data-header]');
const onScroll = () => header?.classList.toggle('is-stuck', window.scrollY > 8);
onScroll();
addEventListener('scroll', onScroll, { passive: true });

const menu = $('[data-menu]');
const toggle = $<HTMLButtonElement>('[data-menu-toggle]');
function setMenu(open: boolean) {
  menu?.classList.toggle('is-open', open);
  toggle?.setAttribute('aria-expanded', String(open));
  const label = $('.sr-only', toggle || document);
  if (label) label.textContent = open ? 'Fechar menu' : 'Abrir menu';
}
toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
menu?.addEventListener('click', (e) => {
  if ((e.target as Element).closest('a')) setMenu(false);
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    toggle.focus();
  }
});
matchMedia('(min-width: 62.01rem)').addEventListener('change', (m) => m.matches && setMenu(false));

// revelar ao rolar
const reveals = $$('.reveal');
if ('IntersectionObserver' in window && reveals.length) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

// história: passos conforme a rolagem
const story = $('[data-story]');
if (story && !reduced) {
  const track = $('.story__track', story)!;
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = track.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    const step = p < 0.34 ? 1 : p < 0.67 ? 2 : 3;
    if (story.dataset.step !== String(step)) story.dataset.step = String(step);
    story.style.setProperty('--p', p.toFixed(3));
    // entrou: o palco já ocupa boa parte da tela (o chão vira roxo e os corações começam a bater)
    story.classList.toggle('is-in', r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.25);
  };
  const req = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  update();
}

// barra fixa do celular: aparece depois do herói e some no formulário
const sticky = $('[data-sticky-cta]');
const heroCta = $('.hero__cta');
const orderSection = $('#pedido');
if (sticky && heroCta) {
  let orderIn = false;
  const apply = () => {
    const show = !orderIn;
    sticky.classList.toggle('is-visible', show);
    sticky.setAttribute('aria-hidden', String(!show));
    $('a', sticky)?.setAttribute('tabindex', show ? '0' : '-1');
  };
  apply();
  if (orderSection) {
    new IntersectionObserver(([en]) => {
      orderIn = en.isIntersecting;
      apply();
    }, { threshold: 0.12 }).observe(orderSection);
  }
}

/* ---- início ---- */
syncOrderFromState();
render();
