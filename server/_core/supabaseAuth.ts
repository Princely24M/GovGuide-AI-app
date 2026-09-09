import type { Request } from "express";
import { ENV } from "./env";

export type SupabaseRequestUser = {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  role: "user";
};

export async function authenticateSupabaseRequest(req: Request): Promise<SupabaseRequestUser | null> {
  const authorization = req.header("authorization");
  if (!authorization?.toLowerCase().startsWith("bearer ") || !ENV.supabaseUrl || !ENV.supabasePublishableKey) return null;
  const accessToken = authorization.slice(7).trim();
  if (!accessToken) return null;
  try {
    const response = await fetch(`${ENV.supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: ENV.supabasePublishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) return null;
    const user = await response.json() as { id?: string; email?: string; user_metadata?: { full_name?: string } };
    if (!user.id) return null;
    return {
      id: user.id,
      openId: user.id,
      name: user.user_metadata?.full_name ?? user.email ?? null,
      email: user.email ?? null,
      role: "user",
    };
  } catch (error) {
    console.warn("[Supabase Auth] Request verification failed", error);
    return null;
  }
}
