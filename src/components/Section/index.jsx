import styles from "./Section.module.css";

export default function Section({
  title,
  titleAlign = "left",
  link,
  children,
}) {
  const titleClass =
    titleAlign === "center" ? styles.alignCenter : styles.alignLeft;

  return (
    <section className={styles.sectionContainer}>
      <div className={`${styles.header} ${titleClass}`}>
        {title && <h2 className={styles.title}>{title}</h2>}
        {link && (
          <a href={link.href} className={styles.link}>
            {link.text}
          </a>
        )}
      </div>
      <div className={styles.content}>{children}</div>
    </section>
  );
}
