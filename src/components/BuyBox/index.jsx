import ProductOptions from "../ProductOptions";
import styles from "./BuyBox.module.css";

export default function BuyBox() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Tênis Nike Revolution 6 Next Nature Masculino
      </h1>

      <p className={styles.reference}>Casual | Nike | REF:38416711</p>

      <div className={styles.rating}>
        <span>★</span>
        <strong>4.7</strong>
        <span>(90 avaliações)</span>
      </div>

      <div className={styles.price}>
        <span>R$</span>
        <strong>219,00</strong>
      </div>

      <div className={styles.description}>
        <h2>Descrição do produto</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco.
        </p>
      </div>

      <ProductOptions />

      <button type="button" className={styles.buyButton}>
        COMPRAR
      </button>
    </div>
  );
}
