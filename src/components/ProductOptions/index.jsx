import { useState } from "react";
import styles from "./ProductOptions.module.css";

const sizes = ["39", "40", "41", "42", "43"];

export default function ProductOptions() {
  const [selectedSize, setSelectedSize] = useState("");

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Tamanho</h3>

      <div className={styles.options}>
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            className={`${styles.option} ${
              selectedSize === size ? styles.selected : ""
            }`}
            onClick={() => setSelectedSize(size)}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
