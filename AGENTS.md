## Estilo de código

- Funções: 4–20 linhas. Divida se ultrapassar.
- Arquivos: até 500 linhas. Separe por responsabilidade.
- Uma responsabilidade por função e módulo (SRP).
- Nomes específicos e descritivos. Evite `data`, `handler`, `manager`.
- TypeScript: tipos explícitos. Evite `any` e funções sem tipagem.
- Não duplique código. Extraia lógica compartilhada.
- Prefira retornos antecipados a `if` aninhados. Máximo de 2 níveis.
- Erros devem informar o valor recebido e o formato esperado.

## Comentários

- Preserve comentários existentes durante refatorações.
- Explique **por que**, não **o que** o código faz.
- Funções públicas devem ter JSDoc curto com intenção e exemplo de uso.
- Referencie issue ou commit quando houver código motivado por bug ou limitação externa.

## Testes

- Todos os testes devem rodar com um único comando: `npm test`.
- Toda nova função deve possuir teste.
- Correções de bugs devem incluir teste de regressão.
- Mocke API, banco e filesystem com fakes nomeados, evitando stubs inline.
- Testes devem ser rápidos, independentes, repetíveis e autoavaliáveis.

## Dependências

- Injete dependências por parâmetros ou construtores. Evite estado global.
- Encapsule bibliotecas externas atrás de interfaces/módulos do projeto.

## Estrutura

- Siga as convenções do framework utilizado, como Express, NestJS ou Next.js.
- Prefira módulos pequenos e focados.
- Use caminhos previsíveis, como `src/`, `lib/`, `tests/`, `controllers/` e `services/`.

## Formatação

- Use `Prettier` e o linter configurado no projeto.
- Não altere estilo manualmente quando o formatter puder fazê-lo.

## Logs

- Use logs estruturados em JSON para observabilidade e depuração.
- Use texto simples apenas para saídas de CLI destinadas ao usuário.
