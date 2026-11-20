import { Link } from "react-router-dom";
import styles from "./ProductCard.module.css";

export default function ProductCard({ id, image, name, price, priceDiscount }) {
  return (
    <Link to={id ? `/product/${id}` : "/produtos"} className={styles.card}>
      <div className={styles.imageContainer}>
        <img src={image} alt={name} className={styles.image} />
      </div>
      <h3 className={styles.name}>{name}</h3>
      <div className={styles.prices}>
        {priceDiscount ? (
          <>
            <span className={styles.oldPrice}>R$ {Number(price).toFixed(2).replace(".", ",")}</span>
            <span className={styles.discountPrice}>R$ {Number(priceDiscount).toFixed(2).replace(".", ",")}</span>
          </>
        ) : (
          <span className={styles.regularPrice}>R$ {Number(price).toFixed(2).replace(".", ",")}</span>
        )}
      </div>
    </Link>
  );
}
