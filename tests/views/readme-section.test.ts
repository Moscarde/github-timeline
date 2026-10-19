import { describe, expect, it } from 'vitest';
import { badgeSnippet, embedSnippet } from '../../src/views/readme/readme-snippets.js';
import { createAppHarness } from '../fakes/app-harness.js';
import { careerProfile } from '../fakes/career-profile.js';
import { makeAccount } from '../fakes/repo-factory.js';

const landing = async (query = '') => {
  const { app } = createAppHarness();
  return (await app.request(`/${query}`)).text();
};

describe('seção "Leve sua timeline para o README"', () => {
  it('mostra todos os formatos de uma vez, sem abas, com o badge por último', async () => {
    const html = await landing();
    expect(html).toContain('Digite seu usuário para ver as prévias com os seus dados');
    expect(html).not.toContain('Crie um repositório público');
    expect(html).not.toContain('role="tabpanel" id="painel-readme-');
    expect(html).not.toMatch(/id="readme-[a-z]+" [^>]*hidden/);
    const order = ['trilha', 'linguagens', 'conquistas', 'badge'].map((id) =>
      html.indexOf(`id="readme-${id}"`),
    );
    expect(order.every((position) => position > 0)).toBe(true);
    expect([...order].sort((x, y) => x - y)).toEqual(order);
  });

  it('cada formato tem título em cima e prévia e código lado a lado', async () => {
    const html = await landing();
    const block = html.slice(
      html.indexOf('id="readme-trilha"'),
      html.indexOf('id="readme-linguagens"'),
    );
    expect(block).toContain('<h3 id="readme-trilha-titulo">Trilha da carreira</h3>');
    const body = block.slice(block.indexOf('class="readme-item-body"'));
    expect(block.indexOf('<h3')).toBeLessThan(block.indexOf('class="readme-item-body"'));
    expect(body.indexOf('readme-preview')).toBeLessThan(body.indexOf('code-panel'));
  });

  it('prévia dos embeds traz as duas versões de tema do perfil de exemplo', async () => {
    const html = await landing();
    expect(html).toContain('src="/exemplos/trilha.svg?lang=pt-BR&amp;tema=escuro"');
    expect(html).toContain('src="/exemplos/trilha.svg?lang=pt-BR&amp;tema=claro"');
    expect(html).toContain('class="only-light"');
  });

  it('copia o markdown do embed e traz os ids das conquistas como caixas de seleção', async () => {
    const html = await landing();
    expect(html).toContain(
      'data-copy-text="[![Conquistas](https://github-timeline.frangolab.com/embed/seu-usuario/conquistas.svg?lang=pt-BR)]',
    );
    expect(html).toContain(
      '<input class="sr-only" type="checkbox" checked="" data-achievement-id="poliglota"/>',
    );
    expect(html).toContain('Marque as conquistas que entram no embed:');
    expect(html).toContain('<span class="ink">seu-usuario</span>');
  });

  it('mostra as opções comuns uma vez só, no topo', async () => {
    const html = await landing();
    expect(html.match(/tema=escuro\|claro/g)).toHaveLength(1);
    expect(html.indexOf('tema=escuro|claro')).toBeLessThan(html.indexOf('id="readme-trilha"'));
  });

  it('traduz textos e placeholder', async () => {
    const html = await landing('?lang=en');
    expect(html).toContain('Add your timeline to your README');
    expect(html).toContain('/embed/your-username/trilha.svg?lang=en');
    expect(html).toContain('Career trail');
  });

  it('carrega a folha de estilo da seção', async () => {
    expect(await landing()).toContain('rel="stylesheet" href="/assets/css/readme.css"');
  });
});

describe('snippets do README', () => {
  it('badge em markdown com link para a timeline', () => {
    expect(badgeSnippet('ana', 'en')).toBe(
      '[![GitHub Timeline](https://github-timeline.frangolab.com/badge/ana.svg?lang=en)](https://github-timeline.frangolab.com/u/ana?lang=en)',
    );
  });

  it('embed em markdown com link para a timeline', () => {
    const snippet = embedSnippet({
      kind: 'linguagens',
      username: 'ana',
      locale: 'pt-BR',
      alt: 'Rio',
    });
    expect(snippet).toBe(
      '[![Rio](https://github-timeline.frangolab.com/embed/ana/linguagens.svg?lang=pt-BR)](https://github-timeline.frangolab.com/u/ana?lang=pt-BR)',
    );
  });
});

describe('montador interativo da seção', () => {
  it('carrega o script e um campo de usuário acima de cada código', async () => {
    const html = await landing();
    expect(html).toContain('<script type="module" src="/assets/readme-builder.js"></script>');
    expect(html.match(/data-readme-user=""/g)).toHaveLength(4);
    const column = html.slice(html.indexOf('class="readme-code-column"'));
    expect(column.indexOf('data-readme-user')).toBeLessThan(column.indexOf('code-panel'));
  });

  it('entrega os modelos de prévia e de código com o placeholder', async () => {
    const html = await landing();
    expect(html).toContain('data-placeholder="seu-usuario"');
    expect(html).toContain(
      'data-live="/embed/seu-usuario/conquistas.svg?lang=pt-BR&amp;tema=claro"',
    );
    expect(html).toContain('data-example="/exemplos/linguagens.svg?lang=pt-BR&amp;tema=escuro"');
    expect(html).toContain('data-badge-live="/badge/seu-usuario.svg?lang=pt-BR"');
    expect(html).toContain(
      'data-template="[![Trilha da carreira](https://github-timeline.frangolab.com/embed/seu-usuario/trilha.svg?lang=pt-BR)',
    );
  });

  it('só o primeiro status é anunciado a leitores de tela', async () => {
    const html = await landing();
    expect(html.match(/aria-live="polite"/g)).toHaveLength(1);
  });

  it('as mensagens do script vêm traduzidas no catálogo do cliente', async () => {
    const html = await landing('?lang=en');
    expect(html).toContain('Building the timeline for @{0}…');
  });

  it('trilha tem selects de paleta e estilo, o rio só de paleta, na coluna do código', async () => {
    const html = await landing();
    expect(html).toContain(
      '<select id="readme-paleta-trilha" data-setting-for="trilha" data-param="paleta">',
    );
    expect(html).toContain(
      '<select id="readme-estilo-trilha" data-setting-for="trilha" data-param="estilo">',
    );
    expect(html).toContain('<option value="compacto">Ocultar (versão compacta)</option>');
    expect(html).not.toContain('readme-estilo-linguagens');
    expect(html).toContain(
      '<option value="roxo">Roxo</option><option value="verde">Verde</option>',
    );
    expect(html).toContain(
      '<select id="readme-paleta-linguagens" data-setting-for="linguagens" data-param="paleta">',
    );
    expect(html).toContain('<option value="por-do-sol">Pôr do sol</option>');
    expect(html).not.toContain('readme-paleta-conquistas');
    expect(html).not.toContain('type="radio"');
    const column = html.slice(html.indexOf('id="readme-trilha"'));
    expect(column.indexOf('data-readme-user')).toBeLessThan(column.indexOf('readme-paleta-trilha'));
    expect(column.indexOf('readme-paleta-trilha')).toBeLessThan(column.indexOf('code-panel'));
  });
});

describe('seção do README na página do perfil', () => {
  const profilePage = async (path = '/u/ana') => {
    const harness = createAppHarness();
    harness.addProfile(careerProfile('ana'));
    harness.addProfile(careerProfile('bia'));
    return (await harness.app.request(path)).text();
  };

  it('aparece abaixo da linha do tempo, já com o usuário da página', async () => {
    const html = await profilePage();
    expect(html).toContain('id="readme"');
    expect(html.indexOf('id="linha-do-tempo"')).toBeLessThan(html.indexOf('id="readme"'));
    expect(html).toContain('data-username="ana"');
    expect(html).toContain('Prévias com os dados de @ana.');
    expect(html).toContain('value="ana" data-readme-user=""');
  });

  it('prévias e códigos já usam o perfil real', async () => {
    const html = await profilePage();
    expect(html).toMatch(/src="\/embed\/ana\/trilha\.svg\?lang=pt-BR&amp;tema=escuro&amp;v=[^"]+"/);
    expect(html).toContain(
      'data-copy-text="[![Trilha da carreira](https://github-timeline.frangolab.com/embed/ana/trilha.svg?lang=pt-BR)',
    );
    expect(html).toContain('<span class="ink">ana</span>');
    expect(html).toMatch(/src="\/badge\/ana\.svg\?lang=pt-BR&amp;v=[^"]+"/);
  });

  it('o modelo continua com o placeholder, para o visitante trocar de usuário', async () => {
    const html = await profilePage();
    expect(html).toContain('data-live="/embed/seu-usuario/trilha.svg?lang=pt-BR&amp;tema=escuro"');
  });

  it('não aparece na comparação entre perfis', async () => {
    expect(await profilePage('/u/ana...bia')).not.toContain('data-readme-builder');
  });

  it('não aparece para organizações, que não têm linha do tempo', async () => {
    const harness = createAppHarness();
    harness.addProfile({
      ...careerProfile('org'),
      account: makeAccount({ username: 'org', type: 'Organization' }),
    });
    expect(await (await harness.app.request('/u/org')).text()).not.toContain('data-readme-builder');
  });
});
