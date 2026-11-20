# ADR-0213: Notes の一覧に、note/ のフォルダの木の表示を足す

- 状態: 提案
- 日付: 2026-11-20

## 背景

[Issue #213](https://github.com/yamayu-i/pkm-kit/issues/213)。Notes の一覧（[ADR-0026](0026-note-views.md)）は `type: note` のノートを 1 枚の表で並べるだけで、ノートが増えるとまとまりで見られない。Slides の一覧（[ADR-0124](0124-slide-list-tree.md)）は `slide/` を 1 本の木にし、フォルダの操作（作る・名前を変える・動かす・消す、ドラッグ）を持つ。

テンプレートは新しいノートを `note/` に作る（`.kit/templates/config.json`）。一方、`type: note` のノートは Vault のほかの場所にもあり得る（以前の既定は Vault ルート）。

## 決定

### 1. 表示の切り替え

- Notes の View の上に、タブ「Table」「Folders」を置く。既定は Table
- 選んだタブは端末ごとに覚える（Obsidian の localStorage。Vault には書かない）。覚えたものがなければ Table
- Table は今までどおり（タイトル・Tags・Created の表、見出しで並べ替え、タイトルの絞り込み）。ADR-0026 の決定は変えない
- Daily notes・Sources の一覧は変えない

### 2. Folders の木

| 部分 | 内容 |
|---|---|
| 木 | `note/` を 1 本の木で見せる。フォルダの行を押すと開閉し、中のフォルダとノートの行を 1 段ずつ字下げして並べる。開いているフォルダは端末ごとに覚える。隠しフォルダ（`.` で始まる）は出さない |
| フォルダの行 | 名前、中（下の段も含む）の `type: note` のノートの数、「…」 |
| ノートの行 | タイトル（ADR-0026 の決め方）、Tags、Created、「…」 |
| 並び | 1 段の中は、フォルダ（名前の順）を先に、ノートを後に。ノートは Created の新しい順（既定）か Title の順 |
| note/ の外 | `note/` の外にある `type: note` のノートは、木の最後の「Other locations」の段にまとめ、行にフォルダの位置を出す（`tmp/` の下は今までどおり出さない） |
| 検索 | タイトルとファイル名で探し、当たったノートを平らな行で並べる（行にフォルダの位置を出す） |
| 色 | Slides と同じ。ホバーが state-hover、落とす先が primary-state-hover の面 + primary の枠 |

### 3. 操作

Slides と同じ操作を持つ。ファイルを動かすのは Obsidian の `fileManager.renameFile` で、ノートを指すリンクは Obsidian が書き換える（`alwaysUpdateLinks`）。

| 対象 | 操作 |
|---|---|
| ヘッダー | New folder（`note/` の直下に作る） |
| フォルダ | New folder（その中に作る）、Rename、Move to…、Delete |
| ノート | Open in new tab、Move to… |
| ドラッグ（PC） | ノートとフォルダを、フォルダの行に落とすとそのフォルダへ、行のない所に落とすと `note/` の直下へ動かす |

- 行き先は `note/` か、その下のフォルダだけ。「Other locations」のノートも `note/` の中へ動かせる（`note/` から外へは動かさない）
- フォルダを作ると `.gitkeep` を置く（git は空のフォルダを残さない）。`note/` がなければ作る
- Delete は、中に `.gitkeep` 以外のファイルがないフォルダだけ。ゴミ箱へ（`fileManager.trashFile`）
- フォルダ名は Obsidian がファイル名に使えない文字（`\ / : * ? " < > |`、`#^[]`）を含まず、`.` で始まらないもの。英語のケバブケースは求めない（ノートのファイル名と同じく日本語でよい）
- ノートの Rename は一覧に置かない。タイトルは frontmatter の `title` で、ファイル名は [note-rename](../../../../.claude/skills/note-rename/SKILL.md) で変える
- スマホでは、ドラッグを使わず、メニューで動かす

### 4. 実装の場所

- pkm-template に足す。木の 1 段の出し方・動かせるかの判定などの純粋な関数は `core/note-folders.ts` に置き、テストする
- pkm-slide のコードは import しない（パッケージ間の依存を作らない。ADR-0026 の決定 1）

## 理由

- 表は「新しい順に見る」「Tags で見分ける」のに向き、木は「まとまりで見る・整理する」のに向く。どちらも要るので切り替えにする。今の使い方を変えないよう、既定は表にする
- 木の範囲を `note/` にすると、テンプレートの作成先と一致し、`daily/` や `wiki/` など決まった場所のフォルダを動かしてしまうことがない
- Slides と同じ見た目と操作にすると、一覧ペインの中での読み方・動かし方を覚え直さずに済む

## 却下した案

- **Vault 全体のフォルダを木にする**: `daily/`・`wiki/`・`issue/` などの決まった場所が行に出て、動かすと規約を破れる。Obsidian のファイル一覧と役割が重なる
- **木だけにする（表をやめる）**: Tags と Created を並べて見比べる使い方ができなくなる
- **frontmatter の項目（例: `folder`）で仮想のフォルダを作る**: 新しい項目と規約が要り、Obsidian のファイル一覧やリンクのパスと食い違う
- **pkm-slide の木のコードを shared に移して共通にする**: 対象（デッキと整理のフォルダ、名前の規則、index.html の書き換え）が違い、共通にできる部分は小さい。今回は pkm-slide を変えない

## 影響

- 変更: `pkm-template` の `views/NoteListView.tsx`（タブと木）、`core/note-folders.ts`（新規とテスト）、`obsidian/` に操作（新規）、`styles.css`、プロダクトの文書（`surfaces/template-lists.md`）、ADR-0026 の状態（一部補足）
- 子の Vault: 移行は要らない（ファイルの場所も設定も変えない）。`.kit/changes/` に書く
- セキュリティ: ファイルを書くコード（`obsidian/`）を足すので、コミットの前にセキュリティチェックを行う
- 実機で確かめること: PC とスマホでのタブの切り替えと開閉、ドラッグで動かしたときのリンクの書き換え、空のフォルダの Delete、基本の色を変えた Vault での色
