import type { FC } from 'hono/jsx';

/** Réplica em HTML do badge SVG (§5.2), para prévias que não dependem de um perfil real. */
export const BadgePreview: FC<{ value: string }> = ({ value }) => (
  <span class="badge-html mono" role="img" aria-label={`github timeline: ${value}`}>
    <span>github timeline</span>
    <span>{value}</span>
  </span>
);
