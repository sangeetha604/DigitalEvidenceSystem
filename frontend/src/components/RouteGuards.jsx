import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { SpinnerIcon } from "./icons";

function FullPageLoader() {
  return (
    <div
      className="font-brand flex min-h-screen items-center justify-center bg-slate-50 text-slate-500"
      role="status"
    >
      <SpinnerIcon className="h-6 w-6" />
      <span className="ml-3 text-sm">Checking your session…</span>
    </div>
  );
}

// Only logged-in users can open the page. Everyone else goes to /login.
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

// Login / signup / forgot-password pages: logged-in users go straight
// to the dashboard instead.
export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
