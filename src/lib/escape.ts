const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapa texto para HTML e SVG: todo conteúdo vindo do GitHub passa por aqui (§8).
 * @example escapeMarkup('<b>') // "&lt;b&gt;"
 */
export function escapeMarkup(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}
