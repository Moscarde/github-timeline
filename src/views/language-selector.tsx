import type { FC } from 'hono/jsx';
import type { Locale } from '../i18n/locale.js';
import { useLocale, viewText } from '../i18n/view.js';

const LANGUAGE_LABELS: Readonly<Record<Locale, string>> = { 'pt-BR': 'Português', en: 'English' };

/** Switch languages with a native form, including without JS. @example <LanguageSelector /> */
export const LanguageSelector: FC = () => (
  <form class="language-form" action="/idioma" method="get">
    <label class="sr-only" for="language">
      {viewText('Idioma')}
    </label>
    <select class="btn language-select" id="language" name="language" data-language-select>
      <LanguageOptions />
    </select>
    <noscript>
      <button class="btn" type="submit">
        {viewText('Aplicar')}
      </button>
    </noscript>
  </form>
);

const LanguageOptions: FC = () => (
  <>
    {(Object.keys(LANGUAGE_LABELS) as Locale[]).map((locale) => (
      <option value={locale} selected={useLocale() === locale} lang={locale}>
        {LANGUAGE_LABELS[locale]}
      </option>
    ))}
    <option value="auto">{viewText('Automático')}</option>
  </>
);
