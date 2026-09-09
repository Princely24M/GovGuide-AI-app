import { supabase, type SupabaseProfile } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: SupabaseProfile | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ needsEmailConfirmation: boolean; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  updateProfile: (fullName: string) => Promise<{ error: Error | null }>;
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
};

const SupabaseAuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(error: unknown) {
  if (!(error instanceof Error)) return new Error("We couldn't complete that request. Please try again.");
  const message = error.message.toLowerCase();
  if (message.includes("invalid login credentials")) return new Error("The email or password is incorrect.");
  if (message.includes("user already registered") || message.includes("already been registered")) return new Error("An account with this email already exists. Try signing in instead.");
  if (message.includes("email not confirmed")) return new Error("Please verify your email address before signing in.");
  if (message.includes("password should be at least")) return new Error("Use a password with at least 8 characters.");
  if (message.includes("rate limit")) return new Error("Too many attempts. Please wait a moment and try again.");
  return new Error("We couldn't complete that request. Please check your details and try again.");
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error: profileError } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
    if (profileError) throw profileError;
    setProfile(data as SupabaseProfile | null);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(friendlyAuthError(sessionError));
      setSession(data.session);
      if (data.session?.user) {
        try { await loadProfile(data.session.user.id); } catch (profileError) { if (active) setError(friendlyAuthError(profileError)); }
      }
      if (active) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setError(null);
      if (nextSession?.user) {
        try { await loadProfile(nextSession.user.id); } catch (profileError) { if (active) setError(friendlyAuthError(profileError)); }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    error,
    signIn: async (email, password) => {
      const result = await supabase.auth.signInWithPassword({ email, password });
      return { error: result.error ? friendlyAuthError(result.error) : null };
    },
    signUp: async (fullName, email, password) => {
      const result = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      if (result.error) return { needsEmailConfirmation: false, error: friendlyAuthError(result.error) };
      if (result.data.user && result.data.session) {
        try {
          await loadProfile(result.data.user.id);
        } catch (profileError) {
          return { needsEmailConfirmation: false, error: friendlyAuthError(profileError) };
        }
      }
      return { needsEmailConfirmation: !result.data.session, error: null };
    },
    signOut: async () => {
      const result = await supabase.auth.signOut();
      return { error: result.error ? friendlyAuthError(result.error) : null };
    },
    resetPassword: async email => {
      const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      return { error: result.error ? friendlyAuthError(result.error) : null };
    },
    updatePassword: async password => {
      const result = await supabase.auth.updateUser({ password });
      return { error: result.error ? friendlyAuthError(result.error) : null };
    },
    updateProfile: async fullName => {
      if (!session?.user) return { error: new Error("You need to be signed in to update your profile.") };
      const authResult = await supabase.auth.updateUser({ data: { full_name: fullName } });
      if (authResult.error) return { error: friendlyAuthError(authResult.error) };
      const profileResult = await supabase.from("profiles").update({ full_name: fullName, updated_at: new Date().toISOString() }).eq("user_id", session.user.id);
      if (profileResult.error) return { error: friendlyAuthError(profileResult.error) };
      await loadProfile(session.user.id);
      return { error: null };
    },
    resendConfirmation: async email => {
      const result = await supabase.auth.resend({ type: "signup", email });
      return { error: result.error ? friendlyAuthError(result.error) : null };
    },
    refreshProfile: async () => {
      if (session?.user) await loadProfile(session.user.id);
    },
  }), [session, profile, loading, error, loadProfile]);

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export function useSupabaseAuth() {
  const value = useContext(SupabaseAuthContext);
  if (!value) throw new Error("useSupabaseAuth must be used within SupabaseAuthProvider");
  return value;
}
