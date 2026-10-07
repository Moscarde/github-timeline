import { clientMessages } from '../../src/i18n/client.js';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

type ClientListener = (event: { target: FakeElement }) => void;

/** Minimal named DOM fake for client interaction tests. */
export class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly dataset: Record<string, string> = {};
  textContent = '';
  previousElementSibling: { hidden: boolean } | null = null;

  constructor(private readonly selector = '') {}

  /** Find the clicked control. @example button.closest('button') */
  closest(): FakeElement {
    return this;
  }

  /** Match a control's application selector. @example button.matches('[data-toggle-repos]') */
  matches(selector: string): boolean {
    return selector === this.selector;
  }

  /** Record accessibility state. @example button.setAttribute('aria-expanded', 'true') */
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

/** Native select whose form records submissions. */
export class FakeLanguageSelect extends FakeElement {
  submissions = 0;
  readonly form = {
    requestSubmit: (): void => {
      this.submissions += 1;
    },
  };

  constructor() {
    super('[data-language-select]');
  }
}

/** Browser dependencies with no real clipboard or timers. */
export class FakeClientBrowser {
  readonly listeners = new Map<string, ClientListener>();
  readonly copied: string[] = [];
  rejectClipboard = false;
  readonly clipboard = {
    writeText: async (value: string): Promise<void> => {
      if (this.rejectClipboard) throw new Error('clipboard unavailable');
      this.copied.push(value);
    },
  };
  readonly document = {
    documentElement: { lang: 'en', dataset: { theme: 'dark' } },
    body: { dataset: { messages: '{}' } },
    addEventListener: (event: string, listener: ClientListener): void => {
      this.listeners.set(event, listener);
    },
    querySelectorAll: (): FakeElement[] => [],
    querySelector: (): null => null,
  };

  /** Run the real asset against these browser dependencies. @example browser.load() */
  load(): void {
    const locale = this.document.documentElement.lang === 'en' ? 'en' : 'pt-BR';
    this.document.body.dataset.messages = JSON.stringify(clientMessages(locale));
    const script = readFileSync(new URL('../../public/assets/app.js', import.meta.url), 'utf8');
    runInNewContext(script, {
      document: this.document,
      navigator: { clipboard: this.clipboard },
      Element: FakeElement,
      HTMLSelectElement: FakeLanguageSelect,
      setTimeout: this.recordTimer,
      clearTimeout: this.clearTimer,
    });
  }

  /** Dispatch browser events to the installed listener. @example browser.dispatch('change', select) */
  dispatch(event: string, target: FakeElement): void {
    this.listeners.get(event)?.({ target });
  }

  private recordTimer(): number {
    return 1;
  }

  private clearTimer(): void {
    // Tests observe the immediate feedback without waiting for its reset timer.
  }
}
