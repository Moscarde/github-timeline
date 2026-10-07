import { describe, expect, it } from 'vitest';
import type { FC } from 'hono/jsx';
import {
  LocaleContext,
  storedText,
  useLocale,
  viewMessage,
  viewText,
} from '../../src/i18n/view.js';
import {
  formatCompact,
  formatInteger,
  formatMonthYear,
  formatPercent,
  formatRatio,
  joinPt,
  monthNames,
  plural,
} from '../../src/i18n/view-format.js';

const FormattingProbe: FC = () => (
  <p>
    {[
      useLocale(),
      viewText('Copiar'),
      viewMessage('às {0}', ['12:00']),
      storedText('Entram Go e Rust'),
      formatCompact(1400),
      formatInteger(1234),
      formatMonthYear('2026-02-01'),
      formatPercent(0.417),
      formatRatio(3.62),
      joinPt(['Go', 'Rust']),
      monthNames()[1]!,
      plural(2, 'ano', 'anos'),
    ].join('|')}
  </p>
);

describe('view locale context', () => {
  it('uses Portuguese by default', () => {
    expect((<FormattingProbe />).toString()).toBe(
      '<p>pt-BR|Copiar|às 12:00|Entram Go e Rust|1,4k|1.234|fev 2026|41,7%|3,6×|Go e Rust|fev|2 anos</p>',
    );
  });

  it('provides English for all helpers and leaves the default context intact', () => {
    expect(
      (
        <LocaleContext.Provider value="en">
          <FormattingProbe />
        </LocaleContext.Provider>
      ).toString(),
    ).toBe(
      '<p>en|Copy|at 12:00|Introducing Go and Rust|1.4k|1,234|Feb 2026|41.7%|3.6×|Go and Rust|Feb|2 years</p>',
    );
    expect((<FormattingProbe />).toString()).toContain('pt-BR|Copiar');
  });
});
