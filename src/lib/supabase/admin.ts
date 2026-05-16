import { createClient } from '@supabase/supabase-js'

/**
 * Stripe Webhook など「ユーザーセッションがない」サーバー処理専用。
 * RLS をバイパスするため SUPABASE_SERVICE_ROLE_KEY を使用する。
 * クライアント・通常の Route Handler には使わないこと。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (required for Stripe webhook in production)')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
