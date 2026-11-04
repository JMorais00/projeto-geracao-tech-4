import styles from "./Logo.module.css";
import logoHeader from "../../assets/logo-header.svg";

export default function Logo() {
  return (
    <div className={styles.logo}>
      <img src={logoHeader} alt="Digital Store" className={styles.image} />
    </div>
  );
}
