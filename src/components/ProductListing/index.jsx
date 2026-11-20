import ProductCard from "../ProductCard";
import styles from "./ProductListing.module.css";

export default function ProductListing({ products = [] }) {
  if (!products.length) return <p>Nenhum produto encontrado.</p>;

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          image={product.image}
          name={product.name}
          price={product.price}
          priceDiscount={product.priceDiscount}
        />
      ))}
    </div>
  );
}
