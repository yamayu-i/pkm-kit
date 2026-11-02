# ADR-0023: テンプレートの ID 採番と、今日のデイリーノートを開くコマンド

- 状態: 承認
- 日付: 2026-11-01

## 背景

- [ADR-0022](0022-template-plugin.md) で vault-template を作ったが、issue / routine / member のテンプレートは vault-task が必要とする項目が足りず、ファイル名も ID（`i-N` など）にできない。ADR-0022 は、これらを「vault-task が専用で生成するもの」として非表示にする前提だった
- issue / routine / member は vault-task 専用ではなく、vault-task でも vault-template でも作れる Vault の通常のノートである
- 当日のデイリーノートにすぐ行く手段がない
- updated を作成時にも入れる決定は [ADR-0008（ハーネス）](../../../harness/docs/adr/0008-updated-on-create.md)

## 決定

### 1. `{{id:i}}` / `{{id:r}}` / `{{id:m}}`

- 展開される値: 既存のノートの basename の中の、同じ接頭辞の最大番号 + 1（`i-5` など）。なければ `<接頭辞>-1`。欠番は埋めない
- 連番の規則は vault-task の `core/ids.ts`（`nextIds`）と同じ。vault-template にも同じ関数（`src/core/ids.ts`）を持つ。パッケージ間で import しない
- 1 つのテンプレートの中で同じ `{{id:i}}` は同じ値になる（ファイル名と frontmatter の `id` が一致する）
- 既存のノートの見方は vault-task の `takenIds` と同じ: Vault の全 Markdown の basename
- 接頭辞が `i` / `r` / `m` 以外のときは展開せず、そのまま残す

### 2. ID でファイル名が決まるテンプレート

- `fileNamePattern` に `{{id:…}}` を含むとき、ファイル名はパターンで固定する。モーダルの入力欄は「ファイル名」ではなく「タイトル」になり、`{{title}}` の値になる
- タイトルは必須。空ならエラーにする
- `template/config.json` では issue は `folder: "issue"`・`fileNamePattern: "{{id:i}}"`、routine は `routine`・`{{id:r}}`、member は `member`・`{{id:m}}`
- テンプレートは vault-task が必要とする項目をすべて持つ: issue は `schema` `type` `id` `summary` `status` `created` `updated`、routine は `schema` `type` `id` `summary` `repeat` `active` `created` `updated`、member は `schema` `type` `id` `name` `created` `updated`。任意の項目は書かない（vault-task も空なら書かない）
- `enabled` は、モーダルに出すかどうかだけを表す。vault-task の専用かどうかを表さない（ADR-0022 の記述を補足する）

### 3. 今日のデイリーノートを開く

- コマンド「今日のデイリーノートを開く」と、リボンアイコンを用意する。ホットキーは Obsidian で割り当てる
- パスは `template/config.json` の `daily.md` の `folder` と `fileNamePattern` から決める。`daily.md` が `enabled: false` でも使う。設定がなければ規約どおり `daily/YYYY/MM/YYYY-MM-DD.md`
- ファイルがあれば開くだけで、中身には触れない。なければ `template/file/daily.md` から作って開く

## 理由

- 連番は、ID 固定のファイル名と frontmatter の `id` の両方に要る。JavaScript を埋め込む案は ADR-0022 で却下済みなので、変数にする
- 連番の関数を共有ではなく複製にするのは、パッケージごとに独立してビルドしている構成を保つため。規則は小さく、テストで揃える
- ID 固定のときに入力欄を title に切り替えるのは、設定項目を増やさず、パターンの内容だけで決められるため

## 却下した案

- **vault-task の `ids.ts` を vault-template から import する**: パッケージ間の依存が生まれる。ユーザーの指示で、vault-template 側にも連番のロジックを持つ
- **連番を `template/config.json` のカウンタで管理する**: 端末間で同期するとき衝突する。既存ノートの最大値から数える（vault-task と同じ）
- **コアの daily-notes プラグインを使う**: `{{date}}` が対象日で展開されるので、created が作成日時にならず、vault-template の規約と合わない

## 影響

- 連番の規則が 2 か所にある。変えるときは両方を変える
- モバイルなど複数の端末で同時に作ると、同じ番号になりうる。vault-task と同じ制約で、Vault Git の同期後の `task:lint` で見つかる
- ファイルの書き込みを伴うので、セキュリティチェックの対象
- 既存の issue / routine / member に updated がないものの補完は範囲外
