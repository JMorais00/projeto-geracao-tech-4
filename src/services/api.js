const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

async function request(path) {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    let message = `Erro ${response.status} ao consultar a API`;
    try {
      const body = await response.json();
      if (body.message) message = body.message;
    } catch {
      // Mantém a mensagem HTTP quando a resposta não for JSON.
    }
    throw new Error(message);
  }
  return response.json();
}

export function getProducts(params = {}) {
  const query = new URLSearchParams({ limit: "-1", ...params });
  return request(`/v1/product/search?${query.toString()}`);
}

export function getProduct(id) {
  return request(`/v1/product/${encodeURIComponent(id)}`);
}

export function getCategories() {
  return request("/v1/category/search?limit=-1");
}

export function getImageUrl(path) {
  if (!path) return "/product-thumb-1.jpeg";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function mapProduct(product) {
  const enabledImages = (product.images || []).filter((image) => image.enabled !== false);
  const image = enabledImages[0] || product.images?.[0];
  return {
    ...product,
    image: getImageUrl(image?.content || image?.path),
    priceDiscount: Number(product.price_with_discount) > 0
      ? Number(product.price_with_discount)
      : null,
    price: Number(product.price || 0),
  };
}
