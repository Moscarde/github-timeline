/** Tipos de `readme-builder-core.js`, para os testes em TypeScript. */

export type ParsedUsername =
  | { status: 'empty' }
  | { status: 'invalid'; received: string }
  | { status: 'ok'; username: string };

export interface TemplateValues {
  placeholder: string;
  username: string | null;
  selection: string | null;
  /** Ajustes fora do padrão, na ordem em que entram na URL. */
  params?: Readonly<Record<string, string>>;
}

export function parseUsername(raw: string): ParsedUsername;
export function selectionSegment(
  selected: readonly string[],
  all: readonly string[],
): string | null;
export function fillTemplate(template: string, values: TemplateValues): string;
export function toggleAchievement(selected: readonly string[], id: string): string[];
