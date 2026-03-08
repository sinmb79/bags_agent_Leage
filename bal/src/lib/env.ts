const requiredSupabaseKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
] as const;

export function hasEnvValue(name: string) {
  return Boolean(process.env[name] && process.env[name]?.trim());
}

export function hasSupabaseEnv() {
  return requiredSupabaseKeys.every((key) => hasEnvValue(key));
}

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

