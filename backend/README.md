# Drip Store API

Backend da loja virtual Drip Store, desenvolvido com Node.js, Express, Sequelize e MySQL. Este backend faz parte do mesmo repositório GitHub do frontend React/Vite, localizado na pasta `backend/`.

## Requisitos

- Node.js 22 ou superior (testado com Node.js 24);
- npm;
- MySQL 8;
- Banco de dados MySQL com charset `utf8mb4`.

## Instalação

Execute os comandos a seguir dentro da pasta `backend`:

```bash
npm install
```

Crie os arquivos de ambiente a partir do exemplo:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure as credenciais do MySQL e o segredo JWT.

Para gerar um segredo JWT:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Coloque o valor gerado em `JWT_SECRET`. Não compartilhe nem versione o arquivo `.env`.

## Banco de dados

Crie os bancos de dados principal e de testes no MySQL:

```sql
CREATE DATABASE drip_store
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

CREATE DATABASE drip_store_test
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` no arquivo `.env` para apontar para o banco principal `drip_store`.

A configuração de testes deve utilizar `drip_store_test`. Crie o arquivo `.env.test` localmente com as configurações correspondentes, usando as mesmas credenciais MySQL e alterando o banco para `drip_store_test`. Esse arquivo não é versionado.

### Verificar conexão e aplicar migrations

```bash
npm run db:check
npm run db:migrate
npm run db:status
```

As migrations criam as tabelas necessárias. O projeto utiliza migrations do Sequelize e não utiliza `sequelize.sync()` para criar as tabelas.

## Executar a API

```bash
npm run dev
```

A API inicia normalmente em `http://localhost:3000`.

Verificação de saúde:

```bash
curl http://localhost:3000/health
```

Resposta esperada:

```json
{"status":"ok"}
```

Para iniciar sem Nodemon:

```bash
npm start
```

## Configuração do frontend

O frontend está na raiz do mesmo repositório. Configure o arquivo `.env` da raiz com:

```env
VITE_API_URL=http://localhost:3000
```

O backend deve permitir a origem local do Vite, normalmente `http://localhost:5173`, por meio da variável `CORS_ORIGIN`.

Consulte o README principal, na raiz do repositório, para as instruções completas de execução do frontend e do projeto integrado.

## Estrutura do backend

```text
backend/
├── media/
├── scripts/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── database/
│   │   └── migrations/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── validators/
├── tests/
├── .env.example
├── package.json
└── README.md
```

## Endpoints

### Saúde da API

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/health` | Verifica se a API está ativa |

### Usuários e autenticação

| Método | Endpoint | Autenticação |
|---|---|---|
| POST | `/v1/user` | Pública |
| POST | `/v1/user/token` | Pública |
| GET | `/v1/user/:id` | Pública |
| PUT | `/v1/user/:id` | JWT |
| DELETE | `/v1/user/:id` | JWT |

Regras principais:
- O cadastro exige `firstname`, `surname`, `email`, `password` e `confirmPassword`.
- A senha é armazenada como hash bcrypt e não é devolvida nas respostas.
- O login retorna um token JWT.
- A atualização e a exclusão da conta exigem autenticação.
- O usuário só pode alterar ou excluir a própria conta.

### Categorias

| Método | Endpoint | Autenticação |
|---|---|---|
| GET | `/v1/category/search` | Pública |
| GET | `/v1/category/:id` | Pública |
| POST | `/v1/category` | JWT |
| PUT | `/v1/category/:id` | JWT |
| DELETE | `/v1/category/:id` | JWT |

A pesquisa aceita parâmetros como `limit`, `page`, `use_in_menu` e `fields`. O valor `limit=-1` retorna todos os registros.

### Produtos

| Método | Endpoint | Autenticação |
|---|---|---|
| GET | `/v1/product/search` | Pública |
| GET | `/v1/product/:id` | Pública |
| POST | `/v1/product` | JWT |
| PUT | `/v1/product/:id` | JWT |
| DELETE | `/v1/product/:id` | JWT |

A pesquisa de produtos aceita parâmetros como `limit`, `page`, `fields`, `match`, `category_ids`, `price-range` e filtros por opções.

O cadastro e a atualização de produtos permitem trabalhar com categorias, imagens e opções. Imagens Base64 são armazenadas na pasta `media/` e disponibilizadas pela API.

### Observações sobre permissões

O projeto não define papéis de usuário, como administrador. Portanto, qualquer usuário autenticado pode criar, alterar e excluir produtos e categorias. As operações de atualização e exclusão de usuários são restritas ao próprio usuário autenticado.

## Migrations

As migrations estão em `src/database/migrations`:

| Migration | Tabela ou alteração |
|---|---|
| `create-users` | `users` |
| `create-categories` | `categories` |
| `create-products` | `products` |
| `create-product-images` | `product_images` |
| `create-product-options` | `product_options` |
| `create-product-categories` | `product_categories` |
| `add-extra-fields-to-products` | Campos opcionais `brand`, `reference`, `rating` e `reviews_count` em produtos |

Para consultar o estado das migrations:

```bash
npm run db:status
npm run db:status:test
```

Para aplicar migrations no banco principal:

```bash
npm run db:migrate
```

Para aplicar migrations no banco de testes:

```bash
npm run db:migrate:test
```

Os comandos `db:migrate:undo` e `db:migrate:undo:all` desfazem migrations do banco principal. Utilize-os somente quando souber que deseja reverter a estrutura do banco.

## Dados demonstrativos

As migrations criam a estrutura do banco, mas não inserem automaticamente os produtos demonstrativos.

O script `scripts/reset-store-to-sneakers.js` recria os dados demonstrativos de tênis. **Ele substitui os produtos e as categorias existentes no banco configurado.** Execute somente se desejar substituir esses dados:

```bash
node scripts/reset-store-to-sneakers.js
```

As imagens correspondentes estão na pasta `media/`.

## Testes automatizados

Os testes utilizam exclusivamente o banco `drip_store_test`. Antes de executá-los, configure o arquivo `.env.test` para apontar para esse banco e aplique as migrations de teste:

```bash
npm run db:migrate:test
npm test
```

Na verificação realizada durante o desenvolvimento, foram aprovados **417 testes em 15 suítes**.

Outros comandos de verificação:

```bash
npm run check:bcrypt
npm run db:check
```

## Scripts disponíveis

| Script | Função |
|---|---|
| `npm start` | Inicia a API sem Nodemon |
| `npm run dev` | Inicia a API com Nodemon |
| `npm test` | Executa os testes automatizados |
| `npm run test:watch` | Executa os testes em modo watch |
| `npm run test:coverage` | Executa os testes com cobertura |
| `npm run check:bcrypt` | Verifica o funcionamento do bcrypt |
| `npm run db:check` | Verifica a conexão com o MySQL |
| `npm run db:status` | Mostra o estado das migrations do banco principal |
| `npm run db:status:test` | Mostra o estado das migrations do banco de testes |
| `npm run db:migrate` | Aplica migrations no banco principal |
| `npm run db:migrate:test` | Aplica migrations no banco de testes |
| `npm run db:migrate:undo` | Desfaz a última migration do banco principal |
| `npm run db:migrate:undo:all` | Desfaz todas as migrations do banco principal |

## Variáveis de ambiente e segurança

O arquivo `.env.example` apresenta os nomes das variáveis necessárias. Os arquivos `.env` e `.env.test` são locais e não devem ser enviados ao GitHub.

Nunca publique senhas do banco, tokens ou o valor de `JWT_SECRET`. Cada ambiente deve configurar seus próprios valores.

---

**Projeto:** Drip Store — API  
**Tecnologias:** Node.js, Express, Sequelize, MySQL, JWT, bcrypt, Jest e Supertest.
