# Drip Store — Frontend

Aplicação frontend da loja virtual Drip Store, desenvolvida com React e Vite. Este projeto corresponde à interface da loja e está integrado à API localizada na pasta `backend/` do mesmo repositório.

Para a visão geral do projeto completo, consulte o [README principal](README.md). Para a documentação da API, consulte o [README do backend](backend/README.md).

## Aplicação publicada

- **Frontend:** https://projeto-geracao-tech-4.vercel.app/
- **API:** https://projeto-geracao-tech-4-production.up.railway.app
- **Verificação da API:** https://projeto-geracao-tech-4-production.up.railway.app/health

## Tecnologias

- React;
- JavaScript;
- Vite;
- React Router DOM;
- HTML5 e CSS3;
- CSS Modules;
- ESLint.

## Requisitos

- Node.js 22 ou superior (testado com Node.js 24);
- npm;
- API do Drip Store configurada e em execução para carregar os dados dinâmicos.

## Instalação

Execute os comandos na raiz do repositório, onde está o `package.json` do frontend:

```bash
npm install
```

Crie o arquivo `.env` na raiz, usando como referência o `.env.example`:

```env
VITE_API_URL=http://localhost:3000
```

A variável `VITE_API_URL` deve apontar para o endereço base da API. Em desenvolvimento local, o backend utiliza `http://localhost:3000`.

## Executar em desenvolvimento

Na raiz do repositório:

```bash
npm run dev
```

O Vite disponibiliza a aplicação normalmente em:

http://localhost:5173

## Build de produção

Para gerar os arquivos otimizados:

```bash
npm run build
```

Para visualizar localmente o build:

```bash
npm run preview
```

## Verificação de código

```bash
npm run lint
```

## Páginas e rotas

| Página   | Rota           | Descrição                                |
| -------- | -------------- | ---------------------------------------- |
| Home     | `/`            | Banner, coleções e produtos em alta      |
| Listagem | `/produtos`    | Produtos, filtros e ordenação            |
| Detalhes | `/product/:id` | Informações, imagens e opções do produto |

## Integração com a API

O frontend utiliza os seguintes endpoints públicos:

| Uso na interface         | Endpoint                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Produtos em alta na Home | `GET /v1/product/search?limit=-1&fields=id,enabled,name,slug,price,price_with_discount,images` |
| Listagem de produtos     | `GET /v1/product/search`                                                                       |
| Categorias dos filtros   | `GET /v1/category/search?limit=-1`                                                             |
| Pesquisa do cabeçalho    | `GET /v1/product/search`                                                                       |
| Detalhes do produto      | `GET /v1/product/:id`                                                                          |
| Produtos relacionados    | `GET /v1/product/search`                                                                       |

Na Home, os produtos são carregados da API, filtrados no frontend para exibir somente os habilitados e limitados aos oito primeiros resultados.

A pesquisa do cabeçalho e alguns filtros são aplicados no frontend sobre os dados recebidos. Os banners e as imagens das coleções permanecem estáticos no frontend; as imagens dos produtos são fornecidas pela API.

## Funcionalidades e limites

- A Home apresenta produtos em alta carregados da API.
- A listagem apresenta produtos e permite filtrar e ordenar os resultados.
- A página de detalhes carrega o produto conforme o ID informado na rota.
- A seleção de tamanho possui interação visual.
- O botão de compra não conclui uma compra: não há carrinho, checkout, pagamento ou processamento de pedidos implementados.
- O backend possui cadastro e autenticação de usuários, mas o frontend não possui páginas de login ou cadastro.

## Estrutura principal

```text
projeto-digital-store/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── backend/
├── .env.example
├── package.json
├── package-lock.json
└── README.md
```

- `src/main.jsx`: ponto de entrada da aplicação;
- `src/App.jsx`: configuração das rotas;
- `src/components/`: componentes reutilizáveis;
- `src/pages/`: páginas da loja;
- `src/services/`: comunicação com a API;
- `public/` e `src/assets/`: arquivos estáticos e recursos visuais.

## Publicação

O frontend está publicado na Vercel:

https://projeto-geracao-tech-4.vercel.app/

A API está hospedada no Railway:

https://projeto-geracao-tech-4-production.up.railway.app

Em ambiente publicado, a variável `VITE_API_URL` deve apontar para a URL pública da API. No backend, a variável `CORS_ORIGIN` deve permitir a origem do domínio do frontend.

As variáveis de ambiente devem ser configuradas nas plataformas de hospedagem, sem publicar senhas, tokens ou arquivos `.env` no repositório.
