# LLM wiki の仕組み

この Vault を、人と LLM（Claude Code）が一緒に育てる wiki として運用するための規約。書式の基本（Markdown リンク、ルートからのパス、`asset/`）は [ノートの書式と配置](vault-conventions.md) に従う。構成の理由は [ADR-0003](../../.kit/harness/docs/adr/0003-wiki-layout.md)。

## 操作

| 操作 | スキル | 使う場面 |
|---|---|---|
| 取り込み | [wiki-ingest](../skills/wiki-ingest/SKILL.md) | URL・PDF・メモを wiki に入れる |
| 回答と蓄積 | [wiki-query](../skills/wiki-query/SKILL.md) | wiki を根拠に質問に答える。価値のある回答はページにする |
| 保守 | [wiki-lint](../skills/wiki-lint/SKILL.md) | リンク切れ、孤立したページ、矛盾、古い記述、重複を直す |
| デイリーノートの整理 | [wiki-daily](../skills/wiki-daily/SKILL.md) | 前日までのデイリーノートを wiki に反映する |

どの操作も、最後に `wiki/log.md` に記録し、`wiki(<操作>): <要約>` の件名で main にコミットする（[進め方](workflow.md)）。

## 所有の区分

[ADR-0007](../../.kit/harness/docs/adr/0007-note-format.md)。検査の移行状況も同ADRを参照。

| 区分 | パス | LLM ができること |
|---|---|---|
| DailyNote | `daily/` | 既存本文の無断変更・削除を禁止。追記とfrontmatter編集は可。削除・移動で保護を回避しない |
| 通常のノート | その他の見えるフォルダ、`wiki/feedback.md` | 依頼の範囲で作成・編集できる |
| wiki | `wiki/`（`feedback.md` を除く） | 自由に作る・書き換える・消す。人が編集した内容は入力として扱い、作り直してよい。人の書いた内容を消すときは log に理由を書く |
| 元資料・添付 | `sources/`、`asset/` | 追加だけ |
| 隠しパス | `.claude/` など | wiki の操作では変えない |

タスク管理のデータ（`issue/`、`routine/`、`member/`、`worklog/`、`board/`）は vault-task が管理する。wiki の操作では追記もしない（タスクの登録は vault-task の画面か一括登録で行う）。

## 元資料（`sources/`）

1 資料 = 1 ファイル。ファイル名は `YYYY-MM-DD-<英小文字とハイフンの短い名前>.md`（取り込んだ日）。

```markdown
---
type: source
created: "2026-10-31T00:00:00Z"
updated:
title: 記事のタイトル
origin: https://example.com/article
retrieved: 2026-10-31
tags: []
---

（本文、または要点の抜粋。PDF なら [原本](asset/foo.pdf) へのリンクと要点）
```

- `origin`: URL。手入力のメモなら `手入力`、PDF なら `asset/` のパス
- 作成した後は変更しない。読み直して内容が古くなっていても、新しい元資料として取り込む

## wiki のページ（`wiki/`）

ファイル名は英小文字とハイフン（`wiki/large-language-model.md`）。サブフォルダを作らない。

```markdown
---
title: 大規模言語モデル
type: concept
tags: [ai]
sources:
  - sources/2026-10-31-foo.md
  - daily/2026/10/2026-10-30.md
created: "2026-10-31T00:00:00Z"
updated:
---

1〜3 文の要約。

## 本文の見出し

根拠のある記述には、元資料かページへのリンクを付ける（[出典](sources/2026-10-31-foo.md)）。

## 関連

- [別のページ](wiki/other.md)
```

| type | 内容 |
|---|---|
| `concept` | 概念・技術・手法 |
| `entity` | 人・組織・製品・プロジェクト |
| `topic` | あるテーマの全体のまとめ（複数の concept / entity をつなぐ） |
| `answer` | 質問への回答として作ったまとめ |

- `sources` には根拠にした元資料・デイリーノート・URL を書く。根拠のない推測は書かない。推測を書くなら「推測」と明記する
- 元資料どうしが矛盾したら、両方を出典付きで書き、どちらが新しいかを示す
- ページを足したら、関連するページからもリンクを張る（片方向にしない）
- ページを改名・統合したら、それを指すリンクをすべて書き換える（DailyNoteの既存本文のリンクは許可なく書き換えられないので、旧ページを残して新ページへのリンクだけにする）

## 目次（`wiki/index.md`）

すべてのページを type ごとに載せる。1 行 = 1 ページ。`wiki-lint.mjs` が、載っていないページを検出する。

```markdown
## concept

- [大規模言語モデル](wiki/large-language-model.md) — 要約を 1 行で
```

## 操作の記録（`wiki/log.md`）

追記だけ。新しいものを末尾に書く。見出しの形式は固定（`daily-pending.mjs` と `usage-report.mjs` が読む）。

```markdown
## 2026-10-31 ingest | 記事のタイトル

- コミット: abc1234（操作を始めたときの HEAD）
- 入力: [記事のタイトル](sources/2026-10-31-foo.md)
- 作成: [ページ](wiki/foo.md)
- 更新: [ページ](wiki/bar.md)
- メモ: 判断に迷ったこと、残した課題
```

操作の種類は `ingest` / `query` / `lint` / `daily`。

## フィードバック（`wiki/feedback.md`）

ユーザーが、使っていて不便だったこと・欲しいことを書く場所。LLMは依頼の範囲で編集できる。月 1 回の評価で読む（[ADR-0006](../../.kit/harness/docs/adr/0006-self-improvement-loop.md)）。

## 操作の共通の手順

どのスキルも、この手順で始めて終える。

### 始める前

```sh
git switch main && git pull --rebase origin main   # 端末の snapshot を取り込む
git rev-parse --short HEAD                          # log の「- コミット:」に書く
```

クラウドのセッションなどで決められたブランチにしかいられない場合は、そのブランチで作業し、最後に PR にする（[ADR-0002](../../.kit/harness/docs/adr/0002-workflow-by-size.md)）。

### 終えるとき

1. `wiki/index.md` を更新し、`wiki/log.md` に記録を追記する
2. 書式を検査する: `node .claude/scripts/wiki-lint.mjs`。エラーは直す。警告（人のノート）は直さずにユーザーに伝える
3. コミットする: `git add -A && git commit -m "wiki(<操作>): <日本語の要約>"`
4. 所有の区分を守ったかを検査する: `node .claude/scripts/check-append-only.mjs origin/main..HEAD`。違反したら、追加のコミットで元に戻す
5. push する: `git pull --rebase origin main && git push origin main`。人のノートで衝突したら、止めてユーザーに伝える
6. 何をしたか（作った・更新したページ）を短くユーザーに伝える
