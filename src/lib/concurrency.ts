/**
 * `Promise.all` com limite de requisições simultâneas, para não acionar os limites
 * secundários da API do GitHub.
 * @example await mapWithConcurrency(years, 6, (year) => fetchYear(year))
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index] as T);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Divide uma lista em blocos de tamanho fixo.
 * @example chunk([1, 2, 3], 2) // [[1, 2], [3]]
 */
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size)
    chunks.push(items.slice(start, start + size));
  return chunks;
}
