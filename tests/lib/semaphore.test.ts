import { describe, expect, it } from 'vitest';
import { Semaphore } from '../../src/lib/semaphore.js';

/** Tarefa que só termina quando o teste manda. */
function gate() {
  let open: () => void = () => {};
  const done = new Promise<void>((resolve) => (open = resolve));
  return { done, open };
}

describe('Semaphore', () => {
  it('roda no máximo `limit` tarefas e libera na ordem de chegada', async () => {
    const slots = new Semaphore(2);
    const started: string[] = [];
    const gates = { a: gate(), b: gate(), c: gate() };
    const run = (name: keyof typeof gates) =>
      slots.run(async () => {
        started.push(name);
        await gates[name].done;
      });
    const all = [run('a'), run('b'), run('c')];
    await Promise.resolve();
    expect(started).toEqual(['a', 'b']);
    expect(slots.waiting).toBe(1);
    gates.a.open();
    await all[0];
    await Promise.resolve();
    expect(started).toEqual(['a', 'b', 'c']);
    gates.b.open();
    gates.c.open();
    await Promise.all(all);
    expect(slots.isFull).toBe(false);
  });

  it('libera a vaga mesmo quando a tarefa falha', async () => {
    const slots = new Semaphore(1);
    await expect(slots.run(() => Promise.reject(new Error('x')))).rejects.toThrow('x');
    expect(await slots.run(async () => 'ok')).toBe('ok');
  });

  it('rejeita limite inválido informando o valor', () => {
    expect(() => new Semaphore(0)).toThrow('recebido limite 0');
  });
});
