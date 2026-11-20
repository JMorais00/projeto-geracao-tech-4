import { useEffect, useState } from "react";
import Layout from "../Layout";
import Gallery from "../../components/Gallery";
import Section from "../../components/Section";
import ProductListing from "../../components/ProductListing";
import { getProducts, mapProduct } from "../../services/api";
import styles from "./HomePage.module.css";

const slideImages = [
  { src: "/home-slide-1.jpeg" },
  { src: "/home-slide-2.jpeg" },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getProducts({ limit: "-1", fields: "id,enabled,name,slug,price,price_with_discount,images" })
      .then((result) => {
        if (active) setProducts((result.data || []).filter((item) => item.enabled).slice(0, 8).map(mapProduct));
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <Layout>
      <Gallery images={slideImages} width="1440px" height="681px" />

      <Section title="Coleções em destaque" titleAlign="center">
        <div className={styles.collections}>
          <img src="/collection-1.png" alt="Coleção 1" className={styles.collectionImg} />
          <img src="/collection-2.png" alt="Coleção 2" className={styles.collectionImg} />
          <img src="/collection-3.png" alt="Coleção 3" className={styles.collectionImg} />
        </div>
      </Section>

      <Section title="Produtos em alta" titleAlign="left" link={{ text: "Ver todos →", href: "/produtos" }}>
        {loading ? <p>Carregando produtos...</p> : error ? <p>Não foi possível carregar os produtos: {error}</p> : <ProductListing products={products} />}
      </Section>
    </Layout>
  );
}
