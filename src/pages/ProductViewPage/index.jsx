import Layout from "../Layout";
import Gallery from "../../components/Gallery";
import BuyBox from "../../components/BuyBox";
import styles from "./ProductViewPage.module.css";
import Section from "../../components/Section";
import ProductListing from "../../components/ProductListing";

const productImages = [
  { src: "/product-thumb-1.jpeg" },
  { src: "/product-thumb-2.jpeg" },
];

const relatedProducts = [
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-1.jpeg",
    price: 200,
    priceDiscount: 100,
  },
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-2.jpeg",
    price: 200,
    priceDiscount: 100,
  },
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-1.jpeg",
    price: 200,
    priceDiscount: 100,
  },
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-2.jpeg",
    price: 200,
    priceDiscount: 100,
  },
];

export default function ProductViewPage() {
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.gallery}>
          <Gallery
            images={productImages}
            width="700px"
            height="570px"
            showThumbs
          />
        </div>

        <div className={styles.buyBox}>
          <BuyBox />
        </div>
      </div>
      <Section
        title="Produtos Relacionados"
        titleAlign="left"
        link={{ text: "Ver todos", href: "/produtos" }}
      >
        <ProductListing products={relatedProducts} />
      </Section>
    </Layout>
  );
}
