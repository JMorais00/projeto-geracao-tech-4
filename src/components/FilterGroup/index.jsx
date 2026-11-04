import styles from "./FilterGroup.module.css";

export default function FilterGroup({
  title,
  inputType = "checkbox",
  options = [],
  selectedOptions = [],
  onChange,
}) {
  return (
    <div className={styles.filterGroup}>
      <h4 className={styles.title}>{title}</h4>
      <div className={styles.optionsList}>
        {options.map((option, idx) => (
          <label key={idx} className={styles.optionItem}>
            <input
              type={inputType}
              name={title}
              value={option.value || option.text}
              className={styles.input}
              checked={selectedOptions.includes(option.value || option.text)}
              onChange={() => onChange(option.value || option.text)}
            />
            <span className={styles.label}>{option.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
