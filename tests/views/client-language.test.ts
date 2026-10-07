import { setImmediate } from 'node:timers/promises';
import { describe, expect, it } from 'vitest';
import { FakeClientBrowser, FakeElement, FakeLanguageSelect } from '../fakes/client-browser.js';

describe('localized browser interactions', () => {
  it('submits the native language form when its selection changes', () => {
    const browser = new FakeClientBrowser();
    browser.load();
    const select = new FakeLanguageSelect();
    browser.dispatch('change', select);
    browser.dispatch('change', new FakeElement());
    expect(select.submissions).toBe(1);
  });

  it.each([
    ['en', 'Copied ✓'],
    ['pt-BR', 'Copiado ✓'],
  ])('copies with %s feedback', async (locale, label) => {
    const browser = new FakeClientBrowser();
    browser.document.documentElement.lang = locale;
    browser.load();
    const button = new FakeElement();
    button.dataset.copyText = 'https://example.com?lang=en';
    button.textContent = 'Copy';
    browser.dispatch('click', button);
    await setImmediate();
    expect(browser.copied).toEqual(['https://example.com?lang=en']);
    expect(button.textContent).toBe(label);
  });

  it('translates clipboard failure and expanded repository feedback', async () => {
    const browser = new FakeClientBrowser();
    browser.rejectClipboard = true;
    browser.load();
    const copy = new FakeElement();
    copy.dataset.copyText = 'copy me';
    browser.dispatch('click', copy);
    await setImmediate();
    expect(copy.textContent).toBe('Select and copy');
    const more = new FakeElement('[data-toggle-repos]');
    more.textContent = '+ 3 repositories';
    more.previousElementSibling = { hidden: true };
    browser.dispatch('click', more);
    expect(more.textContent).toBe('Show less');
    expect(more.attributes.get('aria-expanded')).toBe('true');
    browser.dispatch('click', more);
    expect(more.textContent).toBe('+ 3 repositories');
  });
});
