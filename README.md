# TaskFlow — チームタスク管理アプリ

Next.js (App Router) + Supabase + Vercel で動くリアルタイムチームタスク管理アプリです。

## 機能
- メール/パスワード認証
- プロジェクト作成・一覧
- タスクの追加・編集・削除（担当者・期限・優先度・ステータス）
- カンバン / リスト表示切り替え
- チームメンバーを招待リンクで招待
- Supabase Realtimeによる複数人リアルタイム同期
- RLS（Row Level Security）で所属プロジェクトのみ閲覧可能

---

## セットアップ手順

### 1. Supabase プロジェクトを作成

1. [https://supabase.com](https://supabase.com) でアカウントを作成し、新規プロジェクトを作成
2. **SQL Editor** を開き、`supabase/schema.sql` の内容を貼り付けて **Run** を実行
3. **Authentication > Providers** でメール認証が有効になっていることを確認
4. **Realtime** を有効化: Dashboard > Database > Replication > `tasks`, `projects` テーブルにチェック

### 2. Supabase の API キーを取得

Dashboard > Settings > API から以下をコピー：
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon/public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

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

**Vercel の環境変数設定（Dashboard > Settings > Environment Variables）：**
| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseのProject URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseのanon key |
| `NEXT_PUBLIC_SITE_URL` | Vercelのデプロイ先URL（例: https://your-app.vercel.app） |

**Supabase側でリダイレクトURLを許可：**
Authentication > URL Configuration > Redirect URLs に  
`https://your-app.vercel.app/**` を追加

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
| デプロイ | Vercel |
