import { describe, expect, it } from 'vitest';
import { badgeLabel, renderBadge } from '../../src/brand/badge.js';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';

const snapshotWith = (years: number[]) =>
  deriveSnapshot(
    {
      account: makeAccount(),
      repos: years.map((year) => repoIn(year)),
      months: {},
      orgContributions: [],
    },
    new Date('2026-01-01T00:00:00Z'),
  );

describe('badge', () => {
  it('formata intervalo e plural', () => {
    expect(badgeLabel(snapshotWith([2014, 2020]))).toBe('Timeline · 2014–2020 · 2 repos');
    expect(badgeLabel(snapshotWith([2020]))).toBe('Timeline · 2020 · 1 repo');
  });

  it('usa a paleta do tema e inclui o símbolo', () => {
    const dark = renderBadge(snapshotWith([2020]), 'escuro');
    expect(dark).toContain('fill="#0F172A"');
    expect(dark).toContain('stroke="#22C55E"');
    expect(renderBadge(snapshotWith([2020]), 'claro')).toContain('fill="#FFFFFF"');
  });

  it('gera badge cinza sem snapshot', () => {
    expect(renderBadge(null, 'escuro')).toContain('Timeline · não encontrado');
  });
});
