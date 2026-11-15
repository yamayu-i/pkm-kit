# ADR-0148: Inbox は日付ではなく clarified（整理済み）で決める

- 状態: 提案
- 日付: 2026-11-15

## 背景

Inbox は「`open` で、`scheduled`・`soft_deadline`・`deadline` がどれもないもの」と決めている（[ADR-0006](0006-status-inbox-someday.md)）。これは「日付がない」を「未整理」と取り違えている（#134 §3.2）。

| ケース | 今の判定 | 本来 |
|---|---|---|
| 締切だけ確定していて、中身は曖昧 | Inbox に入らない | Inbox に入る |
| 整理済みだが、実行日は未定 | Inbox に入る | Inbox に入らない |

また、Inbox に戻す操作（`inboxPatch`）は予定と期限をすべて消す。再整理したくなっても、外から与えられた締切は消えない。

## 決定

### Inbox の定義

- `isInbox(issue)` を「`status` が `open` で、`clarified` が `true` でない」に変える。日付は見ない
- `clarified` は frontmatter の真偽値。「何をするか・何が済めば終わりかを自分で決めた」ことを表す。未設定は未整理（`false` と同じ）
- 1 行の登録（クイックキャプチャ、Inbox 画面の入力欄、MCP の `create_issue`）は、これまでどおり `clarified` を書かない。登録は軽いままにする
- status とは別の項目にする。`open` 以外の status（`in-progress`・`waiting` など）は、`clarified` が未設定でも Inbox に出ない（ADR-0006 のとおり）

### clarified を付ける・外す

- Organize で、Do Date・Later（soft_deadline）・期限のいずれかを決めたら、`clarified: true` を一緒に書く
- Organize の Someday・Cancel・Already done は status が変わるので、`clarified` は触らない
- 「Inbox に戻す」（View のアクション、ボードの Inbox 操作、MCP）は、`clarified` を消すだけにする。`scheduled`・`soft_deadline`・`deadline` は残す。status が `open` でなければ `open` に戻す
- issue の画面と一覧から、`clarified` を直接切り替えられる
- Organize で Do Date を決めるときの `estimated` は、要求しない（任意）。これまでは Inbox のときだけ要求していた（[ADR-0030](0030-organize-schedule-calendar.md)）

### 範囲

- サブイシュー（[ADR-0135](0135-sub-issues-in-issue-file.md)）は Inbox の対象にしない。サブは行動として作るので、`clarified` を持たない
- routine は対象外（これまでどおり）

### 移行

- 既存の `open` の issue のうち、`scheduled`・`soft_deadline`・`deadline` のどれかがあるものに `clarified: true` を書く。日付がないものは書かない（今も Inbox なので、そのまま Inbox に残る）
- 見た目は移行の前後で変わらない。変わるのは、移行のあとに起きる操作から
- 番号は Issue に合わせて `0148-inbox-clarified`。冪等にする

### 派生する変更

- `isInbox` を使う Inbox 画面、Organize、PKM Updates の Inbox 欄、サイドバーの件数、MCP の Inbox の一覧、metrics、task-coach スキルを、新しい定義にそろえる
- ADR-0006 の Inbox の節を一部置換する。Someday と期限の色の節、「Inbox を status にする案」の却下は変えない

## 理由

- 「整理したか」と「いつやるか」は別の問いなので、別の項目に持つ。締切の近さと仕事の明確さを独立に扱える（#134 §3.2、例 C）
- 未設定を未整理にするので、登録は 1 行のまま。入力の負担を増やさない（#134 §5 の Bellotti の知見の、管理の手間を増やさないという点）
- 日付を残す「Inbox に戻す」にすれば、再整理が締切を消さない
- Organize で日付を決めることは整理の完了を意味するので、そこで `clarified` を付けるのが自然
- `estimated` を要求しないのは、見積もりは整理の条件ではなく、任意の情報だから。見積もりがないとボードの負荷計算は粗くなるが、それは別に扱う

## 却下した案

- **Inbox を status にする**: ADR-0006 が却下した案。status の色・遷移・集計すべてに影響し、`open` と二重になる。今回は status とは別の真偽値で持つ
- **現在の定義のまま、本文に「要明確化」と書いて運用する**: 期限付きで曖昧なものは Inbox に出ないまま残る。機械が読めないので、Organize・MCP・タスクコーチが使えない
- **`needs_clarification: true` を書く（未設定が整理済み）**: 既存の issue を移行しなくて済むが、登録時に毎回この項目を書く必要が生じる。1 行の登録に反する
- **「再整理」と「Inbox に戻す（日付も消す）」を別の操作にする**: 操作が増える。日付を消したいときは Someday か期限の編集で足りる
- **Do Date を決めるとき、見積もりが空なら常に要求する**: 整理の手間が増える。管理の手間を増やさない方針に反する

## 影響

- 変更するもの: `core/schema.ts`（`clarified` の読み書き）、`core/index.ts`（`isInbox`）、`core/actions.ts`（`inboxPatch`、`organizeSchedulePatch`、`schedulePatch`）、`views/OrganizeView.tsx`（`requireEstimate`）、`cli/mcp.ts`・`cli/vault-ops.ts`、`core/lint.ts`、issue 画面・一覧の切り替え、`docs`（プロダクトの文書）、`task-coach` スキル
- 移行 `.kit/migrations/0148-inbox-clarified/`。子の Vault の issue の frontmatter を書き換えるので、`.kit/changes/` に変更のノートを書く
- `clarified` は `sources` などと同じく通常のメタデータ。`updated` の自動付与（ADR-0028）の対象になる
- ADR-0006 の状態を `承認（一部置換: 0032, 0148）` にする（承認のとき）
