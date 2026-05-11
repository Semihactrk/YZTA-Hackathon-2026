import { NavLink, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getMyOrderIds } from "../pages/OrdersPage";

interface StoreNavbarProps {
  onCartClick: () => void;
}

export default function StoreNavbar({ onCartClick }: StoreNavbarProps) {
  const { count } = useCart();
  const hasOrders = getMyOrderIds().length > 0;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🌿 Toprak Ana</Link>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          Ürünler
        </NavLink>
        {/* Sadece daha önce sipariş verdiyse göster */}
        {hasOrders && (
          <NavLink to="/orders" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            📦 Siparişlerim
          </NavLink>
        )}
      </div>
      <button className="navbar-cart" onClick={onCartClick}>
        🛒 Sepet
        {count > 0 && <span className="cart-count">{count}</span>}
      </button>
    </nav>
  );
}
