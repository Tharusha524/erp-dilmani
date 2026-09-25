import React, { createContext, useContext, useEffect, useRef } from "react";
import { validateUser, User } from "../api/userApi";
import { getSecurityRole } from "../api/AccessSetup/AccessSetupApi";
import PERMISSION_ID_MAP from "../permissions/map";
import { useAuthStore } from "../store/authStore";
import { isDesktopApp, cacheAuthenticatedUser, getCachedUser } from "../offline/db";

type AuthContextType = {
  user: User | null;
  permissions: Set<number>;
  hasPermission: (idOrName: number | string) => boolean;
  hasEditPermission: (idOrName: number | string) => boolean;
  reloadPermissions: () => Promise<void>;
  initializing: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  permissions: new Set<number>(),
  hasPermission: () => false,
  hasEditPermission: () => false,
  reloadPermissions: async () => {},
  initializing: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const permissionIds = useAuthStore((s) => s.permissionIds);
  const editPermissionIds = useAuthStore((s) => s.editPermissionIds);
  const initializing = useAuthStore((s) => s.initializing);
  const setUser = useAuthStore((s) => s.setUser);
  const setPermissionIds = useAuthStore((s) => s.setPermissionIds);
  const setEditPermissionIds = useAuthStore((s) => s.setEditPermissionIds);
  const setInitializing = useAuthStore((s) => s.setInitializing);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const loadingRef = useRef(false);
  const permissions = new Set(permissionIds);
  const editPermissions = new Set(editPermissionIds);

  const parseIds = (s?: string | null) => {
    if (!s) return [] as number[];
    return s
      .split(";")
      .map((x) => Number(x))
      .filter((n) => !Number.isNaN(n));
  };

  const loadFromRoleId = async (roleId: string | number) => {
    try {
      const role = await getSecurityRole(roleId);
      const sections = parseIds(role?.sections);
      const areas = parseIds(role?.areas);
      setPermissionIds(sections);
      setEditPermissionIds(areas);
    } catch (err) {
      console.error("Failed to load role permissions", err);
      setPermissionIds([]);
      setEditPermissionIds([]);
    }
  };

  // Desktop app only: cached sessions live in SQLite (users table), not
  // localStorage — survives the same way products/customers do, and is
  // synced down the same way. LAST_USER_ID_KEY is just a pointer (not a
  // credential) to which cached row belongs to this machine's last login.
  const LAST_USER_ID_KEY = "last_user_id";

  const writeCachedAuth = async (u: User, permissionIds: number[], editPermissionIds: number[]) => {
    if (!isDesktopApp()) return;
    const id = String((u as any)?.id ?? (u as any)?.user_id ?? "");
    if (!id) return;
    try {
      await cacheAuthenticatedUser(id, (u as any)?.email ?? null, (u as any)?.first_name ?? (u as any)?.name ?? null, JSON.stringify(u), permissionIds, editPermissionIds);
      localStorage.setItem(LAST_USER_ID_KEY, id);
    } catch {
      // Offline auto-login just won't have a fresh cache to fall back on.
    }
  };

  const readCachedAuth = async (): Promise<{ user: User; permissionIds: number[]; editPermissionIds: number[] } | null> => {
    if (!isDesktopApp()) return null;
    const id = localStorage.getItem(LAST_USER_ID_KEY);
    if (!id) return null;
    try {
      const row = await getCachedUser(id);
      if (!row) return null;
      return {
        user: JSON.parse(row.user_json),
        permissionIds: JSON.parse(row.permission_ids),
        editPermissionIds: JSON.parse(row.edit_permission_ids),
      };
    } catch {
      return null;
    }
  };

  const reloadPermissions = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setInitializing(true);
    try {
      // Check if token exists before making API call
      const token = localStorage.getItem("token");
      if (!token) {
        clearAuth();
        return;
      }

        const u = await validateUser();
        setUser(u || null);

  if ((u as any)?.sections || (u as any)?.areas) {
            // sections = pages the user can view; areas = pages within that
            // set the user can also edit (checked "Edit" alongside "View")
            const parseArr = (arr?: (string|number)[]) =>
                (arr || []).map((x) => Number(x)).filter((n) => !Number.isNaN(n));

            const sections = parseArr((u as any).sections);
            const areas = parseArr((u as any).areas);
            setPermissionIds(sections);
            setEditPermissionIds(areas);
            if (u) await writeCachedAuth(u, sections, areas);
        } else {
            // fallback: if role_id present but no sections returned, fetch role
            const roleId = (u as any)?.role_id || (u as any)?.roleId || (u as any)?.role;
            if (roleId) {
                await loadFromRoleId(roleId);
            } else {
                setPermissionIds([]);
                setEditPermissionIds([]);
            }
            if (u) await writeCachedAuth(u, [], []);
        }
    } catch (err) {
      // If the token is missing/invalid, the backend returns 401 — that's a
      // real "you're logged out", so clear everything and remove the token.
      const status = (err as any)?.response?.status;
      if (status === 401) {
        try {
          localStorage.removeItem("token");
        } catch {}
        clearAuth();
        return;
      }

      // No response at all means the request never reached the server —
      // offline, most likely (the desktop app can be opened with no
      // internet at all). Don't force a login screen the cashier can't get
      // past: trust the last verified session from this same token instead,
      // and let the next successful reloadPermissions (once back online)
      // re-verify it for real.
      const isNetworkError = !(err as any)?.response;
      if (isNetworkError) {
        const cached = await readCachedAuth();
        if (cached) {
          setUser(cached.user);
          setPermissionIds(cached.permissionIds);
          setEditPermissionIds(cached.editPermissionIds);
          return;
        }
      }

      // For other errors, or no cache to fall back on, log and clear state.
      console.error("reloadPermissions error", (err as any)?.message || err);
      clearAuth();
    } finally {
      loadingRef.current = false;
      setInitializing(false);
    }
  };

  useEffect(() => {
    reloadPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPermission = (idOrName: number | string) => {
    // Accounts created before per-user/role access enforcement was added stay
    // ungated (their pre-existing behaviour is preserved); only accounts
    // created after that point have `strict_access` and are actually checked.
    if (!(user as any)?.strict_access) return true;

    // if user has an admin role string, allow all
    const roleStr = (user as any)?.role;
    if (roleStr === "Admin" || (user as any)?.is_admin) return true;

    if (typeof idOrName === "number") return permissions.has(idOrName);
    // name provided -> map to id(s)
    const id = PERMISSION_ID_MAP[idOrName];
    if (id) return permissions.has(id);
    return false;
  };

  // Whether the user can perform add/edit/delete actions on a page, as
  // opposed to only viewing it. A page only ever appears here if it's also
  // in `permissions` (View is a prerequisite for Edit in the Access Setup UI).
  const hasEditPermission = (idOrName: number | string) => {
    if (!(user as any)?.strict_access) return true;

    const roleStr = (user as any)?.role;
    if (roleStr === "Admin" || (user as any)?.is_admin) return true;

    if (typeof idOrName === "number") return editPermissions.has(idOrName);
    const id = PERMISSION_ID_MAP[idOrName];
    if (id) return editPermissions.has(id);
    return false;
  };

  return (
    <AuthContext.Provider
      value={{ user, permissions, hasPermission, hasEditPermission, reloadPermissions, initializing }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
