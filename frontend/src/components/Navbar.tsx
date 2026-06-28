import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        AIUMStore
      </Link>
      <div className="nav-links">
        <Link to="/">商品</Link>
        <Link to="/cart">購物車</Link>
        <Link to="/guest-checkout">到店取貨</Link>
        {user?.role === "member" && <Link to="/orders">我的訂單</Link>}
        {user?.role === "member" && <Link to="/favorites">我的最愛</Link>}
        {(user?.role === "firm" || user?.role === "superuser") && (
          <Link to="/firm">店家後台</Link>
        )}
        {user ? (
          <>
            <span>
              嗨, {user.username}
              {user.member_profile && (
                <> (LV{user.member_profile.level} · {user.member_profile.points} 點)</>
              )}
            </span>
            <button onClick={() => logout()}>登出</button>
          </>
        ) : (
          <>
            <Link to="/login">登入</Link>
            <Link to="/register">註冊</Link>
          </>
        )}
      </div>
    </nav>
  );
}
