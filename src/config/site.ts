/**
 * Configuração da DUO Estamparia.
 * É aqui que você preenche os contatos. Nada é inventado: enquanto os campos
 * ficarem vazios, os botões avisam que o contato ainda não foi configurado.
 */
export const site = {
  name: 'DUO Estamparia',
  short: 'DUO',
  slogan: '2 corações, 2 objetivos, 1 propósito',
  description:
    'Estampamos camisetas, ecobags, bolsas e copos do seu jeito. Escreva o nome e o número, veja na peça e peça o orçamento pelo WhatsApp. DUO Estamparia, de Yasmin e Gabriel.',
  year: 2026,

  /** PREENCHA: WhatsApp com DDD. Pode ter máscara. Exemplo: '11 91234-5678'. */
  whatsapp: '',

  /** PREENCHA: usuário do Instagram, sem o @. Exemplo: 'duo.estamparia'. */
  instagram: '',

  /** Endereço final do site (para o link de compartilhamento). Exemplo: 'https://www.seudominio.com.br'. */
  url: '',
};

export type ProductKey = 'camiseta' | 'ecobag' | 'bolsa' | 'copo';

export const products: {
  key: ProductKey;
  label: string;
  plural: string;
  number: string;
  line: string;
  pick: string;
}[] = [
  { key: 'camiseta', label: 'Camiseta', plural: 'Camisetas', number: '10', line: 'Nome nas costas, número de craque.', pick: 'Montar camiseta' },
  { key: 'ecobag', label: 'Ecobag', plural: 'Ecobags', number: '7', line: 'Cabe a feira, o mercado e o seu nome.', pick: 'Montar ecobag' },
  { key: 'bolsa', label: 'Bolsa', plural: 'Bolsas', number: '9', line: 'A bolsa que você reconhece de longe.', pick: 'Montar bolsa' },
  { key: 'copo', label: 'Copo', plural: 'Copos', number: '5', line: 'O copo que ninguém pega por engano.', pick: 'Montar copo' },
];

/** Só dígitos, com 55 na frente. Vazio se não configurado. */
export function whatsappDigits(): string {
  const d = site.whatsapp.replace(/\D/g, '');
  if (!d) return '';
  return d.length <= 11 ? `55${d}` : d;
}

export function instagramUrl(): string {
  const u = site.instagram.replace(/^@/, '').trim();
  return u ? `https://www.instagram.com/${u}/` : '';
}
