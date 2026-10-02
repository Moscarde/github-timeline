import type { FC } from 'hono/jsx';

export interface CompareFormProps {
  /** Texto antes dos campos, ex.: "Ou compare dois perfis:". */
  lead: string;
  id?: string;
  /** Primeiro perfil preenchido; com `lockA` vira fixo (o perfil aberto). */
  a?: string;
  b?: string;
  lockA?: boolean;
}

/**
 * Formulário "a vs b" que leva a `/comparar`: na landing, no perfil e na própria comparação.
 * @example <CompareForm lead="Comparar com outro perfil:" a="torvalds" lockA />
 */
export const CompareForm: FC<CompareFormProps> = ({ lead, id, a, b, lockA }) => (
  <form class="compare-form muted" id={id} action="/comparar" method="get">
    <span>{lead}</span>
    <span class="compare-inputs mono">
      {lockA ? <LockedUsername username={a ?? ''} /> : <UsernameInput name="a" value={a} />}
      <span class="faint">vs</span>
      <UsernameInput name="b" value={b} placeholder={lockA ? 'outro-username' : undefined} />
      <button class="link-btn" type="submit">
        Comparar
      </button>
    </span>
  </form>
);

const LockedUsername: FC<{ username: string }> = ({ username }) => (
  <>
    <input type="hidden" name="a" value={username} />
    <span class="chip side-a">{username}</span>
  </>
);

const UsernameInput: FC<{ name: 'a' | 'b'; value?: string; placeholder?: string }> = ({
  name,
  value,
  placeholder,
}) => (
  <input
    class="chip"
    name={name}
    value={value}
    placeholder={placeholder ?? (name === 'a' ? 'torvalds' : 'gaearon')}
    aria-label={name === 'a' ? 'Primeiro perfil' : 'Segundo perfil'}
    autocomplete="off"
    spellcheck={false}
    required
  />
);
