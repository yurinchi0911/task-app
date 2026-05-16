# TaskFlow — チームタスク管理アプリ

Next.js (App Router) + Supabase + Vercel で動くリアルタイムチームタスク管理アプリです。

## 機能
- メール/パスワード認証
- プロジェクト作成・一覧
- タスクの追加・編集・削除（担当者・期限・優先度・ステータス、親子構造対応）
- カンバン / リスト / ツリー（マインドマップ風の接続線）
- Stripe（Checkout・Billing Portal・Webhook）および **オーナー課金**（オーナーの Pro が同プロジェクト メンバーに波及）
- チームメンバーを招待リンクで招待
- Supabase Realtimeによる複数人リアルタイム同期
- RLS（Row Level Security）で所属プロジェクトのみ閲覧可能
- Supabase Realtimeによる複数人リアルタイム同期
- RLS（Row Level Security）で所属プロジェクトのみ閲覧可能

---

## セットアップ手順

### 1. Supabase プロジェクトを作成

1. [https://supabase.com](https://supabase.com) でアカウントを作成し、新規プロジェクトを作成
2. **SQL Editor** を開き、次を **この順で** **Run** してください  
   - `supabase/schema.sql`  
   - `supabase/add_stripe_columns.sql`（Stripe 連携カラム）  
   - `supabase/add_features.sql`（`parent_task_id` / `notes` / フィードバック・スタンドアップなど）
3. **Authentication > Providers** でメール認証が有効になっていることを確認
4. **Realtime**: Database > Publication `supabase_realtime` で `tasks` / `projects` / `project_members` / `standups` 等が載っていることを確認（`schema.sql` / `add_features.sql` で追加済み想定）

### 2. Supabase の API キーを取得

Dashboard > Settings > API から以下をコピー：
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon/public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **`service_role` key** → `SUPABASE_SERVICE_ROLE_KEY`（**ブラウザに出さない・Git にコミットしない**）

`SUPABASE_SERVICE_ROLE_KEY` は **Stripe Webhook** がユーザー未ログインのまま `profiles.subscription_status` を更新するために必須です。

### 3. ローカル環境の準備

```bash
# リポジトリをクローン or このフォルダに移動
cd task-app

# 環境変数ファイルを作成
cp .env.local.example .env.local
# .env.local を開いてSupabaseのURL/Keyを入力

# 依存パッケージをインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと動作確認できます。

### 4. Vercel にデプロイ

```bash
# Vercel CLI を使う場合
npm i -g vercel
vercel

# または GitHub にプッシュして Vercel Dashboard からインポート
```

### 5. Stripe（本番 / Live モード）

1. Stripe Dashboard で **Live モード** に切り替え  
2. **Developers → API keys** で `secret key` を `STRIPE_SECRET_KEY` に設定  
3. **Products** で Pro の **定期請求 Price** を作成し、`STRIPE_PRO_PRICE_ID` に `price_xxxxx` を設定（既に使った Price は金額変更不可のため、新規 Price を作ること）。Checkout に表示される金額は **この Price が唯一の正**です。`/pricing` の文言や `$19` とズレる場合は、Stripe の Price を `$19` に合わせるか、`STRIPE_PRO_PRICE_ID` をその Price に更新してください。  
4. **Developers → Webhooks → Add endpoint**  
   - **Endpoint URL**: `https://YOUR_DOMAIN/api/stripe/webhook`  
   - **Events**:  
     `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`  
   - 表示される **Signing secret** を `STRIPE_WEBHOOK_SECRET` に設定  

### 6. Supabase メール確認・ログインの URL（本番）

**Authentication → URL Configuration**
- **Site URL**: 本番のトップドメイン（例: `https://your-domain.com`）  
- **Redirect URLs** に最低限次を追加（カスタムドメイン運用時はそれも含める）：
  - `https://YOUR_VERCEL_DOMAIN/**`
  - `https://YOUR_CUSTOM_DOMAIN/**`（使う場合）

### 7. Vercel 環境変数（Production）

Dashboard → **Settings → Environment Variables → Production** にすべて設定してください。

| Key | 備考 |
|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Webhook 更新に必須**（サーバーのみ・漏洩厳禁） |
| `NEXT_PUBLIC_SITE_URL` | **末尾スラッシュなし**、`https://` 付き本番 URL |
| `STRIPE_SECRET_KEY` | **Live** の `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Live Webhook の `whsec_...` |
| `STRIPE_PRO_PRICE_ID` | Live の Price ID |

環境変数を変えたら **Deployments から Redeploy** が必要な場合があります。

### ローンチ後の確認チェックリスト

1. メールログイン・アカウント作成が **本番 URL** で通る  
2. `/pricing` → アップグレード → Stripe Checkout が **実カードまたはテスト用の本番検証カードで**決済完了する  
3. **Stripe Webhooks** で直近イベントが **200**（失敗しない）  
4. 決済後に **Pro バッジ**・オーナー課金モデル（メンバーに Pro が波及）が意図どおり動く  
5. **カスタムドメイン**を使う場合: Vercel にドメイン追加し、`NEXT_PUBLIC_SITE_URL` と Supabase Redirect URLs を揃える

---

## ファイル構成

```
src/
├── app/
│   ├── auth/callback/         # OAuth/メール確認コールバック
│   ├── invite/[token]/        # 招待リンク受諾ページ
│   ├── login/                 # ログインページ
│   ├── signup/                # サインアップページ
│   └── projects/
│       ├── layout.tsx         # ダッシュボードヘッダー
│       ├── page.tsx           # プロジェクト一覧
│       ├── new/               # プロジェクト作成
│       └── [projectId]/
│           ├── page.tsx       # タスクボード（カンバン/リスト）
│           └── settings/      # メンバー管理・招待
├── components/
│   ├── members/InviteSection.tsx
│   ├── tasks/
│   │   ├── TaskBoard.tsx      # Realtime込みのメインボード
│   │   ├── TaskCard.tsx
│   │   └── TaskFormModal.tsx
│   └── ui/LogoutButton.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # ブラウザ用Supabaseクライアント
│   │   └── server.ts          # サーバー用Supabaseクライアント
│   └── types.ts               # 型定義
└── middleware.ts               # 認証ガード
```

## スキーマSQL

`supabase/schema.sql` を参照してください。

---

## 技術スタック

| 分類 | 技術 |
|------|------|
| フロントエンド | Next.js 16 (App Router) + TypeScript + Tailwind CSS |
| バックエンド | Supabase (Auth + PostgreSQL + Realtime) |
| 課金 | Stripe Checkout / Webhook |
| i18n | next-intl |
| デプロイ | Vercel |
