# Drip Store — Projeto Full Stack

## 1. Apresentação

O **Drip Store** é um projeto acadêmico de loja virtual desenvolvido com **React** no frontend e **Node.js, Express e MySQL** no backend. A interface foi construída com base no layout de referência disponibilizado no Figma e conectada a uma API própria para consultar produtos, categorias e detalhes dos produtos.

O projeto reúne duas partes no mesmo repositório:

- **Frontend:** aplicação React com navegação por React Router DOM e estilos organizados com CSS Modules.
- **Backend:** API REST desenvolvida com Express, Sequelize e MySQL, com autenticação JWT para operações protegidas.

## 2. Acesso ao projeto

- **Aplicação publicada:** [Abrir Drip Store na Vercel](https://projeto-geracao-tech-4.vercel.app/)
- **Repositório GitHub:** (https://github.com/JMorais00/projeto-geracao-tech-4)

### Endereços de produção

- **Frontend:** (https://projeto-geracao-tech-4.vercel.app/)
- **Backend (API):** (https://projeto-geracao-tech-4-production.up.railway.app)
- **Verificação da API:** (https://projeto-geracao-tech-4-production.up.railway.app/health)

### Acesso direto às páginas publicadas

| Página                  | Rota         | Link                                                                 |
| ----------------------- | ------------ | -------------------------------------------------------------------- |
| Home                    | `/`          | [Abrir Home](https://projeto-geracao-tech-4.vercel.app/)             |
| Listagem de Produtos    | `/produtos`  | [Abrir Produtos](https://projeto-geracao-tech-4.vercel.app/produtos) |
| Visualização do Produto | `/product/1` | [Abrir Produto](https://projeto-geracao-tech-4.vercel.app/product/1) |

A rota `/product/1` utiliza o padrão de parâmetro `/product/:id`. Os IDs disponíveis dependem dos produtos cadastrados na API.

> **Nota sobre a publicação:** o frontend está hospedado na Vercel e o backend está hospedado no Railway. Em produção, o frontend utiliza a variável `VITE_API_URL` configurada com o endereço público da API. Na execução local, a configuração utiliza `http://localhost:3000`.

## 3. Páginas e funcionalidades do frontend

### 3.1 Home — `/`

Página inicial da loja. Apresenta:

- Cabeçalho com identidade visual e navegação;
- Campo de pesquisa;
- Banner principal com galeria de imagens;
- Seção de coleções em destaque;
- Seção de produtos em alta, carregados pela API;
- Cards de produtos;
- Rodapé com informações da loja.

Os banners e as imagens das coleções permanecem como arquivos estáticos do frontend.

### 3.2 Listagem de Produtos — `/produtos`

Página destinada à apresentação dos produtos disponíveis na API. Contém:

- Área de identificação dos resultados;
- Filtros por marca e categoria;
- Opções de ordenação por preço;
- Cards com imagens, nomes e preços;
- Listagem responsiva.

Os filtros e a ordenação interagem com os dados retornados pela API.

### 3.3 Visualização do Produto — `/product/:id`

Página de detalhes do produto. Apresenta:

- Galeria de imagens;
- Nome do produto;
- Categoria, marca e referência, quando disponíveis;
- Avaliação e quantidade de avaliações, quando disponíveis;
- Preço e descrição;
- Opções de tamanho;
- Botão de compra apresentado na interface;
- Seção de produtos relacionados.

A seleção de tamanho possui interação visual. O botão de compra não realiza uma compra: não há integração com carrinho, pagamento ou processamento de pedidos.

## 4. Backend e API

A API disponibiliza endpoints REST para usuários, categorias e produtos.

### Principais recursos

| Recurso      | Operações                                                   |
| ------------ | ----------------------------------------------------------- |
| Usuários     | Cadastro, login por token, consulta, atualização e exclusão |
| Categorias   | Pesquisa, consulta, criação, atualização e exclusão         |
| Produtos     | Pesquisa, consulta, criação, atualização e exclusão         |
| Saúde da API | Endpoint `/health`                                          |

As consultas públicas de produtos e categorias são utilizadas pelo frontend. As operações de criação, atualização e exclusão protegidas exigem um token JWT válido.

O projeto não define perfis ou papéis de acesso: qualquer usuário autenticado pode executar as operações protegidas de gerenciamento de produtos e categorias. O usuário só pode alterar ou excluir a própria conta.

### Endpoints utilizados pelo frontend

| Funcionalidade           | Endpoint                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Produtos em alta na Home | `GET /v1/product/search?limit=-1&fields=id,enabled,name,slug,price,price_with_discount,images` |
| Listagem de produtos     | `GET /v1/product/search`                                                                       |
| Categorias dos filtros   | `GET /v1/category/search?limit=-1`                                                             |
| Pesquisa do cabeçalho    | `GET /v1/product/search` (filtragem do termo nos resultados retornados)                        |
| Detalhes do produto      | `GET /v1/product/:id`                                                                          |
| Produtos relacionados    | `GET /v1/product/search`                                                                       |

Na Home, a API retorna os produtos com os campos necessários para a exibição. O frontend filtra os produtos habilitados e apresenta os oito primeiros resultados.

O frontend carrega as imagens dos produtos pelos caminhos disponibilizados pela API.

### Limites da integração

- A Home exibe até oito produtos habilitados retornados pela API.
- A listagem utiliza os produtos, categorias e marcas existentes nos dados retornados.
- A pesquisa do cabeçalho filtra os resultados por nome, descrição e marca.
- A ordenação por preço considera o preço com desconto quando ele é maior que zero.
- A página de detalhes carrega o produto pelo ID da rota e apresenta imagens e opções cadastradas.
- Banners e imagens das coleções continuam estáticos no frontend.

## 5. Funcionalidades fora do escopo

O projeto concentra-se nas três páginas principais do frontend e na API necessária para disponibilizar os dados da loja.

Os itens abaixo não representam fluxos completos implementados:

| Item                                    | Situação          |
| --------------------------------------- | ----------------- |
| Home                                    | Implementada      |
| Listagem de Produtos                    | Implementada      |
| Visualização do Produto                 | Implementada      |
| API de usuários e autenticação JWT      | Implementada      |
| API de categorias                       | Implementada      |
| API de produtos                         | Implementada      |
| Página independente de categorias       | Não implementada  |
| Carrinho de compras                     | Não implementado  |
| Checkout e pagamento                    | Não implementados |
| Processamento de pedidos                | Não implementado  |
| Página de Meus Pedidos                  | Não implementada  |
| Páginas de Login e Cadastro no frontend | Não implementadas |

O backend possui endpoints de cadastro e autenticação de usuários, mas isso não significa que exista uma interface de login ou cadastro no frontend.

## 6. Tecnologias e ferramentas

### Frontend

- **React:** construção da interface por componentes;
- **JavaScript:** linguagem de desenvolvimento;
- **Vite:** ambiente de desenvolvimento e ferramenta de build;
- **React Router DOM:** navegação entre páginas;
- **HTML5 e CSS3:** estrutura e estilização;
- **CSS Modules:** organização dos estilos por componente e página;
- **ESLint:** análise estática do código.

### Backend

- **Node.js:** ambiente de execução JavaScript;
- **Express:** criação da API REST;
- **Sequelize:** ORM para comunicação com o banco de dados;
- **MySQL 8:** banco de dados relacional;
- **JWT (JSON Web Token):** autenticação das rotas protegidas;
- **bcrypt:** hash e verificação de senhas;
- **Joi:** validação de dados;
- **Jest e Supertest:** testes automatizados.

### Ferramentas

- **Git e GitHub:** versionamento e hospedagem do código-fonte;
- **Vercel:** publicação do frontend;
- **Railway:** hospedagem do backend e do banco de dados MySQL.

## 7. Organização dos arquivos

A estrutura principal do repositório é:

```text
projeto-digital-store/
├── backend/
│   ├── media/
│   ├── scripts/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── database/
│   │   │   └── migrations/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vercel.json
└── README.md
```

### Responsabilidade de alguns arquivos

**Frontend**

- `src/main.jsx`: ponto de entrada e configuração do `BrowserRouter`;
- `src/App.jsx`: definição das rotas do frontend;
- `src/pages/`: páginas da aplicação;
- `src/components/`: componentes reutilizáveis;
- `src/services/api.js`: configuração da comunicação entre frontend e API;
- `vercel.json`: regra de reescrita para as rotas do React Router na Vercel.

**Backend**

- `backend/src/server.js`: inicialização do servidor;
- `backend/src/app.js`: configuração da aplicação Express;
- `backend/src/config/`: configurações de ambiente, autenticação e banco;
- `backend/src/database/migrations/`: migrations responsáveis pela criação e evolução das tabelas;
- `backend/src/models/`: models do Sequelize;
- `backend/src/routes/`: rotas da API;
- `backend/src/controllers/`: controllers;
- `backend/src/services/`: regras de negócio;
- `backend/tests/`: testes automatizados;
- `backend/media/`: imagens dos produtos disponibilizadas pela API.

## 8. Requisitos para executar localmente

- Node.js 22 ou superior (o projeto foi testado com Node.js 24);
- npm;
- MySQL 8;
- Git.

O frontend e o backend possuem instalações e servidores independentes. Os comandos devem ser executados nos diretórios indicados.

## 9. Instalação e configuração do backend

### 9.1 Entrar na pasta do backend

A partir da raiz do repositório:

```bash
cd backend
```

### 9.2 Instalar as dependências

```bash
npm install
```

### 9.3 Criar o banco de dados

No MySQL, crie o banco utilizado pela aplicação:

```sql
CREATE DATABASE drip_store
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Para executar os testes, crie também o banco de testes:

```sql
CREATE DATABASE drip_store_test
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

### 9.4 Configurar as variáveis de ambiente

Na pasta `backend`, copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Abra `backend/.env` e configure os dados de acesso ao MySQL, principalmente `DB_USER` e `DB_PASSWORD`. Gere também um segredo JWT próprio:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Use o valor gerado em `JWT_SECRET`. Não publique o arquivo `.env` nem compartilhe seu segredo JWT.

O arquivo de exemplo contém as configurações iniciais do servidor, banco de dados e CORS. Para execução local, a origem do frontend deve ser `http://localhost:5173`.

### 9.5 Aplicar as migrations

Ainda dentro de `backend`:

```bash
npm run db:check
npm run db:migrate
npm run db:status
```

As migrations criam as tabelas necessárias no banco `drip_store`.

### 9.6 Iniciar a API

```bash
npm run dev
```

A API ficará disponível em:

```text
http://localhost:3000
```

Para verificar se o servidor está ativo, acesse:

```text
http://localhost:3000/health
```

A resposta esperada é:

```json
{ "status": "ok" }
```

Mantenha esse terminal aberto enquanto utiliza o frontend.

## 10. Instalação e execução do frontend

Abra um **segundo terminal** e volte à raiz do repositório:

```bash
cd ..
```

Se o terminal foi aberto em outra pasta, entre diretamente na pasta `projeto-digital-store`.

Instale as dependências do frontend:

```bash
npm install
```

Crie o arquivo de ambiente a partir do exemplo:

```bash
cp .env.example .env
```

O arquivo `.env` do frontend deve conter:

```env
VITE_API_URL=http://localhost:3000
```

Inicie o Vite:

```bash
npm run dev
```

Normalmente, a aplicação ficará disponível em:

```text
http://localhost:5173
```

Com o backend e o frontend em execução, acesse as páginas:

- Home: `http://localhost:5173/`
- Produtos: `http://localhost:5173/produtos`
- Visualização do produto: `http://localhost:5173/product/4`

Os IDs disponíveis dependem dos produtos cadastrados no banco de dados.

## 11. Dados demonstrativos

As migrations criam a estrutura do banco, mas não inserem automaticamente os produtos demonstrativos.

O backend inclui o script `scripts/reset-store-to-sneakers.js`, preparado para cadastrar os dados demonstrativos de tênis utilizados no projeto.

**Atenção:** esse script substitui os produtos e as categorias existentes no banco configurado. Execute-o somente se desejar recriar os dados demonstrativos e tiver certeza de que pode substituir os dados atuais.

A execução deve ser feita dentro da pasta `backend`:

```bash
node scripts/reset-store-to-sneakers.js
```

As imagens correspondentes estão incluídas em `backend/media/`.

## 12. Testes e verificações

### Frontend

Execute os comandos na raiz do repositório:

```bash
npm run lint
npm run build
```

- `npm run lint`: executa a análise estática com ESLint;
- `npm run build`: gera os arquivos de produção na pasta `dist/`.

### Backend

Execute os comandos dentro da pasta `backend`:

```bash
npm test
```

O backend possui **417 testes automatizados**, organizados em 15 suítes, aprovados na verificação realizada durante o desenvolvimento.

Outros comandos disponíveis:

```bash
npm run check:bcrypt
npm run db:check
npm run db:status
```

Os testes automatizados utilizam o banco `drip_store_test`, separado do banco principal. A configuração de teste deve apontar para esse banco, nunca para `drip_store`.

## 13. Responsividade

A interface recebeu ajustes para diferentes larguras de tela, incluindo dispositivos móveis. Foram considerados o cabeçalho, a navegação, a galeria, os cards, a listagem de produtos, os detalhes e o rodapé.

## 14. Segurança e arquivos de ambiente

Os arquivos `.env` e `.env.test` contêm configurações locais e não devem ser enviados ao GitHub. O repositório disponibiliza arquivos `.env.example` como referência para a configuração.

Cada pessoa que executar o projeto deve criar seus próprios arquivos de ambiente e preencher suas credenciais locais. Não utilize senhas reais ou segredos JWT em arquivos versionados.

## 15. Considerações finais

O Drip Store reúne o desenvolvimento de uma interface de loja virtual com React e a implementação de uma API própria com Node.js, Express, Sequelize e MySQL.

O projeto aplica conceitos de componentização, reutilização de código, navegação, responsividade, integração frontend/backend, modelagem relacional, migrations, validação de dados, autenticação JWT e testes automatizados.

O código-fonte está disponível no GitHub, o frontend está publicado na Vercel e o backend, juntamente com o banco de dados MySQL, está hospedado no Railway.

---

## Autoria

**Projeto desenvolvido individualmente por:**

- Maria Jayna Morais Marques

**Curso:** Digital College / Geração Tech 4.0  
**Projeto:** Drip Store — Desenvolvimento Full Stack
