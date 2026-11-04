import logoFooter from "../../assets/logo-footer.svg";
import styles from "./Footer.module.css";

import facebook from "../../assets/facebook.svg";
import instagram from "../../assets/instagram.svg";
import twitter from "../../assets/twitter.svg";

const information = [
  {
    title: "Informação",
    links: [
      "Sobre Drip Store",
      "Segurança",
      "Wishlist",
      "Blog",
      "Trabalhe conosco",
      "Meus Pedidos",
    ],
  },
  {
    title: "Categorias",
    links: ["Camisetas", "Calças", "Bonés", "Headphones", "Tênis"],
  },
  {
    title: "Contato",
    links: [
      "Av. Santos Dumont, 1510 - 1º andar - Aldeota, Fortaleza - CE",
      "(85) 3051-3411",
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.brandCol}>
          <img src={logoFooter} alt="Digital Store" className={styles.logo} />
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>

          <div className={styles.social}>
            <a href="#" aria-label="Facebook">
              <img src={facebook} alt="" />
            </a>
            <a href="#" aria-label="Instagram">
              <img src={instagram} alt="" />
            </a>
            <a href="#" aria-label="Twitter">
              <img src={twitter} alt="" />
            </a>
          </div>
        </div>

        {information.map((item) => (
          <div className={styles.infoCol} key={item.title}>
            <h3>{item.title}</h3>
            {item.links.map((link) => (
              <a href="#" key={link}>
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>

      <hr className={styles.divider} />

      <p className={styles.copy}>© 2024 Digital Store</p>
    </footer>
  );
}
