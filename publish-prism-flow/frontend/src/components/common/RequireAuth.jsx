import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Route guard. Wrap private layout with this — it gates every nested route.
 * Shows a tiny loader while we rehydrate the session from the stored token.
 */
export default function RequireAuth() {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "init") {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        Loading session...
      </div>
    );
  }

  if (!user) {
    // Preserve where the user wanted to go so we can return after login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
