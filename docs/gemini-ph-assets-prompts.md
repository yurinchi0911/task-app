# Gemini 向け：Product Hunt 用ビジュアル作成プロンプト

**使い方：**  
1. まず下の **「共通コンテキスト」** を 1 回コピペする（または各プロンプトに「上の共通コンテキストに続けて」と書いたブロックだけ送る）。  
2. **作品ごと**に下の **A → F** を **1 回ずつ** 実行して画像を保存。  
3. 仕上げ：**サムネは 240×240・2MB 以下**、**ギャラリーは幅 1270px 以上** にリサイズ（Gemini の出力解像度が違っても、Mac プレビューや [squoosh.app](https://squoosh.app) で調整）。

**注意（重要）：**  
- AI が描いた UI は **本番アプリの画面と完全一致しません**。**信頼・説明のためのギャラリーは、実機の英語 UI スクショ**が最強。  
- Gemini は **サムネ・アイコン風・ヒーロー用のきれいなモック**向き。  
- **妥協案：** ① サムネだけ AI、② ギャラリーは自分でスクショ 3〜5 枚 — も推奨。

---

## 共通コンテキスト（すべてのプロンプトの前に貼る）

```text
You are generating marketing visuals for "TaskFlow", a B2B SaaS web app for small dev teams (2–8 people).

Brand feel: minimal, trustworthy, developer-friendly, NOT playful cartoon, NOT 3D glossy icons, NOT stock-photo people.

Visual style:
- Dark UI: background deep slate / near-black (#0f172a to #1e293b range), subtle gradient ok.
- Accent colors: soft blue, violet, or cyan for highlights — calm, not neon gamer.
- Typography: clean sans-serif, high legibility (Inter / SF Pro style), plenty of whitespace.
- English UI labels only in mock screens.

Product facts (must not contradict):
- Kanban, list, and tree views for tasks.
- One owner pays Pro; invited teammates get Pro features on that project (no per-seat for them).
- Simple and fast — "the simple tool small teams wished existed."

Constraints for all images:
- No real company logos, no Apple/Microsoft/Google logos, no watermarks, no lorem ipsum paragraphs filling the screen.
- No misleading claims (no "used by 10,000 teams" etc.).
```

---

## A. Thumbnail（PH 用 240×240 相当の源流画像）

**目的：** 正方形アイコン／マーク。後から **240×240 にリサイズ**。

```text
[共通コンテキストを先に貼る]

Generate ONE square image (1:1 aspect ratio), 1024x1024 or highest square size you support.

Content: App icon / logo mark for "TaskFlow".
- Centered wordmark "TaskFlow" in clean white or near-white sans-serif, medium weight.
- Optional subtle icon: minimal checklist or simple kanban columns (3 thin rectangles), same style as the text, very simple.
- Background: dark slate gradient, subtle noise or none.
- Corners: can be slightly rounded like an app icon, or full square — your choice; keep it professional.
- Must remain readable when scaled down to 240x240 (not tiny text, not crowded).
- Flat design, no 3D, no mascot.

Output: single square image only.
```

---

## B. Gallery ① — ソーシャルプレビュー用ヒーロー（カンバン）

**目的：** **ギャラリー 1 枚目**。横長。後から **幅 1270px 以上** に合わせる。

```text
[共通コンテキストを先に貼る]

Generate ONE widescreen 16:9 image (e.g. 1344x768 or 1920x1080).

Content: Realistic but fictional SaaS screenshot of a dark-mode Kanban board for developers.
- Three columns: "To Do", "In Progress", "Done" with 3–5 task cards each (short English titles like "Fix auth redirect", "API rate limit", "Update Stripe webhook").
- Top bar: small app name "TaskFlow" left, simple user avatar right.
- Subtle colored project badge or column hints (blue/violet) — restrained.
- Looks like a polished web app in a browser frame optional (thin window chrome ok) or full-bleed UI — choose the cleaner option.
- No unreadable microtext; no fake photos of humans.

This image will be the #1 marketing screenshot for Product Hunt.
```

---

## C. Gallery ② — プロジェクト一覧

```text
[共通コンテキストを先に貼る]

Generate ONE widescreen 16:9 image.

Content: Dark-mode web app "Projects" list screen titled "Projects", subtitle like "Projects you're a member of".
- 4–6 project rows/cards with names ("Website redesign", "Mobile API", "Client onboarding"), small color dots, "Open" or arrow affordance.
- Clean spacing, same visual language as a modern Next.js dashboard.

No clutter, no giant illustrations.
```

---

## D. Gallery ③ — リスト or ツリー視点

```text
[共通コンテキストを先に貼る]

Generate ONE widescreen 16:9 image.

Content: Dark-mode task view showing EITHER a compact list with priorities (Low/Med/High) and statuses OR a simple tree/hierarchy of tasks (parent + indented subtasks). English labels.
- Toggle or tabs hint for "List" vs "Tree" ok but keep one main view dominant.
- Developer-style task names, short.

Professional, minimal.
```

---

## E. Gallery ④ — メンバー招待

```text
[共通コンテキストを先に貼る]

Generate ONE widescreen 16:9 image.

Content: Dark-mode "Team members" or "Invite" panel: email field, button "Generate invite link", small list "Current members" with roles Owner/Member. English only.
- Convey "invite by link" without showing a real URL or QR code (use blurred or placeholder "https://…" very small if needed).

Clean SaaS settings aesthetic.
```

---

## F. Gallery ⑤ — 料金（Free / Pro）の概念図

```text
[共通コンテキストを先に貼る]

Generate ONE widescreen 16:9 image.

Content: Dark-mode pricing UI with TWO columns: "Free" and "Pro".
- Free: "$0", bullets "1 project", "Up to 3 members", "Unlimited tasks".
- Pro: "$19 / month", bullets "Unlimited projects & members", "Tree & standup", "Feedback".
- Include ONE short callout banner or line: "One owner pays — the whole team gets Pro" (exact wording).

No fine print wall of text. High contrast, readable at thumbnail scale on PH.
```

---

## 一括お願い用（会話 1 回で「全部欲しい」と言いたいとき）

Gemini が複数枚を 1 回で出せるかはモデル次第。**出なかったら A〜F を個別に実行**するのが確実。

```text
[共通コンテキストを先に貼る]

Please generate a consistent set of marketing images for Product Hunt for the product "TaskFlow", in this order:

1) Square 1:1 app icon / wordmark thumbnail (readable at 240px).
2) 16:9 hero Kanban dark UI.
3) 16:9 Projects list screen.
4) 16:9 List or tree task view.
5) 16:9 Team invite / members screen.
6) 16:9 Two-column Free vs Pro pricing screen with tagline "One owner pays — the whole team gets Pro".

Use the same color palette and typography style across all images. English UI only. No real third-party logos.
```

---

## 仕上げチェックリスト

- [ ] サムネ：**240×240**、**2MB 以下**、PNG/JPG  
- [ ] ギャラリー：**幅 ≥ 1270px**、**1 枚目がヒーロー（カンバン）**  
- [ ] 本物の画面と並べて **嘘がないか**（料金 $19・機能は `messages/en.json` と一致）  
- [ ] **実スクショ**を混ぜるなら、AI 生成は **1〜2 枚だけ**にしておくとブレが減る  
