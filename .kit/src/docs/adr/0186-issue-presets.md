# ADR-0186: issue のプリセット（サブイシューの一覧と本文）を md で持ち、issue 画面から呼び出す

- 状態: 承認（一部置換: 0231）
- 日付: 2026-11-16

## 背景

同じ形の issue（決まった手順のサブイシューと、決まった本文の見出し）を何度も作ることがある。今は、サブを 1 件ずつ足し、本文を書き写している（#186）。

サブイシューの項目の一覧と本文をひとまとめにした「プリセット」を登録しておき、issue 画面から呼び出したい。

## 決定

### 保存先と形（md のノート）

- 1 件を 1 つの md にし、`preset/p-N.md` に置く。ID（`p-N`）は issue / routine / member と同じ連番（ADR-0003, 0023）。type は `preset`
- frontmatter に名前とサブの題の一覧、本文に issue に追記する Markdown を書く

```md
---
schema: 1
type: preset
id: p-1
name: "Release"
sub_issues:
  - "Write the changelog"
  - "Tag the version"
created: 2026-11-16T10:00:00+09:00
updated: 2026-11-16T10:00:00+09:00
---
## Checklist

- [ ] ...
```

- サブの項目は題だけを持つ（文字列のリスト。同じ題が重なってもよい）。status は追加したときに open、日付・見積もり・委任先は持たない（呼び出す日によって変わるため）
- 本文は frontmatter の後ろ全体（前の空行と末尾の空白を除く）
- 書けない題（空・改行・`-->`）と、行頭に `<!-- sub-issue` のある本文（issue の中でサブの区切りと読まれる）は lint の問題（`invalid-preset-sub` / `invalid-preset-body`、error）にし、その題・本文は使わない
- テンプレート `.kit/templates/file/preset.md`（`{{id:p}}`）を足す。issue と同じく、テンプレートの一覧には出さない（`enabled: false`）。作るのは Presets の一覧から

### プリセットの画面（md に埋め込む UI）

- `preset/*.md` を開くと、issue・routine・member と同じく、ページの一番上に pkm-task のヘッダーを差し込む（ADR-0077）。Properties 欄は隠す。pkm-template のヘッダーは出さない
- ヘッダー: 作成・更新の日時、ID と名前（押して直す。issue の題と同じ部品）、「Sub-issues」のカード、呼び出し方の短い説明、本文の見出し「Body」
- 「Sub-issues」のカード: 題の入力欄（`.vt-name-field`。ラベルは番号）を 1 行ずつ並べ、行ごとに並べ替え・削除（`RowTools`）。Enter か欄を離れたときに保存し、Escape で戻す。最後に素早い追加の欄（Enter で 1 件。複数行の貼り付けは行ごと。issue 画面の追加と同じ）。書けない題は保存せず、欄の下に日本語の説明を出す。保存は frontmatter の `sub_issues` の書き換え
- 本文は、ヘッダーの下のふつうのエディタ（Live Preview / Reading）で書く

### 一覧（Presets）

- View「Presets」（`pkm-task-presets`、アイコン `copy-plus`）。左サイドバーの Labels の下と、コマンド「Open Presets」から開く
- Members の一覧と同じ作り: 見出し（題・件数・右に「Create preset」）、検索欄（ID・名前・サブの題・本文）、1 行 1 件（ID・名前・本文の 1 行目・サブの件数）。行を押すとプリセットの画面を開く
- 「Create preset」は名前を入れるダイアログ。作ったらプリセットの画面を開き、そこでサブと本文を書く

### 呼び出し（issue 画面）

- issue 画面の「Sub-issues」カードの見出しの右に、アイコンボタン「Apply preset」（`copy-plus`）を置く。押すとメニューにプリセットの名前を並べ、最後に「Manage presets…」（Presets の一覧を開く）を置く。プリセットが 0 件なら「Manage presets…」だけを出す
- 選ぶと、1 回の書き込み（`vault.process`）で次の 2 つを行う:
  1. プリセットのサブを、一覧の順に、サブの末尾へ足す（素早い追加と同じ位置・同じ既定値。ADR-0142）
  2. プリセットの本文を、親の本文（サブの領域の前）の末尾に、空行を 1 つ挟んで追記する。本文が空なら何もしない。既存の本文は変えない
- 検査（`checkSubIssues`）に通らなければ書かない。書いたら通知で知らせる（「プリセット「Release」を追加しました（サブ 2 件）」）
- 確認のモーダルは出さない（足すだけで、既存のものを消さない）

### 文言

常に出る文言は英語、検査と通知の文は日本語（`docs/design.md`「文言」）。部品の表に、プリセットの行を足す。

## 理由

- md なら、本文を Obsidian のエディタ（Live Preview・リンク・チェックボックス）でそのまま書け、ノートとして同期・検索・履歴の仕組みに乗る。issue と同じく「md + 埋め込みのヘッダー」にすれば、操作の覚え方が増えない
- サブの題を frontmatter に置けば、本文（追記する Markdown）と混ざらない
- 題だけを持てば、古い日付が入る誤りは起きない
- 呼び出しをサブのカードに置けば、サブを足す場所（素早い追加）の近くにまとまる

## 却下した案

- **`issue/presets.json` に置き、Labels のような編集画面で直す**（最初の案）: 本文を素の入力欄で書くことになり、Markdown の編集の助けがない。ユーザーの判断で md に変えた
- **pkm-template のテンプレートとして持つ**: テンプレートは新しいノートを作るもので、既存の issue に足す操作と合わない
- **サブを issue と同じ `<!-- sub-issue` のブロックで本文に書く**: 呼び出すたびに id を振り直す必要があり、本文との区切りも分かりにくい
- **サブの日付・見積もりも持つ**: 呼び出す日で意味が変わる。必要になったら足す
- **呼び出しで本文を置き換える**: 書いた本文を失う。依頼は追記

## 影響

- type に `preset` が増える（`.claude/docs/vault-conventions.md` の配置と type の一覧、`note-rename` の対象外のフォルダ）。ID の接頭辞 `p` を pkm-task と pkm-template の両方に足す
- pkm-task に View とヘッダーが 1 つずつ増える。CLI（lint・MCP の読み込み）も `preset/` を読む
- 子の Vault に手を入れないので移行は要らない（`preset/` は最初のプリセットを作ったときにできる）。`.kit/changes/` に変更を 1 件書く
- `docs/design.md` の部品の表に 1 行足す
