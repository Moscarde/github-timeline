import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

export interface CardFont {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600 | 700;
  style: 'normal';
}

const require = createRequire(import.meta.url);

/** O Satori não lê WOFF2; por isso o card usa os `.woff` dos pacotes @fontsource. */
const FONT_FILES: Array<[name: string, file: string, weight: CardFont['weight']]> = [
  ['Mona Sans', '@fontsource/mona-sans/files/mona-sans-latin-400-normal.woff', 400],
  ['Mona Sans', '@fontsource/mona-sans/files/mona-sans-latin-700-normal.woff', 700],
  ['JetBrains Mono', '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff', 500],
  ['JetBrains Mono', '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff', 700],
];

/**
 * Carrega as fontes auto-hospedadas usadas no card (§7).
 * @example const fonts = await loadCardFonts();
 */
export async function loadCardFonts(): Promise<CardFont[]> {
  return Promise.all(
    FONT_FILES.map(async ([name, file, weight]) => ({
      name,
      weight,
      style: 'normal' as const,
      data: await readFile(require.resolve(file)),
    })),
  );
}
