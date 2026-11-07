# ADR-0035: member の項目（name / nickname / aliases）と、member の専用 View

- 状態: 提案
- 日付: 2026-11-07

## 背景

- issue / routine には vault-task の専用 View（一覧と画面のヘッダー）があるが、member（委任先の人。`member/m-N.md`）にはない（[Issue #13](https://github.com/yamayu-i/pkm-kit/issues/13)）。member の画面は vault-template のタイトルだけの簡素なヘッダー（[ADR-0026](0026-note-views.md)）で、項目は Properties 欄で直すしかない
- member の項目は `name` だけ（[ADR-0007](0007-labels-and-members.md)）。本名と、ふだん呼んでいる呼び名が違う人が多く、委任先を選ぶときに呼び名やローマ字（`yamada-san`、`tanapon`）で探せない

## 決定

### 1. member の項目

| 項目 | 型 | 意味 | 作るときの値 |
|---|---|---|---|
| `name` | 文字列（必須） | 本名（姓・名） | 登録名（作るときに入れた名前） |
| `nickname` | 文字列 | 自分が呼んでいる呼び名 | 登録名 |
| `aliases` | 文字列のリスト | 検索に使う文字列（例: `yamada-san`、`tanapon`） | `[ID]`（例: `[m-3]`） |

- 検索用の項目は Obsidian 標準の `aliases`（リスト）にする。`vault-conventions` の「aliases はリスト」と一致し、Obsidian のクイックスイッチャーやリンクの候補でも、その人のノートが出る
- 作る仕組みはどちらも同じ値を入れる: vault-task の「新しく作る」（`MemberSuggestModal`、MCP）と、vault-template のテンプレート `.kit/templates/file/member.md`（`nickname: "{{title}}"`、`aliases: ["{{id:m}}"]`。`{{id:m}}` は 1 回の展開の中で同じ値になる）
- 読むとき: `nickname` が空・ないときは `name` を使う。`aliases` がないときは空のリスト。`aliases` がリストでないときは問題（`invalid-aliases`）として lint と vault-task に出す
- 作った後は、どの項目も自動では書き換えない（`name` を変えても `nickname` は変えない）

### 2. 表示と検索

- member を表示する場所（issue 画面とボードの委任先、委任先を選ぶ画面の候補）は `nickname` を出す（空なら `name`）。候補には `name` が違えば小さく添える
- 委任先を選ぶ画面（`MemberSuggestModal`）は、`name`・`nickname`・`aliases`・ID のどれかに部分一致（大文字小文字を区別しない）したものを出す。「新しく作る」は、どの member の `name`・`nickname`・`aliases` とも完全一致しないときに出す
- member のノートのタイトル（ADR-0026 の決め方）は `name` のまま変えない

### 3. 一覧 View（Members）

- vault-task に `vault-task-members`（タイトル `Members`、アイコン `users`）を足す。一覧ペインに開き（[ADR-0033](0033-list-pane.md)）、コマンド「Members を開く」と、左サイドバーのナビゲーション（Labels の前）に足す
- 行: ID、nickname、name（nickname と違うときだけ）、aliases（ID 以外）、委任中の issue の数（`delegated_to` がその member で、done / canceled でないもの）
- 絞り込みの検索欄（`MemberSuggestModal` と同じ一致の規則）と、「member を作成」ボタン（名前を 1 つ入れる。値は 1 の表のとおり）を持つ。行をクリックすると、その member のノートをノートペインに開く
- 並びは ID の番号順

### 4. member の画面（ヘッダー）

- issue / routine と同じく、`member/*.md` を開いたら CodeMirror の widget のヘッダーを文書の先頭に差し込み、Properties 欄と raw の frontmatter を隠す（ADR-0008, 0018。ソースモードでは frontmatter を見せる）
- ヘッダーの内容:
  - created / updated、ID のバッジ
  - **nickname**（大きく。クリックで編集）、**name**（クリックで編集。空にはできない）
  - **aliases**（チップの列。チップの × で外し、入力欄で足す。空白だけ・重複は足さない。ID のエイリアスも外せる）
  - 委任中の issue の一覧（ID、summary、status。クリックでその issue を開く）。終わったもの（done / canceled）は件数だけ出す
- 書き込みは今までどおり `TaskWriter.update`（frontmatter の該当の行だけを書き換える）。`updated` はコミット時に付く（ADR-0028）
- vault-template は member に簡素なヘッダーを出さない（issue / routine と同じ扱い。`note-list.ts` の除外に `member` を足す）

### 5. 既存の member（移行）

- 移行 `0004` を付ける: `member/*.md` で `nickname` がないものに `nickname: <name と同じ値>`、`aliases` がないものに `aliases: [<ID>]` を足す。ほかの行と本文は変えない
- 子の `template/file/member.md` がある（上流のテンプレートを上書きしている）ときは、スクリプトは変えず、`nickname` と `aliases` を足すかをユーザーに確かめる（README に書く）
- 移行しなくても動く（1 の読み方のとおり、なければ `name` と空のリスト）

## 理由

- 本名・呼び名・検索語を分けると、ノートには正式な名前を残しつつ、画面には自分が呼ぶ名前を出し、思い出せる言い方で探せる
- `aliases` にするのは、Obsidian が標準で検索に使う項目で、プラグインの外（クイックスイッチャー、リンクの補完）でも同じ効果があるため
- 初期値を入れておくと、ノートを開いたときに項目が揃っていて、何を書く欄かが分かる。`aliases` に ID を入れるのは、ID でも見つけられるようにするため
- 画面は issue / routine と同じ仕組み（widget のヘッダーと、一覧ペインの一覧）にすると、見た目と操作が揃い、コードも使い回せる

## 却下した案

- **単数の `alias`（文字列）にする**: 1 人に複数の呼び方がある（例のように 2 つ以上）。Obsidian の標準の `aliases` と別の項目になり、クイックスイッチャーに効かない
- **`nickname` を `name` の代わりにタイトルにする**: wiki の人物のノートとしては本名がタイトルの方が他のノートから参照しやすい。画面の大きい表示だけ nickname にする
- **vault-template に member の View を足す（ADR-0026 の一覧 View と同じ場所）**: 委任中の issue の一覧や、委任先を選ぶ画面との一致の規則など、タスク管理の索引が要る。ADR-0026 でも member は vault-task の専用 View を待つとした
- **Properties 欄で編集してもらう**: aliases の足し外しや、name を空にしない検査ができない

## 影響

- `Member` 型に `nickname`・`aliases` を足し、`parseMember`・`newMemberContent`・`MemberSuggestModal`・ボードと issue 画面の委任先の表示・MCP（member の一覧と作成）・lint を変える
- `.kit/templates/file/member.md` に `nickname` と `aliases` を足す。`.claude/docs/vault-conventions.md` の配置の表の member に項目を書き足す
- 子には移行 `0004` が届く。`.kit/CHANGELOG.md` に書く
- ビルド成果物（vault-task と vault-template の `main.js` ほか、`.kit/bin/`）をコミットする
- member のノートに書き込む操作が増える（ヘッダーからの編集）。セキュリティチェックの対象は、ビルド成果物と移行スクリプト
