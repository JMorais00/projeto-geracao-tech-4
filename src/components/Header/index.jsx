import { NavLink } from "react-router-dom";
import Logo from "../Logo";
import styles from "./Header.module.css";
import cartIcon from "../../assets/mini-cart.svg";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.topHeader}>
        <Logo />

        <form className={styles.searchForm}>
          <input
            type="text"
            placeholder="Pesquisar produto..."
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            <span className={styles.searchIcon}>⌕</span>
          </button>
        </form>

        <div className={styles.actions}>
          <NavLink to="/cadastrar" className={styles.registerLink}>
            Cadastre-se
          </NavLink>

          <NavLink to="/login" className={styles.loginBtn}>
            Entrar
          </NavLink>

          <img
            src={cartIcon}
            alt="Carrinho de compras"
            className={styles.cartIcon}
          />
        </div>
      </div>

      <nav className={styles.nav}>
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/produtos">Produtos</NavLink>
        <NavLink to="/categorias">Categorias</NavLink>
        <NavLink to="/pedidos">Meus Pedidos</NavLink>
      </nav>
    </header>
  );
}
