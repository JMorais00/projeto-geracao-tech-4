import ProductOptions from "../ProductOptions";
import styles from "./BuyBox.module.css";

const currency = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function BuyBox({ product }) {
  if (!product) return null;
  const discounted = Number(product.price_with_discount) > 0;
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{product.name}</h1>
      <p className={styles.reference}>
        {product.brand || "Drip Store"}{product.reference ? ` | REF: ${product.reference}` : ""}
      </p>
      {product.rating != null && (
        <div className={styles.rating}>
          <span>★</span>
          <strong>{Number(product.rating).toFixed(1)}</strong>
          <span>({product.reviews_count || 0} avaliações)</span>
        </div>
      )}
      <div className={styles.price}>
        {discounted ? (
          <>
            <span>{currency(product.price_with_discount)}</span>
            <del style={{ color: "var(--light-gray)", fontSize: 16 }}>{currency(product.price)}</del>
          </>
        ) : <strong>{currency(product.price)}</strong>}
      </div>
      {product.description && (
        <div className={styles.description}>
          <h2>Descrição do produto</h2>
          <p>{product.description}</p>
        </div>
      )}
      {product.options?.length > 0 && <ProductOptions options={product.options} />}
      <p>Estoque disponível: {product.stock ?? 0}</p>
      <button type="button" className={styles.buyButton} disabled={Number(product.stock) <= 0}>
        {Number(product.stock) > 0 ? "COMPRAR" : "INDISPONÍVEL"}
      </button>
    </div>
  );
}
