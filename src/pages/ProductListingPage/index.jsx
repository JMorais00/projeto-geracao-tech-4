import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../Layout";
import Section from "../../components/Section";
import ProductListing from "../../components/ProductListing";
import FilterGroup from "../../components/FilterGroup";
import styles from "./ProductListingPage.module.css";
import { getProducts, getCategories, mapProduct } from "../../services/api";

export default function ProductListingPage() {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") || "";
  const [sortOrder, setSortOrder] = useState("price-asc");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getProducts({
        limit: "-1",
        fields:
          "id,enabled,name,slug,price,price_with_discount,brand,category_ids,images",
      }),
      getCategories(),
    ])
      .then(([productResult, categoryResult]) => {
        if (!active) return;
        setProducts(
          (productResult.data || [])
            .filter((item) => item.enabled)
            .map(mapProduct),
        );
        setCategories(categoryResult.data || []);
        setError("");
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const brandOptions = useMemo(
    () =>
      [...new Set(products.map((p) => p.brand).filter(Boolean))]
        .sort()
        .map((text) => ({ text })),
    [products],
  );
  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        text: category.name,
        value: String(category.id),
      })),
    [categories],
  );

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchTerm ||
      `${product.name} ${product.description || ""} ${product.brand || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesBrand =
      selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.some((id) =>
        (product.category_ids || []).map(String).includes(id),
      );
    return matchesSearch && matchesBrand && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.priceDiscount || a.price;
    const priceB = b.priceDiscount || b.price;
    return sortOrder === "price-asc" ? priceA - priceB : priceB - priceA;
  });

  return (
    <Layout>
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <div className={styles.sortContainer}>
            <label className={styles.sortLabel}>Ordenar por</label>
            <select
              className={styles.sortSelect}
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            >
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
            </select>
          </div>
          <div className={styles.filterCard}>
            <h3 className={styles.filterTitle}>Filtrar por</h3>
            <hr className={styles.divider} />
            <FilterGroup
              title="Marca"
              options={brandOptions}
              selectedOptions={selectedBrands}
              onChange={(value) =>
                setSelectedBrands((prev) =>
                  prev.includes(value)
                    ? prev.filter((item) => item !== value)
                    : [...prev, value],
                )
              }
            />
            <FilterGroup
              title="Categoria"
              options={categoryOptions}
              selectedOptions={selectedCategories}
              onChange={(value) =>
                setSelectedCategories((prev) =>
                  prev.includes(value)
                    ? prev.filter((item) => item !== value)
                    : [...prev, value],
                )
              }
            />
          </div>
        </aside>
        <section className={styles.content}>
          <Section
            title={`Resultados${searchTerm ? ` para "${searchTerm}"` : ""} - ${filteredProducts.length} produtos`}
            titleAlign="left"
          >
            {loading ? (
              <p>Carregando produtos...</p>
            ) : error ? (
              <p>Não foi possível carregar os produtos: {error}</p>
            ) : (
              <ProductListing products={sortedProducts} />
            )}
          </Section>
        </section>
      </div>
    </Layout>
  );
}
