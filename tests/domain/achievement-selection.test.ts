import { describe, expect, it } from 'vitest';
import {
  parseAchievementSelection,
  selectAchievements,
} from '../../src/domain/achievement-selection.js';
import { careerSnapshot } from '../fakes/career-profile.js';

describe('parseAchievementSelection', () => {
  it('aceita vírgula ou +, sem diferenciar maiúsculas, mantendo a ordem', () => {
    expect(parseAchievementSelection('Poliglota+ano-recorde,topics-50.svg')).toEqual({
      ok: true,
      ids: ['poliglota', 'ano-recorde', 'topics-50'],
    });
  });

  it('ignora repetidos e vírgulas sobrando', () => {
    expect(parseAchievementSelection('estrelado,,estrelado,.svg')).toEqual({
      ok: true,
      ids: ['estrelado'],
    });
  });

  it('rejeita ids desconhecidos informando o que recebeu', () => {
    expect(parseAchievementSelection('poliglota,dragao.svg')).toEqual({
      ok: false,
      received: 'poliglota,dragao',
      unknown: ['dragao'],
    });
  });

  it('rejeita seleção vazia', () => {
    expect(parseAchievementSelection('.svg')).toMatchObject({ ok: false, received: '' });
  });
});

describe('selectAchievements', () => {
  it('devolve as conquistas do snapshot na ordem pedida', () => {
    const selected = selectAchievements(careerSnapshot().achievements, [
      'topics-50',
      'primeiro-repo',
    ]);
    expect(selected.map((achievement) => achievement.id)).toEqual(['topics-50', 'primeiro-repo']);
  });
});
