import { describe, expect, it } from 'vitest';
import { frameworkForTopic, frameworksOf } from '../../src/domain/frameworks.js';

describe('frameworks', () => {
  it('casa aliases ignorando maiúsculas', () => {
    expect(frameworkForTopic('ReactJS')).toBe('React');
    expect(frameworkForTopic('ruby-on-rails')).toBe('Rails');
  });

  it('não aceita topics genéricos', () => {
    for (const topic of ['next', 'spring', 'nodejs', 'web'])
      expect(frameworkForTopic(topic)).toBeNull();
  });

  it('conta aliases do mesmo framework uma vez', () => {
    expect(frameworksOf(['vue', 'vuejs', 'django', 'cli'])).toEqual(['Vue', 'Django']);
  });
});
