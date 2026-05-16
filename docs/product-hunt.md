# Product Hunt — TaskFlow ローンチ用コピー（英語）

本文に **本番 URL** と **サポートメール** を記載済み。料金はアプリの `messages/en.json` と一致（Free / Pro $19・オーナー課金でメンバーに Pro 波及）。**Privacy / Terms** の公開ページがまだなら、PH・サイト・FAQ から同じ URL に揃える。

---

## PH 基本フィールド

### Name
TaskFlow

### Tagline（候補・用途別）

**「シンプル志向」を一言で（PH 60 文字制限向き）**
- The simple team task app I always wished existed.
- Dead-simple team tasks — boards, lists, trees, one fair bill.

**短め**
- One subscription. Your whole team gets Pro features.
- Real-time task boards for small teams — one owner pays, everyone upgrades.

**やや説明的**
- Kanban, list, and tree views for teams that outgrow spreadsheets.

### 感情の一文（どこにでも差し込める）

> **Honestly, I built this because I wanted something exactly this simple — fast boards, clear structure, no enterprise weight.**

Maker コメントの冒頭、Description の1文目の後、動画のオープニングなどにそのまま使える。

### Suggested topics（Product Hunt）
- Task Management
- Developer Tools
- SaaS

（実際の PH のトピック一覧から近いものを選ぶ）

### Description（中長文・貼り付け用）

#### Product Hunt フォーム用（**500 文字以内**・こちらをコピペ）

PH のカウンターは余裕を見て **約 400 字前後**。`Manage your team tasks in real time` など別文を**前に付けない**（くっつくとオーバーしやすい）。

```text
I wanted a tool that stayed this simple. TaskFlow: lightweight boards for small dev teams (2–8). Real-time Kanban, list, and tree—no bloat.

One Pro subscription from the owner unlocks Pro for every invited member (unlimited projects & members, standup, feedback). No per-seat pricing.

Free: 1 project, up to 3 members, unlimited tasks. Pro: $19/mo (Stripe). EN & JP UI. Next.js, Supabase, Stripe.
```

#### 長め版（サイト・README など／PH には使わない）

**I wanted a tool that stayed this simple** — so I built TaskFlow: a lightweight team task manager for small dev teams and agencies. Invite collaborators, work in **Kanban**, **list**, or **tree** view, and stay in sync with **real-time updates**. **The project owner upgrades once — every invited member on that project gets Pro features** (unlimited projects and members, tree view, daily standup, and the feedback tool).

**Free tier:** 1 project, up to 3 members, unlimited tasks, Kanban and list view. **Pro:** $19/month. **English and Japanese** UI. Built with **Next.js**, **Supabase**, and **Stripe**.

**Website:** https://task-app-xi-two.vercel.app

---

## Maker の初回コメント（Launch day）

Hi PH 👋 I’m Yurinchi. **I kept looking for something exactly this simple** — a team board that feels fast, not like a second job — so I built **TaskFlow**. Small teams shouldn’t need a heavyweight PM tool just to ship work together, or pay per seat when only one person owns the budget.

**How it works:** create a project, invite your team with a link, and pick **Kanban**, **list**, or **tree** view. When the **owner** subscribes to **Pro ($19/mo)**, **everyone on that project gets Pro features** — unlimited projects and members, **daily standup**, and our **feedback** tool. **Free** stays useful: **1 project**, **up to 3 members**, unlimited tasks.

Stack: **Supabase** (auth, realtime, RLS) and **Stripe** (Checkout, Customer Portal). UI in **English + Japanese**.

I’d love honest feedback: what’s missing for *your* 2–8 person team? I’ll be here to reply and ship fixes.

**Try:** https://task-app-xi-two.vercel.app · **Pricing:** https://task-app-xi-two.vercel.app/pricing

---

## スクリーンショット 5 枚 — 撮影メモ & キャプション（英語）

| # | 画面 | キャプション例 |
|---|------|------------------|
| 1 | プロジェクト一覧 | Your projects — one place for every client or codebase |
| 2 | カンバン | Kanban that stays fast as the team grows |
| 3 | リスト or ツリー | List & tree views — see structure, not just columns |
| 4 | メンバー招待 | Invite by link — your teammates don’t need separate upgrades |
| 5 | Pricing / Pro 波及の UI | One owner pays — the whole team unlocks Pro |

---

## PH メディア欄の埋め方（Thumbnail / Gallery / Video）

### Thumbnail（240×240px・必須に近い）

| 項目 | 内容 |
|------|------|
| サイズ | **240×240** 推奨（正方形） |
| 形式 | JPG / PNG / GIF、**2MB 以下** |
| 何を載せるか | **アイコン／ロゴマーク**が理想。無ければアプリの**ブランド色の背景**に **TaskFlow** だけタイポで中央配置でも十分。 |
| 避けたいこと | 文字だらけの横長スクショを無理やり切り抜く（小さすぎて読めない）。 |

**作り方（最短）**  
1. Figma / Keynote / Canva で **240×240** の新規キャンバス。  
2. 背景 `#0f172a`〜`#1e293b` 系（アプリに近いダーク）＋白文字で `TaskFlow`。  
3. 余裕があれば小さなチェック／ボードのアイコン絵文字は使わず、**シンプルな1色アイコン**（Heroicons 等）を1つ。  
4. **エクスポート PNG → 2MB 以下**を確認（Mac ならプレビューでサイズ確認）。

### Gallery（横長・最低1枚・推奨3枚以上）

| 項目 | 内容 |
|------|------|
| 推奨解像度 | **幅 1270px 以上**（縦は 760 前後以上。16:9〜16:10 気味で OK） |
| 重要 | **1枚目が SNS・リンク共有時のプレビュー**になる。**いちばん伝わる画面**（だいたい **カンバン**か**プロジェクト一覧**）を先頭にする。 |
| 枚数 | **最低 1** で進められるが、**3〜5 枚**推奨。上の「スクリーンショット 5 枚」表の順で揃える。 |

**撮影のコツ**  
- ブラウザは**英語 UI**（ロケール `en`）。  
- ウィンドウを広げ、**タブ・ブックマークバーはしまう**（見栄えとトリミングが楽）。  
- Mac: `⌘⇧4` で範囲キャプチャ → 必要ならプレビューで **幅 1280px 以上**にリサイズ。  
- 個人情報・メールは**ダミー**にする。

**おすすめ並び（1枚目＝プレビュー用）**  
1. **カンバン**（ヒーロー）  
2. プロジェクト一覧  
3. リスト or ツリー  
4. メンバー招待  
5. 料金 / Pro 波及

### Video / Loom（任意・あると有利）

| 項目 | 内容 |
|------|------|
| 何を貼るか | **YouTube**（非公開 / 限定公開）または **Loom** の共有 URL。PH の「Link to the video / loom」に貼る。 |
| 長さ | **30〜60 秒**で十分。下の「30 秒動画」英語原稿に合わせて読む。 |
| Loom | [loom.com](https://www.loom.com) 無料 → Chrome 拡張で **タブ単位**録画 → 英語でナレーション（噛んでも OK、字幕を後から Loom で足せる）。 |
| YouTube | 動画をアップ → **限定公開** → コピーした URL を PH に。 |

**今回無理なら**  
空欄で提出も可能（Optional）。余力が出たら週末に Loom 1本だけ追加でも遅くない。

### Interactive demo（任意）

| 項目 | 内容 |
|------|------|
| 判断 | **初ローンチはスキップで OK**（Arcade 等で作ると半日〜かかる）。 |
| 代わり | **本番 URL** が動けば、興味ある人は自分で触る。 |

---

## 30 秒動画 — 英語ナレーション（読み上げ）

**I built TaskFlow because I wanted exactly this: something simple that still works for a real team.** It keeps small dev teams aligned — without the enterprise bloat.

Create a project, invite your team with a link, and manage work in **Kanban**, **list**, or **tree** view. Changes sync in **real time**, so everyone sees the same board.

Here’s the part teams love: **the owner subscribes once — and every member on that project gets Pro.**

**Free** covers **one project** and up to **three members**. **Pro** is **nineteen dollars a month** for unlimited scale — plus standup and feedback tools.

**TaskFlow** — simple teamwork, one subscription.

---

## Pricing ブロック（サイト / PH 補足用）

### Free — $0
- 1 project  
- Up to 3 members (including pending invites on Free)  
- Unlimited tasks  
- Kanban & list view  

### Pro — $19 / month
- Unlimited projects & members  
- Tree view & daily standup  
- Feedback tool  
- All invited members get Pro features when the **project owner** is on Pro  
- Manage billing in **Stripe Customer Portal**  

**One-liner:** Start free. When you’re ready, one owner upgrades — the team doesn’t buy seats.

---

## FAQ（英語）

**What data do you store?**  
We store account data (email, display name), project and task content you create, invites, and billing metadata required for Stripe. Data lives in Supabase with row-level security so you only see projects you belong to.

**How do I delete my account or data?**  
Contact yurinchi.coding55@gmail.com from the email registered on your account and request deletion. We verify ownership and process the request according to our policy.

**How do I cancel Pro?**  
Use **Manage Subscription** in the app to open the **Stripe Customer Portal** and cancel or update your payment method. Pro access follows your Stripe subscription status.

**Is payment data on your servers?**  
No. **Stripe** processes cards and billing details. We use webhooks to know subscription status only.

**Who gets Pro?**  
Invited **members** on projects where the **owner** has an active **Pro** subscription get Pro features for that product model.

**Languages?**  
English and Japanese.

---

## コメント返信テンプレ（英語・短文）

- Feature request: `Thanks for the idea — noted. If you’re open to it, what’s the one workflow this would unblock for your team?`
- Bug: `Thanks for flagging this. Can you share: browser, and roughly what you clicked before it broke? I’ll reproduce and fix.`
- Positive: `Really appreciate that — glad it’s useful. Anything we could make clearer on day one?`
- Competitor comparison: `Fair point. We’re aiming at small teams who want speed and one simple bill — happy to hear what you’d need to switch.`

---

## チェックリスト

- [x] 本番 URL・メールに差し替え  
- [ ] Privacy Policy / Terms のリンクが PH・サイトで辿れる  
- [ ] Thumbnail 240×240（2MB以下）を用意  
- [ ] Gallery 3〜5 枚（1枚目＝カンバン等ヒーロー、幅1270px以上推奨・英語UI）  
- [ ] 動画（任意）Loom or YouTube 限定公開 URL  
- [ ] Interactive demo は初回スキップで可  

---

## PH シャウトアウト用コピー（英語・フォーム貼り付け）

PH が出す候補に合わせて書いてある。深く比較していないサービス名は入れない（必要なら文を弱める）。

### Supabase

**Other alternatives considered?**

```text
Skimmed Convex (all-in-one backend), Appwrite (self-host/BaaS), and Neon (managed Postgres) with Prisma on a host like Render. For TaskFlow we wanted Postgres plus auth, row-level security, and realtime on the same tables without operating our own API layer first.
```

**What made you choose Supabase over the alternatives?**

```text
Supabase lines up with our model: Postgres + RLS for multi-tenant team data, built-in Auth, and Realtime that tracks our relational schema. One console and one mental model beat wiring Neon + separate auth + custom sync for a solo weekend ship cadence.
```

### Vercel

**Other alternatives considered?**

```text
Compared Netlify and Cloudflare Pages for static/edge hosting, and Render for container-style deploys. We’re a standard Next.js App Router app — prioritised the path with the smoothest deploys and previews without hand-rolling CI/CD.
```

**What made you choose Vercel over the alternatives?**

```text
Best day-one fit for Next.js: simple production and preview URLs, HTTPS by default, and fewer sharp edges than tuning another platform’s Next.js adapter. Lets us spend limited time on TaskFlow instead of deploy scripts.
```

### Stripe（参考・同フォーム形式）

**Other alternatives considered?**

```text
Looked at Paddle (MoR) and PayPal for subscriptions. For our early stage we prioritised Stripe’s subscription model, hosted Checkout, Customer Portal, and webhook clarity over tax-reseller complexity.
```

**What made you choose Stripe over the alternatives?**

```text
Checkout and Customer Portal cover upgrades, cancellations, and card updates with minimal custom billing UI; subscription webhooks are predictable and well documented. Fastest safe path for one maker shipping SaaS.
```
