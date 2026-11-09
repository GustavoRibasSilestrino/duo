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
  const numFs = Math.max(24, Math.min(a.ph * 0.62, a.pw / (m * 0.7)));
  const nameFs = Math.max(11, Math.min(a.pw / (n * 0.78), a.ph * 0.17, numFs * 0.5));
  const gap = Math.max(10, a.ph * 0.07);
  // altura das maiúsculas 0.7em, mais o acento (Ê) 0.18em; algarismos 0.72em
  const total = nameFs * 0.88 + gap + numFs * 0.72;
  const top = a.cy - total / 2;
  const nameY = top + nameFs * 0.88;
  const numY = nameY + gap + numFs * 0.72;
  return {
    name: { x: a.cx, y: round(nameY), fs: round(nameFs) },
    num: { x: a.cx, y: round(numY), fs: round(numFs) },
  };
}

const round = (v: number) => Math.round(v * 10) / 10;
