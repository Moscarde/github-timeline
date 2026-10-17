import { clientMessages } from '../../src/i18n/client.js';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

type ClientListener = (event: FakeClientEvent) => void;

/** Named keyboard/click event with observable default prevention. */
export class FakeClientEvent {
  prevented = false;

  constructor(
    readonly target: FakeElement,
    readonly key?: string,
  ) {}

  /** Record canceled browser behavior. @example event.preventDefault() */
  preventDefault(): void {
    this.prevented = true;
  }
}

/** Minimal named DOM fake for client interaction tests. */
export class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly dataset: Record<string, string> = {};
  textContent = '';
  focused = false;
  parentElement: FakeTabList | null = null;
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

  /** Read a control's linked panel. @example tab.getAttribute('aria-controls') */
  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  /** Record keyboard focus. @example tab.focus() */
  focus(): void {
    this.focused = true;
  }

  /** Record accessibility state. @example button.setAttribute('aria-expanded', 'true') */
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

/** Named tab group to verify that switching stays scoped to its siblings. */
export class FakeTabList {
  constructor(readonly tabs: FakeElement[]) {
    for (const tab of tabs) tab.parentElement = this;
  }

  /** Return this group's tabs. @example list.querySelectorAll('[role="tab"]') */
  querySelectorAll(): FakeElement[] {
    return this.tabs;
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
  readonly panels = new Map<string, { hidden: boolean }>();
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
    getElementById: (id: string): { hidden: boolean } | undefined => this.panels.get(id),
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
  dispatch(event: string, target: FakeElement, key?: string): FakeClientEvent {
    const dispatched = new FakeClientEvent(target, key);
    this.listeners.get(event)?.(dispatched);
    return dispatched;
  }

  private recordTimer(): number {
    return 1;
  }

  private clearTimer(): void {
    // Tests observe the immediate feedback without waiting for its reset timer.
  }
}
