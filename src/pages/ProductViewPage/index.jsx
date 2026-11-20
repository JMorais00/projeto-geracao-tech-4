import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../Layout";
import Gallery from "../../components/Gallery";
import BuyBox from "../../components/BuyBox";
import styles from "./ProductViewPage.module.css";
import Section from "../../components/Section";
import ProductListing from "../../components/ProductListing";
import {
  getProduct,
  getProducts,
  getImageUrl,
  mapProduct,
} from "../../services/api";

export default function ProductViewPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loadedProductId, setLoadedProductId] = useState(null);
  const loading = loadedProductId !== id;
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      getProduct(id),
      getProducts({
        limit: "-1",
        fields: "id,enabled,name,slug,price,price_with_discount,brand,images",
      }),
    ])
      .then(([item, result]) => {
        if (!active) return;
        setProduct(item);
        setRelated(
          (result.data || [])
            .filter((p) => p.enabled && String(p.id) !== String(id))
            .slice(0, 4)
            .map(mapProduct),
        );
        setError("");
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoadedProductId(id);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const images = (product?.images || []).map((image) => ({
    src: getImageUrl(image.content || image.path),
  }));
  if (!images.length && product?.image)
    images.push({ src: getImageUrl(product.image) });

  return (
    <Layout>
      {loading ? (
        <p>Carregando produto...</p>
      ) : error ? (
        <p>Não foi possível carregar o produto: {error}</p>
      ) : !product ? (
        <p>Produto não encontrado.</p>
      ) : (
        <>
          <div className={styles.container}>
            <div className={styles.gallery}>
              {images.length ? (
                <Gallery
                  images={images}
                  width="700px"
                  height="570px"
                  showThumbs
                />
              ) : (
                <p>Este produto não possui imagens cadastradas.</p>
              )}
            </div>
            <div className={styles.buyBox}>
              <BuyBox product={product} />
            </div>
          </div>
          <Section
            title="Produtos Relacionados"
            titleAlign="left"
            link={{ text: "Ver todos", href: "/produtos" }}
          >
            <ProductListing products={related} />
          </Section>
        </>
      )}
    </Layout>
  );
}
