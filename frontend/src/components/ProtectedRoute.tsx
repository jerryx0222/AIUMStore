import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import type { PersonLevel } from "../types";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <p>載入中...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RoleRoute({ roles }: { roles: PersonLevel[] }) {
  const { user, loading } = useAuth();

  if (loading) return <p>載入中...</p>;
  if (!user) return <Navigate to="/login" replace />;
  // superuser 無使用限制，不受角色清單限制
  if (!user.is_superuser && !roles.includes(user.level)) return <p>無此頁面權限</p>;
  return <Outlet />;
}
