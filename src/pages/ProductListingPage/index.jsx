import Layout from "../Layout";
import Section from "../../components/Section";
import ProductListing from "../../components/ProductListing";
import FilterGroup from "../../components/FilterGroup";
import styles from "./ProductListingPage.module.css";
import { useState } from "react";

const productsData = [
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-1.jpeg",
    price: 200,
    priceDiscount: 149.9,
    brand: "K-Swiss",
    category: "Casual",
  },
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-2.jpeg",
    price: 200,
    brand: "K-Swiss",
    category: "Casual",
  },
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-1.jpeg",
    price: 200,
    priceDiscount: 149.9,
    brand: "K-Swiss",
    category: "Casual",
  },
  {
    name: "K-Swiss V8 - Masculino",
    image: "/product-thumb-2.jpeg",
    price: 200,
    brand: "K-Swiss",
    category: "Casual",
  },
];

const markOptions = [
  { text: "Adidas" },
  { text: "Calenciaga" },
  { text: "K-Swiss" },
  { text: "Nike" },
  { text: "Puma" },
];

const categoryOptions = [
  { text: "Esporte e Lazer" },
  { text: "Casual" },
  { text: "Utilitário" },
  { text: "Corrida" },
];

export default function ProductListingPage() {
  const [sortOrder, setSortOrder] = useState("price-asc");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const filteredProducts = productsData.filter((product) => {
    const matchesBrand =
      selectedBrands.length === 0 || selectedBrands.includes(product.brand);

    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(product.category);

    return matchesBrand && matchesCategory;
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
              inputType="checkbox"
              options={markOptions}
              selectedOptions={selectedBrands}
              onChange={(value) => {
                setSelectedBrands((prev) =>
                  prev.includes(value)
                    ? prev.filter((item) => item !== value)
                    : [...prev, value],
                );
              }}
            />

            <FilterGroup
              title="Categoria"
              inputType="checkbox"
              options={categoryOptions}
              selectedOptions={selectedCategories}
              onChange={(value) => {
                setSelectedCategories((prev) =>
                  prev.includes(value)
                    ? prev.filter((item) => item !== value)
                    : [...prev, value],
                );
              }}
            />
          </div>
        </aside>

        <section className={styles.content}>
          <Section
            title={`Resultados para "Tênis" - ${filteredProducts.length} produtos`}
            titleAlign="left"
          >
            <ProductListing products={sortedProducts} />
          </Section>
        </section>
      </div>
    </Layout>
  );
}
