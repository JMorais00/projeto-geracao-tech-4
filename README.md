# Drip Store — Projeto Digital College

## 1. Apresentação

O **Drip Store** é um projeto acadêmico de desenvolvimento Front-end criado com **React** e **JavaScript**. A proposta é construir a interface de uma loja virtual de artigos esportivos com base no layout de referência disponibilizado no Figma.

O desenvolvimento foi concentrado nas três páginas principais da atividade:

1. Home;
2. Listagem de Produtos;
3. Visualização do Produto.

A aplicação utiliza componentes reutilizáveis, navegação entre páginas com React Router DOM e estilos organizados com CSS Modules.

## 2. Acesso ao projeto

- **Aplicação publicada:** [Abrir Drip Store na Vercel](https://projeto-geracao-tech-4-2mxrbfmmt-jm-orais00.vercel.app/)
- **Repositório GitHub:** [JMorais00/projeto-geracao-tech-4](https://github.com/JMorais00/projeto-geracao-tech-4)

### Acesso direto às páginas publicadas

| Página                  | Rota         | Link                                                                                      |
| ----------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| Home                    | `/`          | [Abrir Home](https://projeto-geracao-tech-4-2mxrbfmmt-jm-orais00.vercel.app/)             |
| Listagem de Produtos    | `/produtos`  | [Abrir Produtos](https://projeto-geracao-tech-4-2mxrbfmmt-jm-orais00.vercel.app/produtos) |
| Visualização do Produto | `/product/1` | [Abrir Produto](https://projeto-geracao-tech-4-2mxrbfmmt-jm-orais00.vercel.app/product/1) |

As três rotas acima correspondem às páginas implementadas no projeto. A rota `/product/1` utiliza o padrão de parâmetro `/product/:id`.

## 3. Páginas implementadas

### 3.1 Home — `/`

Página inicial da loja. Apresenta:

- Cabeçalho com identidade visual e navegação;
- Campo de pesquisa visual;
- Banner principal com galeria de imagens;
- Seção de coleções em destaque;
- Seção de produtos em alta;
- Cards de produtos;
- Rodapé com informações da loja.

### 3.2 Listagem de Produtos — `/produtos`

Página destinada à apresentação dos produtos disponíveis no projeto. Contém:

- Área de identificação dos resultados;
- Filtros visuais por marca e categoria;
- Opções de ordenação por preço;
- Cards com imagens, nomes e preços;
- Organização dos produtos em uma listagem responsiva.

Os filtros e a ordenação possuem interação com os dados disponíveis nesta versão. Como o projeto utiliza uma quantidade limitada de produtos de exemplo, nem todas as opções de filtro necessariamente apresentarão resultados.

### 3.3 Visualização do Produto — `/product/1`

Página de detalhes do produto. Apresenta:

- Galeria de imagens;
- Nome do produto;
- Categoria, marca e referência;
- Avaliação e quantidade de avaliações;
- Preço;
- Descrição;
- Opções de tamanho;
- Botão de compra apresentado na interface;
- Seção de produtos relacionados.

A seleção de tamanho possui interação visual. O botão de compra faz parte da interface apresentada nesta entrega; não há integração com carrinho, pagamento ou processamento de pedidos.

## 4. Rotas e funcionalidades fora do escopo

O cabeçalho e outras áreas da interface podem apresentar opções adicionais de navegação. Entretanto, **nem todos esses itens correspondem a páginas implementadas**.

A atividade foi desenvolvida com foco nas três páginas principais descritas neste README. Por isso, as páginas adicionais abaixo não fazem parte das funcionalidades entregues:

| Item                    | Caminho previsto | Situação nesta versão |
| ----------------------- | ---------------- | --------------------- |
| Home                    | `/`              | Implementada          |
| Produtos                | `/produtos`      | Implementada          |
| Visualização do Produto | `/product/1`     | Implementada          |
| Categorias              | `/categorias`    | Não implementada      |
| Meus Pedidos            | `/pedidos`       | Não implementada      |
| Entrar                  | `/login`         | Não implementada      |
| Cadastre-se             | `/cadastrar`     | Não implementada      |

**Esclarecimento para avaliação:** as opções **Categorias** e **Meus Pedidos** podem aparecer como elementos de navegação visual, mas suas páginas não foram desenvolvidas nesta entrega, pois não faziam parte do escopo principal definido para a atividade. O mesmo se aplica às páginas de Login e Cadastro. Portanto, esses caminhos não devem ser considerados funcionalidades concluídas ou rotas disponíveis.

Também não foi implementado um fluxo completo de compra, checkout, autenticação de usuários ou gerenciamento de pedidos.

## 5. Tecnologias e ferramentas

- **React:** construção da interface por meio de componentes;
- **JavaScript:** linguagem utilizada no desenvolvimento;
- **Vite:** ambiente de desenvolvimento e ferramenta de build;
- **React Router DOM:** configuração da navegação entre páginas;
- **HTML5:** estrutura da aplicação;
- **CSS3:** estilização;
- **CSS Modules:** organização dos estilos por componente e página;
- **ESLint:** análise estática e verificação de padrões do código;
- **Git e GitHub:** versionamento e hospedagem do código-fonte;
- **Vercel:** publicação da aplicação.

## 6. Organização dos arquivos

A estrutura principal do projeto está organizada da seguinte maneira:

```text
projeto-digital-store/
├── public/
│   ├── home-slide-1.jpeg
│   ├── home-slide-8jpeg
│   ├── collection-1.png
│   ├── collection-2.png
│   ├── collection-3.png
│   ├── product-thumb-1.jpeg
│   └── product-thumb-5.jpeg
│   ├── produc-image-1.jpeg
│   ├── produc-image-5.jpeg
│
├── src/
│   ├── assets/
│   │   └── arquivos SVG e outros recursos importados
│   │
│   ├── components/
│   │   ├── BuyBox/
│   │   ├── FilterGroup/
│   │   ├── Footer/
│   │   ├── Gallery/
│   │   ├── Header/
│   │   ├── Information/
│   │   ├── Logo/
│   │   ├── ProductCard/
│   │   ├── ProductDetails/
│   │   ├── ProductListing/
│   │   ├── ProductOptions/
│   │   └── Section/
│   │
│   ├── pages/
│   │   ├── HomePage/
│   │   ├── Layout/
│   │   ├── ProductListingPage/
│   │   └── ProductViewPage/
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── index.html
├── package.json
├── package-lock.json
├── vercel.json
└── README.md
```

### Responsabilidade de alguns arquivos e componentes

- `src/main.jsx`: ponto de entrada da aplicação e configuração do `BrowserRouter`;
- `src/App.jsx`: definição das rotas e associação de cada rota à sua página;
- `src/pages/Layout/`: estrutura compartilhada de cabeçalho, conteúdo principal e rodapé;
- `src/pages/HomePage/`: conteúdo da página inicial;
- `src/pages/ProductListingPage/`: conteúdo da listagem de produtos;
- `src/pages/ProductViewPage/`: conteúdo da visualização do produto;
- `src/components/Header/`: cabeçalho e navegação;
- `src/components/Footer/`: rodapé;
- `src/components/Gallery/`: galeria de imagens;
- `src/components/ProductCard/`: card individual de produto;
- `src/components/ProductListing/`: apresentação de uma coleção de cards;
- `src/components/BuyBox/`: informações e área de opções do produto;
- `src/components/ProductOptions/`: opções de tamanho;
- `vercel.json`: regra de reescrita para permitir que as rotas do React Router sejam carregadas ao acessar diretamente uma URL publicada.

## 7. Configuração das rotas na Vercel

O projeto utiliza `BrowserRouter` e React Router DOM para controlar a navegação no lado do cliente.

Para que uma rota interna também funcione quando acessada diretamente pelo navegador ou após atualizar a página, foi adicionado o arquivo `vercel.json` na raiz do projeto.

A configuração direciona as requisições para `index.html`, permitindo que o React Router identifique a rota solicitada e carregue a página correspondente.

Conteúdo utilizado:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Com essa configuração, as rotas implementadas podem ser acessadas diretamente pela URL publicada, sem depender de entrar primeiro pela Home.

## 8. Como executar o projeto localmente

### Pré-requisitos

- Node.js instalado;
- npm instalado;
- Git instalado.

### 8.1 Clonar o repositório

```bash
git clone https://github.com/JMorais00/projeto-geracao-tech-4.git
```

### 8.2 Entrar na pasta do projeto

```bash
cd projeto-geracao-tech-4
```

> Observação: o nome da pasta local pode ser diferente caso o repositório seja clonado com outro nome.

### 8.3 Instalar as dependências

```bash
npm install
```

### 8.4 Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

O Vite exibirá no terminal o endereço local para abrir a aplicação. Normalmente:

```text
http://localhost:5173/
```

### 8.5 Rotas locais

Com o servidor em execução, as páginas podem ser acessadas por:

- Home: `http://localhost:5173/`
- Produtos: `http://localhost:5173/produtos`
- Visualização do Produto: `http://localhost:5173/product/1`

## 9. Verificação do projeto

O projeto disponibiliza os seguintes scripts:

### Análise com ESLint

```bash
npm run lint
```

Esse comando executa a análise estática dos arquivos do projeto.

### Build de produção

```bash
npm run build
```

Esse comando gera a versão de produção da aplicação na pasta `dist/`.

Durante o desenvolvimento, os comandos `npm run lint` e `npm run build` foram executados e finalizaram sem erros.

## 10. Responsividade

A interface recebeu ajustes para diferentes larguras de tela, incluindo dispositivos móveis.

Foram considerados, entre outros elementos:

- Cabeçalho e navegação;
- Galeria de imagens;
- Cards e listagem de produtos;
- Área de detalhes do produto;
- Seções de conteúdo;
- Rodapé.

## 11. Dados e limitações desta versão

Esta versão tem finalidade acadêmica e demonstrativa. Os produtos apresentados utilizam dados e imagens de exemplo definidos no próprio projeto.

Não há integração com API ou banco de dados. Também não há autenticação, cadastro de usuários, persistência de carrinho, pagamento ou gerenciamento de pedidos.

Os elementos visuais que representam ações não descritas como funcionais neste README não devem ser interpretados como fluxos completos de e-commerce.

## 12. Considerações finais

O desenvolvimento do Drip Store teve como objetivo aplicar conceitos de desenvolvimento Front-end com React, JavaScript, componentização, reutilização de componentes, organização de estilos, navegação entre páginas e responsividade.

As páginas principais implementadas nesta entrega são:

1. Home;
2. Listagem de Produtos;
3. Visualização do Produto.

O código-fonte está disponível no GitHub e a aplicação está publicada na Vercel para facilitar o acesso e a avaliação.

---

**Projeto acadêmico desenvolvido para a atividade da Digital College / Geração Tech.**
