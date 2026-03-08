import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseEnv } from "@/lib/env";
type ServerClient = SupabaseClient;

let serverClient: ServerClient | null = null;

export function createServerClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  if (!serverClient) {
    serverClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }

  return serverClient;
}

export function requireServerClient() {
  const client = createServerClient();
  if (!client) {
    throw new Error("Missing Supabase environment variables.");
  }

  return client;
}
