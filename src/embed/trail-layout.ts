import type { ProfileSnapshot } from '../domain/snapshot.js';

/** Largura útil dos embeds de 840 px, descontadas as margens de 24 px. */
export const TRAIL_AREA_WIDTH = 792;
export const TRAIL_ROWS = 9;
const YEAR_GAP = 10;
const MAX_PITCH = 10;
/** Colunas agrupadas são menos numerosas: quadrados maiores ocupam a largura toda. */
const MAX_GROUPED_PITCH = 14;
const MIN_PITCH = 8;
/** Agrupamentos possíveis de meses por coluna, do mais fino ao mais grosso. */
const MONTH_GROUPS = [1, 2, 3, 4, 6, 12] as const;
/** Abaixo disso não cabem os títulos das eras sob cada ano. */
const MIN_TITLE_BLOCK = 96;

/** Uma coluna da grade: um mês, ou um grupo de meses em carreiras longas. */
export interface TrailColumn {
  year: number;
  startMonth: number;
  endMonth: number;
  count: number;
  /** Quadrados acesos, de 0 a `TRAIL_ROWS`, em escala log relativa ao pico do perfil. */
  squares: number;
  x: number;
  /** Meses depois da coleta: desenhados apagados. */
  future: boolean;
}

/** Bloco de um ano, com o título da era que o descreve. */
export interface TrailYear {
  year: number;
  x: number;
  width: number;
  total: number;
  title: string;
  isRecord: boolean;
}

export interface TrailLayout {
  years: TrailYear[];
  columns: TrailColumn[];
  pitch: number;
  monthsPerColumn: number;
  /** Distância da primeira à última coluna: o percurso do cometa. */
  span: number;
  showTitles: boolean;
  total: number;
  peak: TrailColumn | null;
}

/**
 * Meses por coluna e distância entre colunas para caber `yearCount` anos em 792 px.
 * @example columnGrouping(6) // { monthsPerColumn: 1, pitch: 10 }
 */
export function columnGrouping(yearCount: number): { monthsPerColumn: number; pitch: number } {
  const free = TRAIL_AREA_WIDTH - Math.max(0, yearCount - 1) * YEAR_GAP;
  for (const group of MONTH_GROUPS) {
    const pitch = Math.floor(free / (yearCount * (12 / group)));
    const cap = group === 1 ? MAX_PITCH : MAX_GROUPED_PITCH;
    if (pitch >= MIN_PITCH) return { monthsPerColumn: group, pitch: Math.min(pitch, cap) };
  }
  return { monthsPerColumn: 12, pitch: MIN_PITCH };
}

/**
 * Quadrados acesos: log₂ relativo ao pico, para que perfis pequenos e enormes usem a
 * altura toda. Qualquer contribuição acende ao menos um.
 * @example squaresFor(397, 397) // 9
 */
export function squaresFor(count: number, peak: number): number {
  if (count <= 0 || peak <= 0) return 0;
  const ratio = Math.log2(count + 1) / Math.log2(peak + 1);
  return Math.max(1, Math.ceil(TRAIL_ROWS * ratio));
}

/**
 * Geometria da trilha: um bloco por ano da timeline, centralizado em 840 px.
 * @example trailLayout(snapshot).columns.length // 72 para 6 anos
 */
export function trailLayout(snapshot: ProfileSnapshot): TrailLayout {
  const { monthsPerColumn, pitch } = columnGrouping(snapshot.timeline.length);
  const blockWidth = (12 / monthsPerColumn) * pitch;
  const used = snapshot.timeline.length * (blockWidth + YEAR_GAP) - YEAR_GAP;
  const left = (840 - used) / 2;
  const options = { monthsPerColumn, pitch, lastMonth: monthIndex(snapshot.generatedAt) };
  const columns = withSquares(
    snapshot.timeline.flatMap((era, index) =>
      yearColumns(snapshot, era.year, left + index * (blockWidth + YEAR_GAP), options),
    ),
  );
  return {
    years: yearBlocks(snapshot, left, blockWidth),
    ...{ columns, pitch, monthsPerColumn, showTitles: blockWidth >= MIN_TITLE_BLOCK },
    span: (columns.at(-1)?.x ?? 0) - (columns[0]?.x ?? 0),
    total: columns.reduce((sum, column) => sum + column.count, 0),
    peak: peakColumn(columns),
  };
}

interface ColumnOptions {
  monthsPerColumn: number;
  pitch: number;
  lastMonth: number;
}

function yearColumns(
  snapshot: ProfileSnapshot,
  year: number,
  x: number,
  options: ColumnOptions,
): TrailColumn[] {
  const months = snapshot.months[year] ?? [];
  const columns: TrailColumn[] = [];
  for (let start = 0; start < 12; start += options.monthsPerColumn) {
    const end = start + options.monthsPerColumn - 1;
    const count = months.slice(start, end + 1).reduce((sum, value) => sum + value, 0);
    const future = year * 12 + start > options.lastMonth;
    const columnX = x + (start / options.monthsPerColumn) * options.pitch;
    columns.push({ year, startMonth: start, endMonth: end, count, squares: 0, x: columnX, future });
  }
  return columns;
}

function withSquares(columns: TrailColumn[]): TrailColumn[] {
  const peak = Math.max(0, ...columns.map((column) => column.count));
  return columns.map((column) => ({ ...column, squares: squaresFor(column.count, peak) }));
}

function yearBlocks(snapshot: ProfileSnapshot, left: number, blockWidth: number): TrailYear[] {
  return snapshot.timeline.map((era, index) => ({
    year: era.year,
    x: left + index * (blockWidth + YEAR_GAP),
    width: blockWidth,
    total: (snapshot.months[era.year] ?? []).reduce((sum, value) => sum + value, 0),
    title: era.title,
    isRecord: era.isRecord,
  }));
}

function peakColumn(columns: TrailColumn[]): TrailColumn | null {
  return columns.reduce<TrailColumn | null>(
    (top, column) => (column.count > (top?.count ?? 0) ? column : top),
    null,
  );
}

/** Ano × 12 + mês (0–11) da data ISO, em UTC. */
function monthIndex(iso: string): number {
  const date = new Date(iso);
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}
