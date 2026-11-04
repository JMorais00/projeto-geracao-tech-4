import ProductCard from "../ProductCard";
import styles from "./ProductListing.module.css";

export default function ProductListing({ products = [] }) {
  return (
    <div className={styles.grid}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id || index}
          image={product.image}
          name={product.name}
          price={product.price}
          priceDiscount={product.priceDiscount}
        />
      ))}
    </div>
  );
}
