import { describe, expect, it } from 'vitest';
import { buildAchievements, recordYear } from '../../src/domain/achievements.js';
import type { Repo } from '../../src/domain/types.js';
import { repoIn } from '../fakes/repo-factory.js';

const NOW = new Date('2026-09-30T00:00:00Z');
const byId = (repos: Repo[]) => new Map(buildAchievements(repos, NOW).map((a) => [a.id, a]));

describe('buildAchievements', () => {
  it('desbloqueia primeiro repo, estrelas e fork', () => {
    const repos = [
      repoIn(2014, { name: 'old', stars: 2 }),
      repoIn(2015, { name: 'big', stars: 1500, firstForkAt: '2015-08-01T00:00:00Z' }),
      repoIn(2013, { name: 'fork', isFork: true, stars: 99999 }),
    ];
    const achievements = byId(repos);
    expect(achievements.get('primeiro-repo')?.detail).toBe('jun 2013');
    expect(achievements.get('estrelado')?.detail).toBe('repo mais antigo com ★: old');
    expect(achievements.get('stars-100')?.detail).toBe('big');
    expect(achievements.get('stars-1000')?.unlocked).toBe(true);
    expect(achievements.get('primeiro-fork')?.detail).toBe('recebido · 2015');
    expect(achievements.get('uma-decada')?.unlocked).toBe(true);
  });

  it('mostra progresso das bloqueadas', () => {
    const repos = [repoIn(2024, { language: 'Go', topics: ['a', 'b'], stars: 40 })];
    const achievements = byId(repos);
    expect(achievements.get('stars-100')).toMatchObject({ unlocked: false, detail: '40 de 100 ★' });
    expect(achievements.get('poliglota')?.detail).toBe('1 de 5 linguagens');
    expect(achievements.get('topics-50')?.detail).toBe('2 de 50');
    expect(achievements.get('uma-decada')?.detail).toBe('faltam 8 anos');
    expect(achievements.get('primeiro-fork')?.unlocked).toBe(false);
  });

  it('calcula as marcas dos discos', () => {
    const languages = ['Go', 'Rust', 'C', 'Zig', 'Lua', 'Ruby'];
    const repos = languages.map((language) => repoIn(2020, { language }));
    const achievements = byId(repos);
    expect(achievements.get('poliglota')).toMatchObject({ unlocked: true, mark: '6×' });
    expect(achievements.get('ano-recorde')).toMatchObject({ detail: '2020', mark: '6' });
    expect(achievements.get('stars-100')).toMatchObject({ mark: '100', tone: 'gold' });
  });

  it('mantém a ordem do catálogo', () => {
    expect(buildAchievements([], NOW).map((a) => a.id)).toEqual([
      'primeiro-repo',
      'estrelado',
      'stars-100',
      'stars-1000',
      'primeiro-fork',
      'poliglota',
      'ano-recorde',
      'uma-decada',
      'topics-50',
    ]);
  });
});

describe('recordYear', () => {
  it('escolhe o ano com mais repos, o mais antigo no empate', () => {
    expect(recordYear([repoIn(2019), repoIn(2020), repoIn(2020), repoIn(2021), repoIn(2021)])).toBe(
      2020,
    );
    expect(recordYear([])).toBeNull();
  });
});
