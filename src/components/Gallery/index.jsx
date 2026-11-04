import { useState } from "react";
import styles from "./Gallery.module.css";
import arrowLeft from "../../assets/arrow-left.svg";
import arrowRight from "../../assets/arrow-right.svg";

export default function Gallery({
  images = [],
  width = "1440px",
  height = "681px",
  radius = "0px",
  showThumbs = false,
  className = "",
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (!images.length) return null;

  return (
    <div
      className={`${styles.galleryContainer} ${className}`}
      style={{ maxWidth: width }}
    >
      <div
        className={styles.mainSlide}
        style={{ height, borderRadius: radius }}
      >
        <button
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <img src={arrowLeft} alt="" />
        </button>

        <img
          src={images[currentIndex]?.src}
          alt={`Slide ${currentIndex + 1}`}
          className={styles.mainImage}
          style={{ borderRadius: radius }}
        />

        <button
          className={`${styles.arrow} ${styles.arrowRight}`}
          onClick={handleNext}
          disabled={currentIndex === images.length - 1}
        >
          <img src={arrowRight} alt="" />
        </button>
      </div>

      {showThumbs && (
        <div className={styles.thumbsContainer}>
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img.src}
              alt={`Thumb ${idx + 1}`}
              className={`${styles.thumb} ${
                currentIndex === idx ? styles.activeThumb : ""
              }`}
              style={{ borderRadius: radius }}
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
