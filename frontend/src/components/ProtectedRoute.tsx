import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <p>載入中...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RoleRoute({ roles }: { roles: UserRole[] }) {
  const { user, loading } = useAuth();

  if (loading) return <p>載入中...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <p>無此頁面權限</p>;
  return <Outlet />;
}
