import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const auth = useSupabaseAuth();
  const user = useMemo(() => {
    if (!auth.user) return null;
    return {
      id: auth.user.id,
      openId: auth.user.id,
      name: auth.profile?.full_name || auth.user.user_metadata?.full_name || auth.user.email || "GovGuide citizen",
      email: auth.profile?.email || auth.user.email || null,
      role: "user" as const,
    };
  }, [auth.user, auth.profile]);

  useEffect(() => {
    if (!redirectOnUnauthenticated || auth.loading || user) return;
    if (typeof window === "undefined" || window.location.pathname === "/login") return;
    const destination = redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : "/login";
    window.location.replace(destination);
  }, [auth.loading, redirectOnUnauthenticated, redirectPath, user]);

  const logout = async () => {
    const result = await auth.signOut();
    if (!result.error && typeof window !== "undefined") window.location.replace("/");
    return result;
  };

  return {
    user,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: Boolean(auth.user),
    refresh: auth.refreshProfile,
    logout,
  };
}
