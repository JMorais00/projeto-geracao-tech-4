/**
 * Substitui os produtos e categorias atuais por uma loja especializada em tênis.
 *
 * Uso (Git Bash, na pasta drip-store-api):
 *   TOKEN="$TOKEN" node scripts/reset-store-to-sneakers.js
 *
 * O script NÃO apaga usuários, migrations, tabelas ou código.
 * As imagens são lidas dos arquivos originais em ../projeto-digital-store/public
 * e enviadas à API como Base64; a API as salva em drip-store-api/media.
 */
const fs = require("node:fs/promises");
const path = require("node:path");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

const API = process.env.API_URL || "http://localhost:3000";
const TOKEN = process.env.TOKEN;
const FRONTEND_PUBLIC = process.env.FRONTEND_PUBLIC_DIR
  ? path.resolve(process.env.FRONTEND_PUBLIC_DIR)
  : path.resolve(__dirname, "../../projeto-digital-store/public");

const categories = [
  { name: "Tênis Casuais", slug: "tenis-casuais", use_in_menu: true },
  { name: "Tênis Streetwear", slug: "tenis-streetwear", use_in_menu: true },
  { name: "Tênis Esportivos", slug: "tenis-esportivos", use_in_menu: true },
];

const products = [
  {
    image: "produc-image-1.jpeg",
    name: "Tênis Street Court Verde",
    slug: "tenis-street-court-verde",
    description:
      "Tênis de cano alto com combinação de cores verde e branco, ideal para compor looks urbanos.",
    category: "Tênis Streetwear",
    stock: 15,
    price: 279.9,
    price_with_discount: 249.9,
    sizes: ["38", "39", "40", "41", "42", "43"],
  },
  {
    image: "produc-image-2.jpeg",
    name: "Tênis Casual Minimal Bege",
    slug: "tenis-casual-minimal-bege",
    description:
      "Tênis casual em tom bege, com visual minimalista para o dia a dia.",
    category: "Tênis Casuais",
    stock: 18,
    price: 199.9,
    price_with_discount: 179.9,
    sizes: ["37", "38", "39", "40", "41", "42"],
  },
  {
    image: "produc-image-3.jpeg",
    name: "Tênis Street High Rosa",
    slug: "tenis-street-high-rosa",
    description:
      "Tênis de cano alto com detalhes em rosa e branco e estilo streetwear.",
    category: "Tênis Streetwear",
    stock: 12,
    price: 299.9,
    price_with_discount: 269.9,
    sizes: ["37", "38", "39", "40", "41", "42"],
  },
  {
    image: "produc-image-4.jpeg",
    name: "Tênis Canvas High Classic",
    slug: "tenis-canvas-high-classic",
    description: "Tênis de lona de cano alto, com visual clássico e versátil.",
    category: "Tênis Casuais",
    stock: 20,
    price: 229.9,
    price_with_discount: 209.9,
    sizes: ["36", "37", "38", "39", "40", "41", "42", "43"],
  },
  {
    image: "produc-image-5.jpeg",
    name: "Tênis Running Sprint Laranja",
    slug: "tenis-running-sprint-laranja",
    description:
      "Tênis esportivo branco com detalhes em laranja, indicado para compor looks esportivos.",
    category: "Tênis Esportivos",
    stock: 14,
    price: 319.9,
    price_with_discount: 289.9,
    sizes: ["38", "39", "40", "41", "42", "43"],
  },
];

async function request(endpoint, { method = "GET", body } = {}) {
  const response = await fetch(`${API}${endpoint}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }
  if (!response.ok) {
    const detail = data?.message || raw || response.statusText;
    throw new Error(
      `${method} ${endpoint} falhou (${response.status}): ${detail}`,
    );
  }
  return data;
}

function assertTokenLooksUsable(token) {
  if (!token) {
    throw new Error(
      'TOKEN não informado. Gere um JWT e execute TOKEN="$TOKEN" node scripts/reset-store-to-sneakers.js',
    );
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("TOKEN não parece ser um JWT válido.");
  }

  let payload;

  try {
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch (error) {
    throw new Error("Não foi possível verificar o TOKEN. Gere um novo JWT.", {
      cause: error,
    });
  }

  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    throw new Error("O TOKEN expirou. Gere um novo token antes de continuar.");
  }
}

async function main() {
  assertTokenLooksUsable(TOKEN);

  // Verificações não destrutivas antes de tocar nos dados.
  const health = await request("/health");
  if (health?.status !== "ok")
    throw new Error("A API não confirmou status saudável.");
  const imageContents = new Map();
  for (let i = 1; i <= 5; i += 1) {
    const filename = `produc-image-${i}.jpeg`;
    const filePath = path.join(FRONTEND_PUBLIC, filename);
    const buffer = await fs.readFile(filePath).catch(() => null);
    if (!buffer)
      throw new Error(`Não encontrei a imagem original: ${filePath}`);
    imageContents.set(filename, buffer.toString("base64"));
  }

  const [oldProducts, oldCategories] = await Promise.all([
    request("/v1/product/search?limit=-1"),
    request("/v1/category/search?limit=-1"),
  ]);
  if (
    !Array.isArray(oldProducts?.data) ||
    !Array.isArray(oldCategories?.data)
  ) {
    throw new Error(
      "A API não retornou as listas de produtos e categorias no formato esperado.",
    );
  }

  console.log("\nA operação abaixo substituirá os dados atuais:");
  console.log(`- Produtos a excluir: ${oldProducts.data.length}`);
  console.log(`- Categorias a excluir: ${oldCategories.data.length}`);
  console.log(
    "- Novas categorias: Tênis Casuais, Tênis Streetwear e Tênis Esportivos",
  );
  console.log("- Novos produtos: 5 tênis, com as cinco imagens JPEG originais");
  console.log(
    "- Usuários, banco de estrutura, migrations e código NÃO serão apagados.",
  );
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const confirmation = await rl.question(
    "\nPara confirmar a substituição, digite SUBSTITUIR: ",
  );
  rl.close();
  if (confirmation.trim() !== "SUBSTITUIR") {
    console.log("Operação cancelada. Nenhum dado foi alterado.");
    return;
  }

  // Primeiro remove produtos: assim os vínculos com categorias são removidos.
  for (const product of oldProducts.data) {
    await request(`/v1/product/${product.id}`, { method: "DELETE" });
    console.log(`Produto antigo excluído: ${product.name} (id ${product.id})`);
  }
  for (const category of oldCategories.data) {
    await request(`/v1/category/${category.id}`, { method: "DELETE" });
    console.log(
      `Categoria antiga excluída: ${category.name} (id ${category.id})`,
    );
  }

  const categoryIds = new Map();
  for (const category of categories) {
    const created = await request("/v1/category", {
      method: "POST",
      body: category,
    });
    categoryIds.set(category.name, created.id);
    console.log(`Categoria criada: ${created.name} (id ${created.id})`);
  }

  for (const product of products) {
    const { image, category, sizes, ...fields } = product;
    const created = await request("/v1/product", {
      method: "POST",
      body: {
        enabled: true,
        use_in_menu: false,
        brand: "Drip Store",
        ...fields,
        category_ids: [categoryIds.get(category)],
        images: [
          {
            type: "image/jpeg",
            content: imageContents.get(image),
            enabled: true,
          },
        ],
        options: [
          {
            title: "Tamanho",
            shape: "square",
            radius: 0,
            type: "text",
            values: sizes,
          },
        ],
      },
    });
    console.log(
      `Produto criado: ${created.name} (id ${created.id}) — imagem ${image}`,
    );
  }

  const [finalProducts, finalCategories] = await Promise.all([
    request("/v1/product/search?limit=-1"),
    request("/v1/category/search?limit=-1"),
  ]);
  console.log("\nSubstituição concluída.");
  console.log(`Categorias cadastradas: ${finalCategories.total}`);
  console.log(`Produtos cadastrados: ${finalProducts.total}`);
  console.log(
    "As imagens foram enviadas à API e salvas na pasta media do backend.",
  );
}

main().catch((error) => {
  console.error("\nERRO:", error.message);
  process.exitCode = 1;
});
