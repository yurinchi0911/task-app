import { createClient } from '@/lib/supabase/server'

/** Stripe で自分のアカウントが課金済みか（作成プロジェクト数・オーナープランの判定用） */
export async function isPayingSubscriber(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', userId)
    .single() as { data: { subscription_status?: string } | null }

  return data?.subscription_status === 'pro'
}

/**
 * Pro アクセス判定（オーナー課金モデル）
 *
 * 以下のいずれかに当てはまれば Pro アクセスを持つ：
 *   1. 自分自身の subscription_status が 'pro'
 *   2. 自分が参加しているプロジェクトのオーナーが subscription_status = 'pro'
 */
export async function getProAccess(userId: string): Promise<{
  isPro: boolean
  isOwnerPro: boolean   // 自分自身が課金者
  coveredByOwner: boolean // オーナーのプランでカバーされている
}> {
  const supabase = await createClient()

  // 1. 自分の subscription_status を確認
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', userId)
    .single() as { data: { subscription_status?: string } | null }

  const isOwnerPro = profile?.subscription_status === 'pro'
  if (isOwnerPro) {
    return { isPro: true, isOwnerPro: true, coveredByOwner: false }
  }

  // 2. 自分が参加しているプロジェクトのオーナー一覧を取得
  const { data: memberships } = await supabase
    .from('project_members')
    .select('project_id, projects!inner(owner_id)')
    .eq('user_id', userId) as {
      data: { project_id: string; projects: { owner_id: string } }[] | null
    }

  if (!memberships?.length) {
    return { isPro: false, isOwnerPro: false, coveredByOwner: false }
  }

  const ownerIds = [...new Set(
    memberships.map(m => m.projects?.owner_id).filter(Boolean) as string[]
  )].filter(id => id !== userId) // 自分以外のオーナー

  if (!ownerIds.length) {
    return { isPro: false, isOwnerPro: false, coveredByOwner: false }
  }

  // 3. そのオーナーに Pro サブスクリプションがあるか確認
  const { data: proOwners } = await supabase
    .from('profiles')
    .select('id')
    .in('id', ownerIds)
    .eq('subscription_status', 'pro') as { data: { id: string }[] | null }

  const coveredByOwner = (proOwners?.length ?? 0) > 0

  return { isPro: coveredByOwner, isOwnerPro: false, coveredByOwner }
}
