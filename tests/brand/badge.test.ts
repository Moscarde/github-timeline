import { describe, expect, it } from 'vitest';
import { badgeLabel, badgeValue, renderBadge } from '../../src/brand/badge.js';
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
    expect(badgeValue(snapshotWith([2014, 2020]).stats)).toBe('2014–2020 · 2 repos');
    expect(badgeLabel(snapshotWith([2020]))).toBe('github timeline: 2020 · 1 repo');
  });

  it('desenha os dois segmentos do template', () => {
    const svg = renderBadge(snapshotWith([2020]));
    expect(svg).toContain('fill="#30363d"');
    expect(svg).toContain('fill="#238636"');
    expect(svg).toContain('>github timeline</text>');
    expect(svg).toContain('>2020 · 1 repo</text>');
  });

  it('gera badge cinza sem snapshot', () => {
    const svg = renderBadge(null);
    expect(svg).toContain('não encontrado');
    expect(svg).toContain('fill="#6e7781"');
  });
});
