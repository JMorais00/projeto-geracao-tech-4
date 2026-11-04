import styles from "./ProductCard.module.css";

export default function ProductCard({ image, name, price, priceDiscount }) {
  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <img src={image} alt={name} className={styles.image} />
      </div>
      <h3 className={styles.name}>{name}</h3>
      <div className={styles.prices}>
        {priceDiscount ? (
          <>
            <span className={styles.oldPrice}>${price}</span>
            <span className={styles.discountPrice}>${priceDiscount}</span>
          </>
        ) : (
          <span className={styles.regularPrice}>${price}</span>
        )}
      </div>
    </div>
  );
}
