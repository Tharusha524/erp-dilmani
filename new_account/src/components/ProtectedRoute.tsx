import React, { useEffect } from "react";
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
  //
  // Also wait when a token exists but `user` hasn't loaded yet, even if
  // `initializing` has already flipped back to false (e.g. right after
  // login navigates here before the user object finishes populating) —
  // otherwise a permission check below can run against a still-null user
  // and make the wrong call for a split second.
  const hasToken = !!localStorage.getItem("token");
  const stuckWaiting = !user && hasToken;

  // Self-heal: this wait is normally over almost instantly. If it's ever
  // stuck for more than a couple seconds (e.g. in-memory auth state got out
  // of sync), recover with a single real reload instead of leaving the user
  // staring at a loader/blank screen forever.
  useEffect(() => {
    if (!stuckWaiting) return;
    const timer = window.setTimeout(() => window.location.reload(), 2500);
    return () => window.clearTimeout(timer);
  }, [stuckWaiting]);

  if (!user) {
    if (initializing || hasToken) return <PageLoader />;

    // If not initializing, no token, and no user, redirect to login (root).
    // Keep the current location in state so login can redirect back after signin.
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
