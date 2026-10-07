import { viewText, viewMessage } from '../i18n/view.js';
import { formatInteger, plural } from '../i18n/view-format.js';
import type { EraSummary } from '../domain/timeline.js';

/** Trecho do parágrafo do ano; `strong` destaca nomes próprios. */
export type TextPart = { text: string; strong?: boolean };

/**
 * Parágrafo do capítulo (§4.3): contagens do ano em frases curtas.
 * @example eraLead(summary).map((part) => part.text).join('')
 */
export function eraLead(summary: EraSummary): TextPart[] {
  return [
    ...repoCountParts(summary),
    ...languageParts(summary),
    ...topicParts(summary),
    ...starParts(summary),
    ...contributionParts(summary),
  ];
}

function repoCountParts({ repoCount, forkCount }: EraSummary): TextPart[] {
  if (!repoCount) return [];
  const forks = forkCount ? ` (${plural(forkCount, 'fork', 'forks')})` : '';
  return [
    {
      text: `${plural(repoCount, 'repositório criado', 'repositórios criados')}${forks}. `,
    },
  ];
}

function languageParts({ topLanguage }: EraSummary): TextPart[] {
  if (!topLanguage) return [];
  return [
    { text: viewText('Linguagem predominante: ') },
    { text: topLanguage.name, strong: true },
    { text: viewMessage(' ({0} de {1}). ', [topLanguage.count, topLanguage.of]) },
  ];
}

function topicParts({ topTopics }: EraSummary): TextPart[] {
  return topTopics.length
    ? [{ text: viewMessage('Topics mais usados: {0}. ', [topTopics.join(', ')]) }]
    : [];
}

function starParts({ mostStarred }: EraSummary): TextPart[] {
  if (!mostStarred) return [];
  return [
    { text: viewText('Mais estrelado: ') },
    { text: mostStarred.name, strong: true },
    { text: ` (★ ${formatInteger(mostStarred.stars)}). ` },
  ];
}

function contributionParts({ contributions }: EraSummary): TextPart[] {
  if (contributions === null) return [];
  return [
    {
      text: viewMessage('{0} no ano.', [
        plural(contributions, 'contribuição pública', 'contribuições públicas'),
      ]),
    },
  ];
}
