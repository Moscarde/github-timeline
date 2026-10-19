import { describe, expect, it } from 'vitest';
import { selectAchievements } from '../../src/domain/achievement-selection.js';
import { renderAchievementStrip } from '../../src/embed/achievement-strip.js';
import { localizeSnapshot } from '../../src/i18n/snapshot.js';
import { careerSnapshot } from '../fakes/career-profile.js';

describe('renderAchievementStrip', () => {
  it('mostra todas as conquistas e o placar de desbloqueadas', () => {
    const snapshot = careerSnapshot();
    const unlocked = snapshot.achievements.filter((achievement) => achievement.unlocked).length;
    const svg = renderAchievementStrip({ snapshot, theme: 'escuro', locale: 'pt-BR' });
    expect(svg).toContain(`${unlocked} de 9 desbloqueadas`);
    expect(svg).toContain('width="840"');
    expect(svg).toContain('stroke-dasharray="4 3"');
  });

  it('com seleção, desenha só as escolhidas e encolhe a largura', () => {
    const snapshot = careerSnapshot();
    const selected = selectAchievements(snapshot.achievements, ['poliglota', 'primeiro-repo']);
    const svg = renderAchievementStrip({ snapshot, theme: 'claro', locale: 'pt-BR', selected });
    expect(svg).toContain('width="420"');
    expect(svg).toContain('@dev');
    expect(svg.indexOf('>Poliglota</text>')).toBeLessThan(svg.indexOf('>Primeiro repo</text>'));
    expect(svg).not.toContain('>Uma década</text>');
  });

  it('quebra detalhes longos em duas linhas', () => {
    const snapshot = careerSnapshot();
    const selected = selectAchievements(snapshot.achievements, ['estrelado']);
    const svg = renderAchievementStrip({ snapshot, theme: 'escuro', locale: 'pt-BR', selected });
    expect(svg).toContain('>repo mais</text>');
  });

  it('usa o snapshot localizado', () => {
    const snapshot = localizeSnapshot(careerSnapshot(), 'en');
    const svg = renderAchievementStrip({ snapshot, theme: 'escuro', locale: 'en' });
    expect(svg).toContain('>Achievements');
    expect(svg).toContain('of 9 unlocked');
    expect(svg).toContain('>Polyglot</text>');
  });
});
