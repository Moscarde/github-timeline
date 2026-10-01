import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config.js';
import { avatarUrl } from '../../src/lib/avatar.js';
import { escapeMarkup } from '../../src/lib/escape.js';
import { JsonLogger } from '../../src/lib/logger.js';
import { parseTheme, resolveThemePreference } from '../../src/lib/theme.js';
import { ProgressHub, type ProgressEvent } from '../../src/services/progress-hub.js';

describe('escapeMarkup', () => {
  it('escapa os cinco caracteres especiais', () => {
    expect(escapeMarkup(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});

describe('avatarUrl', () => {
  it('acrescenta o tamanho', () => {
    expect(avatarUrl('https://a/u/1?v=4', 64)).toBe('https://a/u/1?v=4&s=64');
    expect(avatarUrl('https://a/u/1', 64)).toBe('https://a/u/1?s=64');
  });
});

describe('tema', () => {
  it('query vence cookie e valores desconhecidos são ignorados', () => {
    expect(parseTheme('azul')).toBeNull();
    expect(resolveThemePreference('claro', 'escuro')).toBe('claro');
    expect(resolveThemePreference(undefined, 'escuro')).toBe('escuro');
    expect(resolveThemePreference('x', undefined)).toBe('auto');
  });
});

describe('loadConfig', () => {
  it('exige token e valida a porta', () => {
    expect(() => loadConfig({})).toThrow('GITHUB_TOKEN');
    expect(() => loadConfig({ GITHUB_TOKEN: 't', PORT: 'abc' })).toThrow('recebido "abc"');
    expect(loadConfig({ GITHUB_TOKEN: ' t ', PORT: '8080' })).toEqual({
      githubToken: 't',
      port: 8080,
      databasePath: 'timeline.db',
      visitSalt: null,
    });
  });
});

describe('JsonLogger', () => {
  it('escreve uma linha JSON por evento', () => {
    const lines: string[] = [];
    new JsonLogger(
      (line) => lines.push(line),
      () => new Date('2026-01-01T00:00:00Z'),
    ).log('info', 'x.y', { username: 'dev' });
    expect(JSON.parse(lines[0] ?? '')).toEqual({
      time: '2026-01-01T00:00:00.000Z',
      level: 'info',
      event: 'x.y',
      username: 'dev',
    });
  });
});

describe('ProgressHub', () => {
  it('entrega por username, sem diferenciar maiúsculas, e permite cancelar', () => {
    const hub = new ProgressHub();
    const received: ProgressEvent[] = [];
    const stop = hub.subscribe('Dev', (event) => received.push(event));
    hub.publish('dev', { type: 'done' });
    hub.publish('other', { type: 'done' });
    stop();
    hub.publish('dev', { type: 'done' });
    expect(received).toHaveLength(1);
  });
});
