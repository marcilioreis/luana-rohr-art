import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import { useGetCurrentUserQuery } from "./authApi";
import { setCredentials, setLoading } from "./authSlice";

interface NormalizedSession {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image?: string | null;
  };
  permissions?: string[];
  roles?: string[];
}

function normalize(data: unknown): NormalizedSession | null {
  if (typeof data !== "object" || data === null) return null;
  const obj = data as Record<string, unknown>;
  const inner = (obj.data ?? obj) as Record<string, unknown>;
  const user = inner.user;
  if (
    user &&
    typeof user === "object" &&
    "id" in user &&
    "email" in user &&
    "name" in user
  ) {
    return {
      user: user as NormalizedSession["user"],
      permissions: Array.isArray(inner.permissions)
        ? (inner.permissions as string[])
        : undefined,
      roles: Array.isArray(inner.roles) ? (inner.roles as string[]) : undefined,
    };
  }
  return null;
}

/**
 * Carrega a sessão (get-session) uma vez e popula o authSlice.
 * Montado na raiz do roteador para que loja pública, conta e admin
 * compartilhem o mesmo estado de autenticação.
 */
export default function SessionBootstrap() {
  const dispatch = useAppDispatch();
  const { data, isSuccess, isLoading } = useGetCurrentUserQuery();

  useEffect(() => {
    if (isLoading) return;
    if (isSuccess && data) {
      const normalized = normalize(data);
      if (normalized) {
        dispatch(
          setCredentials({
            user: normalized.user,
            permissions: normalized.permissions,
            roles: normalized.roles,
          }),
        );
        return;
      }
    }
    dispatch(setLoading(false));
  }, [isSuccess, data, isLoading, dispatch]);

  return <Outlet />;
}
