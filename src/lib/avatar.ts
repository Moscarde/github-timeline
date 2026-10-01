/**
 * Avatar no tamanho pedido; a URL do GitHub aceita `s=` para redimensionar.
 * @example avatarUrl('https://avatars.githubusercontent.com/u/1?v=4', 176)
 */
export function avatarUrl(base: string, size: number): string {
  return `${base}${base.includes('?') ? '&' : '?'}s=${size}`;
}
