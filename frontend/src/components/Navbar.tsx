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
        {user?.level === "member" && <Link to="/orders">我的訂單</Link>}
        {user?.level === "member" && <Link to="/favorites">我的最愛</Link>}
        {(user?.is_superuser || user?.level === "store_owner") && (
          <Link to="/store">門市後台</Link>
        )}
        {(user?.is_superuser || user?.level === "franchise_master") && (
          <Link to="/franchise/store-owners">門市管理</Link>
        )}
        {(user?.is_superuser ||
          user?.level === "store_owner" ||
          user?.level === "franchise_master" ||
          user?.level === "brand_owner") && <Link to="/management">管理維護頁</Link>}
        {user ? (
          <>
            <span>
              嗨, {user.name || user.username}
              {user.level === "member" && user.member_level != null && (
                <> (LV{user.member_level} · {user.points} 點)</>
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
