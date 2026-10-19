import { describe, expect, it } from 'vitest';
import { createAppHarness } from '../fakes/app-harness.js';
import { careerProfile } from '../fakes/career-profile.js';
import { makeAccount } from '../fakes/repo-factory.js';

async function harnessWith(username = 'dev') {
  const harness = createAppHarness();
  harness.addProfile(careerProfile(username));
  await harness.app.request(`/api/profile/${username}`);
  return harness;
}

describe('embeds', () => {
  it.each(['trilha.svg', 'linguagens.svg', 'conquistas.svg', 'conquistas/poliglota.svg'])(
    'GET /embed/dev/%s serve SVG do snapshot com cache de 1 h',
    async (file) => {
      const { app } = await harnessWith();
      const response = await app.request(`/embed/dev/${file}`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/svg+xml; charset=utf-8');
      expect(response.headers.get('cache-control')).toBe('max-age=3600');
      expect(await response.text()).toMatch(/^<svg /);
    },
  );

  it('aceita ?tema=claro e ?lang=en', async () => {
    const { app } = await harnessWith();
    const svg = await (await app.request('/embed/dev/trilha.svg?tema=claro&lang=en')).text();
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('contributions');
  });

  it('desenha só as conquistas escolhidas no path, na ordem pedida', async () => {
    const { app } = await harnessWith();
    const svg = await (
      await app.request('/embed/dev/conquistas/topics-50,primeiro-repo.svg')
    ).text();
    expect(svg.indexOf('>50 topics</text>')).toBeLessThan(svg.indexOf('>Primeiro repo</text>'));
    expect(svg).not.toContain('>Poliglota</text>');
  });

  it('seleção inválida responde 400 com o valor recebido e os ids aceitos', async () => {
    const { app } = await harnessWith();
    const response = await app.request('/embed/dev/conquistas/dragao.svg');
    const svg = await response.text();
    expect(response.status).toBe(400);
    expect(svg).toContain('recebido &quot;dragao&quot;');
    expect(svg).toContain('primeiro-repo');
  });

  it('username inválido responde 400 explicando o formato', async () => {
    const { app } = createAppHarness();
    const response = await app.request('/embed/-x-/trilha.svg');
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('username inválido');
  });

  it('sem snapshot dispara a coleta e responde aviso com cache curto', async () => {
    const harness = createAppHarness();
    harness.addProfile(careerProfile('ana'));
    const response = await harness.app.request('/embed/ana/trilha.svg');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('max-age=60');
    expect(await response.text()).toContain('Gerando a timeline de @ana');
    expect(harness.collector.calls).toBe(1);
  });

  it('organização sem linha do tempo recebe aviso em vez de grade vazia', async () => {
    const harness = createAppHarness();
    harness.addProfile({
      ...careerProfile('org'),
      account: makeAccount({ username: 'org', type: 'Organization' }),
      repos: [],
      months: {},
    });
    await harness.app.request('/api/profile/org');
    expect(await (await harness.app.request('/embed/org/linguagens.svg')).text()).toContain(
      'não tem linha do tempo',
    );
  });

  it('registra falha inesperada da coleta sem derrubar o processo', async () => {
    const harness = createAppHarness();
    harness.collector.failure = new Error('falha inesperada');
    expect((await harness.app.request('/embed/ghost/conquistas.svg')).status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(harness.logger.events()).toContain('embed.collection_failed');
  });

  it('conta como evento "embed" nas estatísticas', async () => {
    const harness = await harnessWith();
    await harness.app.request('/embed/dev/trilha.svg');
    expect(harness.visitStore.events.map(({ event }) => event)).toContain('embed');
  });
});

describe('prévias da landing', () => {
  it('GET /exemplos/<embed>.svg desenha o perfil de exemplo com cache de um dia', async () => {
    const { app, collector } = createAppHarness();
    const response = await app.request('/exemplos/trilha.svg?tema=claro');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('max-age=86400');
    const svg = await response.text();
    expect(svg).toContain('Trilha da carreira de seu-usuario');
    expect(svg).toContain('fill="#ffffff"');
    expect(collector.calls).toBe(0);
  });

  it('traduz o username de exemplo', async () => {
    const { app } = createAppHarness();
    const svg = await (await app.request('/exemplos/conquistas.svg?lang=en')).text();
    expect(svg).toContain('your-username');
  });

  it('embed desconhecido responde 404', async () => {
    const { app } = createAppHarness();
    expect((await app.request('/exemplos/foguete.svg')).status).toBe(404);
    expect((await app.request('/embed/dev/foguete.svg')).status).toBe(404);
  });
});

describe('cabeçalhos das imagens embedáveis', () => {
  it.each(['/embed/dev/trilha.svg', '/exemplos/linguagens.svg', '/badge/dev.svg'])(
    '%s libera o <style> da animação e o uso em outros sites',
    async (path) => {
      const { app } = await harnessWith();
      const response = await app.request(path);
      const csp = response.headers.get('content-security-policy') ?? '';
      expect(csp).toContain("style-src 'unsafe-inline'");
      expect(csp).toContain("default-src 'none'");
      expect(response.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
    },
  );

  it('páginas mantêm a CSP restritiva', async () => {
    const { app } = createAppHarness();
    const response = await app.request('/');
    expect(response.headers.get('content-security-policy')).toContain("style-src 'self'");
    expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin');
  });
});

describe('prévia de conquistas escolhidas', () => {
  it('GET /exemplos/conquistas/<ids>.svg desenha só as escolhidas do perfil de exemplo', async () => {
    const { app } = createAppHarness();
    const response = await app.request('/exemplos/conquistas/poliglota,topics-50.svg');
    expect(response.status).toBe(200);
    const svg = await response.text();
    expect(svg).toContain('>Poliglota</text>');
    expect(svg).not.toContain('>Primeiro repo</text>');
  });

  it('seleção inválida no exemplo responde 404', async () => {
    const { app } = createAppHarness();
    expect((await app.request('/exemplos/conquistas/dragao.svg')).status).toBe(404);
  });
});

describe('paletas nas rotas', () => {
  it('?paleta= muda a trilha do perfil e a prévia de exemplo', async () => {
    const { app } = await harnessWith();
    const live = await (await app.request('/embed/dev/trilha.svg?paleta=azul&tema=claro')).text();
    expect(live).toContain('fill="#0a3069" class="anim"');
    const example = await (await app.request('/exemplos/linguagens.svg?paleta=por-do-sol')).text();
    expect(example).toContain('fill="#f97316" stroke');
  });

  it('paleta desconhecida usa a padrão', async () => {
    const { app } = await harnessWith();
    const svg = await (await app.request('/embed/dev/trilha.svg?paleta=arco-iris')).text();
    expect(svg).toContain('fill="#c297ff" class="anim"');
  });
});

describe('estilo da trilha nas rotas', () => {
  it('?estilo=compacto tira as descrições no perfil e no exemplo', async () => {
    const { app } = await harnessWith();
    expect(await (await app.request('/embed/dev/trilha.svg')).text()).toContain('Entram');
    expect(await (await app.request('/embed/dev/trilha.svg?estilo=compacto')).text()).not.toContain(
      'Entram',
    );
    expect(await (await app.request('/embed/dev/trilha.svg?estilo=sei-la')).text()).toContain(
      'Entram',
    );
  });
});
