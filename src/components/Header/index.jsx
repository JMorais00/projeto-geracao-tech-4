import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "../Logo";
import styles from "./Header.module.css";
import cartIcon from "../../assets/mini-cart.svg";

export default function Header() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  function handleSearch(event) {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `/produtos?q=${encodeURIComponent(term)}` : "/produtos");
  }

  return (
    <header className={styles.header}>
      <div className={styles.topHeader}>
        <Logo />
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar produto..." className={styles.searchInput} />
          <button type="submit" className={styles.searchButton} aria-label="Pesquisar">
            <span className={styles.searchIcon}>⌕</span>
          </button>
        </form>
        <div className={styles.actions}>
          <NavLink to="/cadastrar" className={styles.registerLink}>Cadastre-se</NavLink>
          <NavLink to="/login" className={styles.loginBtn}>Entrar</NavLink>
          <img src={cartIcon} alt="Carrinho de compras" className={styles.cartIcon} />
        </div>
      </div>
      <nav className={styles.nav}>
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/produtos">Produtos</NavLink>
        <NavLink to="/categorias">Categorias</NavLink>
        <NavLink to="/pedidos">Meus Pedidos</NavLink>
      </nav>
    </header>
  );
}
