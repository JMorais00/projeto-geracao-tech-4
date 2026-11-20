import { useState } from "react";
import styles from "./ProductOptions.module.css";

export default function ProductOptions({ options = [] }) {
  const [selected, setSelected] = useState({});

  return (
    <div className={styles.container}>
      {options.map((option) => {
        const values = Array.isArray(option.values) ? option.values : [];
        return (
          <div key={option.id || option.title}>
            <h3 className={styles.title}>{option.title}</h3>
            <div className={styles.options}>
              {values.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected[option.id] === value}
                  className={`${styles.option} ${selected[option.id] === value ? styles.selected : ""}`}
                  onClick={() => setSelected((current) => ({ ...current, [option.id]: value }))}
                  style={option.type === "color" ? { backgroundColor: value, color: "transparent" } : undefined}
                >
                  {option.type === "color" ? value : value}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
