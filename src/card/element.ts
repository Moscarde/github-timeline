/** Nó no formato que o Satori aceita (mesmo shape de um elemento React). */
export interface CardNode {
  type: string;
  props: {
    style?: Record<string, string | number>;
    children?: CardChild | CardChild[];
    [key: string]: unknown;
  };
}

export type CardChild = CardNode | string | null;

/**
 * Cria um nó do card. Texto passa como string: o Satori desenha glifos, não interpreta HTML.
 * @example node('div', { display: 'flex' }, 'olá')
 */
export function node(
  type: string,
  style: Record<string, string | number>,
  children: CardChild | CardChild[] = null,
  attributes: Record<string, unknown> = {},
): CardNode {
  return { type, props: { ...attributes, style, children } };
}
