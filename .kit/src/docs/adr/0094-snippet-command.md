# ADR-0094: スニペットからコマンドを実行し、行頭の /drawio で新しい図とその参照を作る

- 状態: 提案
- 日付: 2026-11-08

## 背景

- 図を作るには、コマンドパレットの「New diagram (asset/*.drawio.svg)」（pkm-drawio、ADR-0064）を開く必要がある。書いている途中のノートからは遠い（Issue #94）
- 行頭の `/` で出るスニペット（ADR-0060、pkm-template）は、決まった本文を挿入するだけで、ファイルを作るなどの処理はできない
- pkm-drawio と pkm-template は互いに依存しない。Obsidian の `EditorSuggest` は同時に 1 つしか出ないので、pkm-drawio が別に行頭の `/` の候補を出すと、スニペットの候補とぶつかる（どちらか一方しか出ない）
- pkm-drawio の「New diagram」は、名前を尋ねて Draw.io の編集画面を開き、保存したら、開いていたノートのカーソルの位置に `![名前](asset/<名前>.drawio.svg)` を入れる。すでに「図の作成と参照の挿入」はできている

## 決定

### 1. スニペットの `command`

- スニペットの frontmatter に、任意の項目 `command`（Obsidian のコマンドの ID。例: `pkm-drawio:create-diagram`）を足す。`name`・`alias` と同じく単一の文字列。値は `^[a-z0-9-]+:[A-Za-z0-9_-]+$` に合うもの。合わなければ候補に出さず、コンソールに理由を出す（ADR-0060 と同じ扱い）
- `command` のあるスニペットを選ぶと、打った `/…` を消し、カーソルをその位置に置いてから、そのコマンドを実行する。本文は挿入しない（本文は空にしておく。書いてあっても使わない）
- コマンドがない（プラグインが無効など）ときは、打った `/…` を残し、「<コマンド> を実行できません（<プラグイン ID> が有効になっていません）」と通知する。実行の可否は `app.commands.executeCommandById()` の戻り値で見る（pkm-ribbon・pkm-updates と同じ）
- 候補の表示は今と同じ `alias: name`
- インラインテンプレート（`@`、ADR-0067）では `command` を使わない（`command` のあるファイルは候補に出さない）。行の中の `@` からファイルを作る場面は今はない

### 2. 上流の既定のスニペット `drawio`

- `.kit/templates/snippet/new-drawio.md` を足す

```md
---
name: new-drawio
alias: drawio
command: pkm-drawio:create-diagram
---
```

- 行頭で `/drawio`（や `/new-d`）を打って選ぶと、pkm-drawio の「New diagram」が動く。名前を入れて Draw.io で保存すると、`/drawio` を打った位置に `![名前](asset/<名前>.drawio.svg)` が入る
- 名前の入力や編集画面を閉じた（作らなかった）ときは、何も入らない（打った `/drawio` は消えたまま）
- pkm-drawio の作成の処理は変えない（ADR-0064 のまま）

## 理由

- 行頭の `/` の候補を pkm-template の 1 か所に保つと、候補がぶつからず、使う人は `/` だけを覚えればよい
- コマンドの ID でつなぐと、pkm-template と pkm-drawio が互いのコードに依存しない。pkm-drawio が無効なら通知が出るだけで壊れない
- スニペットのファイルで足すので、子も `template/snippet/` に同じ書式でほかのコマンド（デイリーノートを開く、など）を足せ、上流の `new-drawio.md` を同じファイル名で差し替えられる
- 作成と参照の挿入はすでに「New diagram」にあるので、同じ処理を 2 か所に書かずに済む

## 却下した案

- **pkm-drawio が自分で行頭の `/drawio` の `EditorSuggest` を出す**: pkm-template のスニペットの候補とぶつかり、`/` で片方しか出なくなる。行頭の判定（ADR-0060 の `StateField`）も二重に持つことになる
- **pkm-template が図のファイルを作る（Draw.io の空の SVG をテンプレートとして置く）**: 編集画面を開くには pkm-drawio が要り、作るだけで編集できない図が残る。ファイルの名前の尋ね方・重複の確かめ方も 2 か所に書くことになる
- **pkm-drawio が pkm-template に「スラッシュコマンド」を登録する API**: プラグインの読み込み順と公開 API の管理が要る。コマンドの ID で足りる
- **本文の挿入とコマンドの実行を両方する**: 今の用途では要らず、挿入とコマンドの順やカーソルの位置の決まりが増える。要るようになったら足す

## 影響

- pkm-template: スニペットの読み込み（`src/core/snippet.ts`）と、選んだときの処理（`src/obsidian/SnippetSuggest.ts`）が変わる。ADR-0060 の「frontmatter は `name` と `alias` の 2 つ」に `command` が加わる（ADR-0060 は一部置換）
- `.kit/templates/snippet/new-drawio.md` が増える（上流の既定）
- `.claude/docs/vault-conventions.md` のスニペットの説明に `command` を足す
- 子のものを書き換える移行は要らない。`.kit/changes/` に変更を書く
- 実機で確かめること: PC とモバイルで、`/drawio` → 名前 → 保存のあとに、打った位置に参照が入ること。名前の入力を閉じたときに何も入らないこと
