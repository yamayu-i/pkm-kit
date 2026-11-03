# ADR-0026: 主要なノートの一覧 View とノートの View(ヘッダー)を vault-template に足す

- 状態: 承認（一部置換: 0027, 0032）
- 日付: 2026-11-01

## 背景

- issue / routine には vault-task の専用 View(一覧、画面のヘッダー)があるが、daily / note / source / wiki のページにはない([Issue #35](https://github.com/yamayu-i/yamayu-pkm/issues/35))
- 本文の上に出る Obsidian 標準のタイトル(inline title)はファイル名である。ファイル名は今後、英語のスネークケースに統一する予定で([Issue #41](https://github.com/yamayu-i/yamayu-pkm/issues/41))、ファイル名とタイトルが乖離することが前提になる
- ノートの種類ごとの規約とテンプレートは vault-template が持っている([ADR-0022](0022-template-plugin.md), [ADR-0023](0023-template-id-and-daily.md))。デイリーノートを開くコマンドもここにある

## 決定

### 1. 実装の場所

- 実装は vault-template に足す。新しいプラグインは作らず、vault-task にも足さない
- vault-task のコードは import しない([ADR-0023](0023-template-id-and-daily.md) と同じ。パッケージ間の依存を作らない)。View を Preact で作る小さな仕組み(`ItemView` の包み)は vault-template にも持つ
- 新しい外部パッケージは追加しない(既存の `preact` のみ)

### 2. 一覧 View

| View | 対象 | 列 |
|---|---|---|
| Daily notes | `type: daily` | 日付と曜日、created |
| Notes | `type: note` | タイトル、tags、created |
| Sources | `type: source` | タイトル、origin、retrieved、取り込み状態 |

- 対象は、ファイルの場所ではなく frontmatter の `type` で決める(`metadataCache` から読む)。ノートの場所に依存しない
- 並べ替え(既定は新しい順)と、タイトルの絞り込み検索を持つ。行をクリックすると、そのノートを開く
- Sources の「取り込み状態」は、frontmatter に項目を足さず、wiki のページの `sources` に載っているかどうかから導く(載っていなければ未取り込み)
- コマンド「Daily notes を開く」などと、リボンアイコンを用意する。issue の一覧とは別の View で、`vault-template-` の接頭辞を付ける

### 3. ノートの View(ヘッダー)

- 方式は、Obsidian が標準のタイトルを置く場所(エディタは `.cm-sizer`、リーディングビューは `.markdown-preview-sizer` の先頭)への DOM の差し込み。ヘッダーは Properties 欄より上、ページの一番上に出る。本文は通常のエディタのまま編集する
- 差し込みは `file-open` / `layout-change` / `active-leaf-change` と、そのノートの `metadataCache` の変更のたびに、作り直すか更新する。すでに差し込んであれば二重に足さない
- 編集とリーディングを同じ仕組みで扱う。Properties 欄は隠さない
- vault-task のヘッダー(CodeMirror の widget)とは方式が違う。vault-task にも採用するかは [Issue #42](https://github.com/yamayu-i/yamayu-pkm/issues/42) で検討する
- 対象の type: daily、note、source、concept、entity、topic、answer
- 上の type 以外のノート(feedback、index、log、型のないもの)には、タイトルだけの簡素なヘッダーを出す
- issue と routine には出さない(vault-task のヘッダーがタイトルを表示している)

| type | ヘッダーの内容 |
|---|---|
| daily | 日付と曜日、日曜始まりの 7 枠(下記) |
| note | タイトル、tags、created |
| source | タイトル、origin(リンク)、retrieved、取り込み先の wiki ページへのリンク |
| concept / entity / topic / answer | タイトル、出典(`sources`)の一覧、このページを指すリンクの数 |

- ヘッダーは表示のみ。frontmatter の編集は、これまでどおり Obsidian の Properties で行う
- ヘッダーのデザインは [デザインルール](../design.md) と `packages/design` のトークンに従う

### 4. タイトルの決め方

- 上から順に、最初に見つかったものを使う。どれもなければファイル名(拡張子なし)
  1. `title`
  2. `name`(member)
- daily だけは `title` を使わず、ファイル名の日付から導く。ファイル名が `YYYY-MM-DD` でないときは、ファイル名のまま表示する
- Obsidian 標準のタイトルは、`.obsidian/app.json` の `showInlineTitle: false` で隠す(コミットする設定)。すべての Markdown のノートは、vault-task のヘッダーか、vault-template のヘッダーのどちらかでタイトルが出る
- frontmatter に項目は足さない。note は `title` を持たなくてよい(なければファイル名)

### 5. daily のヘッダー

- 左に `2026-11-01 SUN` の形で日付と曜日を出す
- 右に日曜始まりの 7 枠(SUN〜SAT)を並べ、そのノートの曜日の枠にフォーカスを当てる(強調表示)
- 7 枠は表示だけで、移動や作成はしない。日付の入力もない

## 理由

- ノートの種類ごとの設定とテンプレートはすでに vault-template にあり、`type` を扱う場所として自然。vault-task はタスク管理に集中させる
- 型の判定を frontmatter の `type` にするのは、`vault-conventions` の「type はノートの役割」と一致し、置き場所を変えても壊れないため
- 標準のタイトルを隠して全ノートにヘッダーを出すのは、ファイル名と乖離したタイトルを、どのノートでも同じ場所で正しく見せるため
- 取り込み状態を導出にするのは、状態を frontmatter に持つと、wiki のページとの二重管理になり、ずれるため(frontmatter が正本、派生値は保存しない: [ADR-0002](0002-frontmatter-as-source-of-truth.md) と同じ考え方)

## 却下した案

- **CodeMirror の widget にする(vault-task の issue のヘッダーと同じ)**: 本文の中に入るので、Properties 欄の下に出てページの一番上にならない。リーディングビューには出ず、別の仕組みが要る。vault-task は Properties 欄を隠して frontmatter を置き換えているが、今回は Properties を残す
- **vault-task に足す**: View の基盤はあるが、役割がタスク管理から広がる。ノートの種類とテンプレートを持つ vault-template の方が近い
- **新しいプラグインにする**: 一覧も、ヘッダーも、`type` とテンプレートの規約に依存する。分けるとプラグインが増え、設定と検査も増える
- **ヘッダーから frontmatter を編集する**: 書き込みの検証と、vault-task が管理する項目(daily の `board` など)との衝突を考える必要がある。まず表示だけにして、必要になってから別の ADR で決める
- **7 枠を日付の移動リンクにする**: 今回は要らないと判断した。必要になったら足す
- **標準のタイトルを残し、ヘッダーに別のタイトルを出す**: タイトルが二重になる

## 影響

- `.obsidian/app.json` に `showInlineTitle: false` を足す。ビルド成果物(`main.js` ほか)を `.obsidian/plugins/vault-template/` にコミットする
- Obsidian の内部の DOM 構造(`.cm-sizer`、`.markdown-preview-sizer`、`.inline-title`)に依存する。Obsidian の更新で位置が崩れうるので、バージョンを上げたときは見た目を確かめる
- リーディングビューにも同じヘッダーが出るので、標準のタイトルを隠してもタイトルは消えない
- member は vault-task の専用 View([Issue #39](https://github.com/yamayu-i/yamayu-pkm/issues/39))ができるまで、タイトルだけの簡素なヘッダー(`name`)になる
- `.claude/docs/vault-conventions.md` に、タイトルの決め方(`title`、`name`、ファイル名)と `showInlineTitle` を追記する
- ファイル名の統一と、新規作成時のタイトル・ファイル名の別入力は [Issue #41](https://github.com/yamayu-i/yamayu-pkm/issues/41) で扱う
- `tmp/` とその一覧は [Issue #40](https://github.com/yamayu-i/yamayu-pkm/issues/40) で扱う
- ファイルの読み取りとヘッダーの描画だけで、書き込みは増えない。セキュリティチェックの対象は、`app.json` の変更とビルド成果物
