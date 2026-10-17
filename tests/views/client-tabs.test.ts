import { describe, expect, it } from 'vitest';
import { FakeClientBrowser, FakeElement, FakeTabList } from '../fakes/client-browser.js';

/** Build independent gallery and comparison tabs. @example makeTabs(browser, 'years') */
function makeTabs(browser: FakeClientBrowser, prefix: string): FakeTabList {
  const tabs = [0, 1].map((index) => {
    const tab = new FakeElement('[role="tab"]');
    tab.dataset.tab = `${prefix}-${index}`;
    tab.setAttribute('aria-controls', tab.dataset.tab);
    tab.setAttribute('aria-selected', String(index === 0));
    browser.panels.set(tab.dataset.tab, { hidden: index !== 0 });
    return tab;
  });
  return new FakeTabList(tabs);
}

describe('client tabs', () => {
  it('switches panels in both directions without affecting other tab groups', () => {
    const browser = new FakeClientBrowser();
    const years = makeTabs(browser, 'years');
    const gallery = makeTabs(browser, 'gallery');
    browser.load();
    browser.dispatch('click', years.tabs[1]!);
    expect(browser.panels.get('years-0')?.hidden).toBe(true);
    expect(browser.panels.get('years-1')?.hidden).toBe(false);
    expect(years.tabs[1]!.getAttribute('aria-selected')).toBe('true');
    expect(years.tabs[0]!.getAttribute('tabindex')).toBe('-1');
    expect(gallery.tabs[0]!.getAttribute('aria-selected')).toBe('true');
    expect(browser.panels.get('gallery-0')?.hidden).toBe(false);
    browser.dispatch('click', years.tabs[0]!);
    expect(browser.panels.get('years-0')?.hidden).toBe(false);
    expect(browser.panels.get('years-1')?.hidden).toBe(true);
  });

  it.each([
    ['ArrowRight', 0, 1],
    ['ArrowRight', 1, 0],
    ['ArrowLeft', 0, 1],
    ['ArrowLeft', 1, 0],
    ['Home', 1, 0],
    ['End', 0, 1],
  ])('supports %s from tab %i to tab %i', (key, start, end) => {
    const browser = new FakeClientBrowser();
    const years = makeTabs(browser, 'years');
    browser.load();
    const event = browser.dispatch('keydown', years.tabs[start]!, key);
    expect(event.prevented).toBe(true);
    expect(years.tabs[end]!.focused).toBe(true);
    expect(years.tabs[end]!.getAttribute('aria-selected')).toBe('true');
    expect(years.tabs[end]!.getAttribute('tabindex')).toBe('0');
    expect(browser.panels.get(`years-${end}`)?.hidden).toBe(false);
  });

  it('leaves unrelated keys alone', () => {
    const browser = new FakeClientBrowser();
    const years = makeTabs(browser, 'years');
    browser.load();
    expect(browser.dispatch('keydown', years.tabs[0]!, 'Tab').prevented).toBe(false);
    expect(years.tabs[1]!.focused).toBe(false);
  });
});
