import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import PageLoader from "./PageLoader";
import { useAuth } from "../context/AuthContext";

type Props = {
  required?: number | number[] | string | string[];
  children?: React.ReactNode;
};

const ProtectedRoute: React.FC<Props> = ({ required, children }) => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();
  const { initializing } = useAuth();

  // While auth is initializing (restoring session from token), don't
  // redirect — show a loader and keep the current URL so a page refresh
  // doesn't bounce the user back to login/dashboard.
  if (!user) {
    if (initializing) return <PageLoader />;

    // If not initializing and no user, redirect to login (root). Keep
    // the current location in state so login can redirect back after signin.
    //return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!required) return children ? <>{children}</> : <Outlet />;

  const reqs = Array.isArray(required) ? required : [required];

  const allowed = reqs.some((r) => {
    if (typeof r === "number") return hasPermission(r);
    return hasPermission(r as string);
  });

  return allowed ? (children ? <>{children}</> : <Outlet />) : <Navigate to="/not-authorized" replace />;
};

export default ProtectedRoute;
