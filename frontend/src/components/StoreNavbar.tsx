import { NavLink, Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getMyOrderIds } from "../pages/OrdersPage";

interface StoreNavbarProps {
  onCartClick: () => void;
}

export default function StoreNavbar({ onCartClick }: StoreNavbarProps) {
  const { count } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🌿 Toprak Ana</Link>

      <div className="navbar-links">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          Ürünler
        </NavLink>

        {/* Siparişlerim: sadece giriş yapılmışsa göster */}
        {isAuthenticated && (
          <NavLink
            to="/orders"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            📦 Siparişlerim
          </NavLink>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {isAuthenticated ? (
          <>
            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
            >
              👤 {user?.name}
            </NavLink>
            <button
              onClick={handleLogout}
              className="navbar-cart"
              style={{ fontSize: "0.82rem" }}
            >
              Çıkış
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="navbar-cart"
            style={{ fontSize: "0.85rem", textDecoration: "none" }}
          >
            Giriş Yap
          </Link>
        )}

        <button className="navbar-cart" onClick={onCartClick}>
          🛒 Sepet
          {count > 0 && <span className="cart-count">{count}</span>}
        </button>
      </div>
    </nav>
  );
}