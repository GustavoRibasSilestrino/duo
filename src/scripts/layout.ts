/** Encaixa nome e número na área de estampa de cada peça (usado no servidor e no navegador). */
export interface Area {
  cx: number;
  cy: number;
  pw: number;
  ph: number;
}

export interface Line {
  x: number;
  y: number;
  fs: number;
}

export function layoutPrint(name: string, num: string, a: Area): { name: Line; num: Line } {
  const n = Math.max(name.length, 1);
  const m = Math.max(num.length, 1);
  const numFs = Math.max(26, Math.min(a.ph * 0.7, a.pw / (m * 0.6)));
  const nameFs = Math.max(13, Math.min(a.pw / (n * 0.54), a.ph * 0.2, numFs * 0.62));
  const gap = Math.max(10, a.ph * 0.07);
  const total = nameFs * 0.95 + gap + numFs * 0.8;
  const top = a.cy - total / 2;
  const nameY = top + nameFs * 0.95;
  const numY = nameY + gap + numFs * 0.8;
  return {
    name: { x: a.cx, y: round(nameY), fs: round(nameFs) },
    num: { x: a.cx, y: round(numY), fs: round(numFs) },
  };
}

const round = (v: number) => Math.round(v * 10) / 10;
