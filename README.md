# Organograma Agência

Projeto web simples em HTML, CSS e JavaScript puro para visualizar um organograma a partir de um arquivo CSV.

## Como rodar

1. Abra a pasta do projeto no terminal.
2. Sirva os arquivos com um servidor local, por exemplo:
   ```bash
   python -m http.server
   ```
   ou
   ```bash
   npx serve
   ```
3. Abra o `index.html` pelo endereço do servidor local.

## Como editar o CSV

- Edite somente o arquivo [`data/org.csv`](./data/org.csv).
- O arquivo é a fonte única dos dados.
- O organograma usa `id` como identificador e `parent_id` como vínculo hierárquico.

## Como testar a atualização automática

1. Deixe a página aberta no navegador.
2. Edite e salve o arquivo [`data/org.csv`](./data/org.csv).
3. Aguarde até 2 segundos.
4. A visualização deve atualizar sozinha, sem recarregar a página manualmente.