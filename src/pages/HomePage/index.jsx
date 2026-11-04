import Layout from "../Layout";
import Gallery from "../../components/Gallery";
import Section from "../../components/Section";
import ProductListing from "../../components/ProductListing";
import styles from "./HomePage.module.css";

const slideImages = [
  { src: "/home-slide-1.jpeg" },
  { src: "/home-slide-2.jpeg" },
];

const featuredProducts = [
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-1.jpeg",
    price: 200,
    priceDiscount: 149.9,
  },
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-2.jpeg",
    price: 200,
    priceDiscount: 149.9,
  },
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-1.jpeg",
    price: 200,
  },
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-2.jpeg",
    price: 200,
  },
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-1.jpeg",
    price: 200,
    priceDiscount: 149.9,
  },
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-2.jpeg",
    price: 200,
  },
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-1.jpeg",
    price: 200,
  },
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-2.jpeg",
    price: 200,
    priceDiscount: 149.9,
  },
];

export default function HomePage() {
  return (
    <Layout>
      <Gallery images={slideImages} width="1440px" height="681px" />

      <Section title="Coleções em destaque" titleAlign="center">
        <div className={styles.collections}>
          <img
            src="/collection-1.png"
            alt="Coleção 1"
            className={styles.collectionImg}
          />
          <img
            src="/collection-2.png"
            alt="Coleção 2"
            className={styles.collectionImg}
          />
          <img
            src="/collection-3.png"
            alt="Coleção 3"
            className={styles.collectionImg}
          />
        </div>
      </Section>

      <Section
        title="Produtos em alta"
        titleAlign="left"
        link={{ text: "Ver todos →", href: "/produtos" }}
      >
        <ProductListing products={featuredProducts} />
      </Section>
    </Layout>
  );
}
