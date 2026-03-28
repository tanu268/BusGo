import { Navigate } from "react-router-dom";

type User = {
  username: string;
  email: string;
  is_staff: boolean;
};

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({
  user,
  children,
  adminOnly = false,
}: ProtectedRouteProps) {

  // not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // admin route check
  if (adminOnly && !user.is_staff) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}