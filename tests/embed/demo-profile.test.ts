import { describe, expect, it } from 'vitest';
import { demoSnapshot } from '../../src/embed/demo-profile.js';
import { languageStreams } from '../../src/domain/language-streams.js';

describe('perfil de exemplo das prévias', () => {
  it('cobre 2019–2026 com contribuições em todos os anos', () => {
    const snapshot = demoSnapshot('seu-usuario');
    expect(snapshot.account.username).toBe('seu-usuario');
    expect(snapshot.timeline.map((era) => era.year)).toEqual([
      2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
    ]);
  });

  it('mostra conquistas desbloqueadas e bloqueadas', () => {
    const unlocked = demoSnapshot('x').achievements.map((achievement) => achievement.unlocked);
    expect(unlocked).toContain(true);
    expect(unlocked).toContain(false);
  });

  it('tem linguagens suficientes para encher o rio', () => {
    expect(languageStreams(demoSnapshot('x').timeline).streams.length).toBeGreaterThanOrEqual(6);
  });

  it('é determinístico entre chamadas', () => {
    expect(demoSnapshot('x').generatedAt).toBe(demoSnapshot('x').generatedAt);
  });
});
