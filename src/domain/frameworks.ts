/**
 * Catálogo editorial de frameworks (§4.1). Correspondência exata com o topic em minúsculas;
 * aliases da mesma entrada contam como um único framework. Mudar o catálogo exige subir
 * `FRAMEWORK_CATALOG_VERSION` para que os snapshots afetados sejam recalculados.
 */
export const FRAMEWORK_CATALOG_VERSION = 1;

const CATALOG: ReadonlyArray<readonly [display: string, topics: readonly string[]]> = [
  ['React', ['react', 'reactjs']],
  ['Next.js', ['nextjs', 'next-js']],
  ['Angular', ['angular', 'angularjs']],
  ['Vue', ['vue', 'vuejs']],
  ['Nuxt', ['nuxt', 'nuxtjs']],
  ['Svelte', ['svelte', 'sveltejs']],
  ['SvelteKit', ['sveltekit', 'svelte-kit']],
  ['Astro', ['astro', 'astrojs']],
  ['Django', ['django']],
  ['Flask', ['flask']],
  ['FastAPI', ['fastapi']],
  ['Rails', ['rails', 'ruby-on-rails']],
  ['Laravel', ['laravel']],
  ['Spring Boot', ['spring-boot', 'springboot']],
  ['NestJS', ['nestjs', 'nest-js']],
  ['Express', ['express', 'expressjs']],
  ['Flutter', ['flutter']],
  ['React Native', ['react-native', 'reactnative']],
];

const DISPLAY_BY_TOPIC = new Map<string, string>(
  CATALOG.flatMap(([display, topics]) => topics.map((topic) => [topic, display] as const)),
);

/**
 * Nome de exibição do framework associado ao topic, ou `null` se o topic não está no catálogo.
 * @example frameworkForTopic('ReactJS') // "React"
 */
export function frameworkForTopic(topic: string): string | null {
  return DISPLAY_BY_TOPIC.get(topic.toLowerCase()) ?? null;
}

/** Frameworks distintos citados pelos topics de um repositório. */
export function frameworksOf(topics: string[]): string[] {
  const found = topics.map(frameworkForTopic).filter((name): name is string => name !== null);
  return [...new Set(found)];
}
