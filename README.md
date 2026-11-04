# 👟 Drip Store

Projeto de desenvolvimento de uma loja virtual de produtos esportivos, construído com React e Vite, a partir do layout de referência desenvolvido no Figma.

O projeto foi desenvolvido como atividade acadêmica da Digital College, com foco na construção de interfaces, reutilização de componentes, navegação entre páginas e responsividade.

## 🌐 Projeto online

Acesse a versão publicada:

**[Drip Store — Acessar site](https://projeto-geracao-tech-4-2mxrbfmmt-jm-orais00.vercel.app)**

## 💻 Repositório

[GitHub — projeto-geracao-tech-4](https://github.com/JMorais00/projeto-geracao-tech-4)

---

## ✨ Funcionalidades desenvolvidas

### Página inicial — Home

- Cabeçalho com logotipo, campo de pesquisa, acesso à conta e ícone do carrinho.
- Menu de navegação.
- Galeria de banners com navegação entre imagens.
- Seção de coleções em destaque.
- Seção de produtos em alta.
- Rodapé com informações e redes sociais.

### Página de produtos — Listagem

- Exibição de produtos em cards.
- Filtro por marca.
- Filtro por categoria.
- Ordenação por menor e maior preço.
- Atualização da quantidade de resultados conforme os filtros selecionados.
- Layout responsivo.

### Página de detalhes do produto

- Galeria de imagens com miniaturas.
- Navegação entre imagens.
- Informações do produto.
- Avaliação e descrição.
- Exibição de preço.
- Seleção de tamanho.
- Botão de compra.
- Seção de produtos relacionados.

### Responsividade

- Adaptação das páginas para diferentes tamanhos de tela.
- Ajustes de navegação, galerias, filtros e cards para dispositivos móveis.

---

## 🧩 Componentes desenvolvidos

O projeto utiliza componentes reutilizáveis para organizar a interface:

| Componente     | Responsabilidade                     |
| -------------- | ------------------------------------ |
| Header         | Cabeçalho e navegação                |
| Footer         | Rodapé da aplicação                  |
| Logo           | Exibição da identidade visual        |
| Gallery        | Galeria de imagens e miniaturas      |
| Section        | Organização das seções da página     |
| ProductCard    | Apresentação individual dos produtos |
| ProductListing | Listagem de produtos                 |
| FilterGroup    | Opções de filtros                    |
| ProductOptions | Seleção de tamanho                   |
| BuyBox         | Informações e opções de compra       |
| ProductDetails | Componente de detalhes do produto    |
| Information    | Exibição de informações no rodapé    |

---

## 📄 Páginas e rotas

| Página               | Rota           |
| -------------------- | -------------- |
| Home                 | `/`            |
| Listagem de produtos | `/produtos`    |
| Detalhes do produto  | `/product/:id` |

A navegação entre as páginas é realizada com React Router DOM.

---

## 🛠️ Tecnologias utilizadas

- **React:** construção da interface por componentes.
- **JavaScript:** lógica e interatividade.
- **Vite:** ambiente de desenvolvimento e build.
- **React Router DOM:** navegação entre páginas.
- **CSS Modules:** estilização e organização dos estilos.
- **ESLint:** análise e padronização do código.
- **Git e GitHub:** versionamento e hospedagem do código.
- **Vercel:** publicação do projeto.

---

## 📁 Estrutura do projeto

```text
projeto-digital-store/
│
├── public/
│   ├── imagens dos produtos
│   ├── banners
│   └── coleções
│
├── src/
│   ├── assets/
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
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

---

## 🚀 Como executar o projeto localmente

### Pré-requisitos

- Node.js instalado.
- npm instalado.
- Git instalado.

### 1. Clone o repositório

```bash
git clone https://github.com/JMorais00/projeto-geracao-tech-4.git
```

### 2. Acesse a pasta do projeto

```bash
cd projeto-geracao-tech-4
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

### 5. Acesse a aplicação

Abra no navegador o endereço local apresentado pelo Vite, normalmente:

```text
http://localhost:5173
```

---

## 🧪 Verificação do projeto

Foram executados os seguintes comandos para verificar o código e a compilação:

### ESLint

```bash
npm run lint
```

### Build de produção

```bash
npm run build
```

Ambos foram executados com sucesso durante o desenvolvimento.

---

## 🎨 Layout e identidade visual

A interface foi desenvolvida com base no projeto visual disponibilizado no Figma, utilizando a identidade visual da Drip Store, com foco em:

- Organização e hierarquia visual.
- Padronização dos componentes.
- Reutilização de estilos.
- Fidelidade ao layout de referência.
- Experiência em diferentes tamanhos de tela.

---

## 👩‍💻 Autoria

Projeto acadêmico desenvolvido como parte das atividades da Digital College.

**Projeto:** Drip Store — Digital Store.
