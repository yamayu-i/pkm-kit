# ADR-0077: issue / routine / member のヘッダーを、ノートのヘッダーと同じ DOM の差し込みにする

- 状態: 提案
- 日付: 2026-11-08

## 背景

- pkm-task の issue / routine / member の画面のヘッダーは、CodeMirror の block widget で作っている（[ADR-0008](0008-ui-preact.md)、[ADR-0012](0012-issue-screen.md)、[ADR-0018](0018-list-edit-routine-screen.md)、[ADR-0035](0035-member-view-and-fields.md)）。Live Preview では frontmatter の範囲を widget に置き換え、カーソルが入らないようにしている。Properties 欄は CSS で隠す
- pkm-template のノートのヘッダー（[ADR-0026](0026-note-views.md)）は、別の方式を採った。Obsidian が標準のタイトルを置く場所（エディタは `.cm-sizer`、リーディングビューは `.markdown-preview-sizer` の先頭）に DOM を差し込む。pkm-task にも採用するかは、[Issue #16](https://github.com/yamayu-i/pkm-kit/issues/16) で検討することにしていた
- widget の方式には、次の問題がある
  - リーディングビューにはヘッダーが出ない。issue / routine / member をリーディングビューで開くと、タイトルも項目も見えない（標準のタイトルは `showInlineTitle: false` で隠している）
  - ヘッダーの位置が本文の中で、ノートのヘッダーとそろわない
  - 方式が 2 つあり、Properties 欄の隠し方と、Obsidian を更新したときの確かめ方も 2 通りになる
- DOM の差し込みの弱点は、Obsidian の内部の DOM の構造に依存することである。pkm-template では 2026-11-01 から使い、位置が崩れた修正はまだない。ただし、実機で確かめた記録もない
- pkm-task のヘッダーは、pkm-template と違って編集する画面である（status のメニュー、日付、worklog、タイマー）。開く回数も多い（ボードのカードから開く）

## 決定

### 1. 方式

- issue / routine / member のヘッダーは、ADR-0026 と同じく、`.cm-sizer` と `.markdown-preview-sizer` の先頭に DOM を差し込んで出す。CodeMirror の widget（`StateField`、`Decoration.replace`、`atomicRanges`）はやめる
- 対象は今と同じく、パスで決める（`issue/*.md`、`routine/*.md`、`member/*.md`）。ヘッダーの中身（`IssueHeader`、`RoutineHeader`、`MemberHeader`）は変えない
- ヘッダーは Properties 欄より上、ページの一番上に出る

### 2. リーディングビュー

- リーディングビューにも、編集の画面と同じヘッダーを出す。ヘッダーの中の編集（status、日付、worklog など）も、リーディングビューでできる
- 本文はリーディングビューのまま（読むだけ）。ヘッダーだけが編集できる

### 3. Properties 欄と frontmatter

- Live Preview とリーディングビューでは、ヘッダーがあるとき Properties 欄（`.metadata-container`。壊れた YAML のエラー表示 `.mod-error` は除く）を CSS で隠す
- Live Preview で生の frontmatter を隠すのは、widget による置き換えではなく、Obsidian の標準の動き（`propertiesInDocument: visible` のとき、frontmatter を Properties 欄として描く）に任せる。この値は `.kit/obsidian-required.json` で全 Vault に必須にしている
- ソースモードでは、今と同じく生の frontmatter を見せる（壊れたときに直せるように）。ヘッダーはその上に出る

### 4. 差し込みの仕組みを共有する

- 差し込みの仕組み（どの sizer に入れるか、二重に足さない、先頭に保つ、外す、イベントの購読）は `packages/shared` に 1 つだけ置き、pkm-task と pkm-template の両方が使う。プラグインどうしは import しない（ADR-0023 と同じ）
- 各プラグインは、ノートが自分の対象か、何を描くかだけを渡す。pkm-template は今までどおり issue / routine / member を対象から外す（`note-list.ts`）

### 5. 出る時期と、消えたときの戻し

- ノートを開いたとき（`file-open`、`active-leaf-change`）は、待たずにすぐ差し込む。開くたびに遅れて出て、ちらつかないようにする
- `metadataCache` の変更など、続けて起きるイベントは、今の pkm-template と同じくまとめてから描き直す
- Obsidian が sizer の中身を描き直してヘッダーが外れたとき（リーディングビューのスクロールなど）は、sizer の直下の子の変化を見て（`MutationObserver`）、差し込み直す

### 6. 実機での確かめ

実装の前に、試作を実機で確かめる。確かめられなければ方式を見直し、この ADR を直す。確かめる項目は次のとおり。

- ヘッダーの中の操作が、エディタや Obsidian に取られないか（クリック、フォーカス、Tab、ショートカット、IME の入力、モバイルのタップとキーボード）
- ノートを開いたとき、ヘッダーが遅れて出たりちらついたりしないか
- リーディングビューでスクロールや描き直しのあとも、ヘッダーが残るか
- Live Preview で、生の frontmatter と Properties 欄が出ないか。ソースモードでは frontmatter が見えるか
- 1 つのノートを 2 つのペインで開いたときと、編集とリーディングを切り替えたとき

## 理由

- ヘッダーがページの一番上にそろい、リーディングビューでもタイトルと項目が見える
- 方式を 1 つにすると、Properties 欄の隠し方と、Obsidian を更新したときに確かめる場所（`.cm-sizer`、`.markdown-preview-sizer`、`.metadata-container`）も 1 通りになる。仕組みを shared に置けば、直すのも 1 か所になる
- frontmatter を widget で置き換える処理とカーソルの制御がなくなり、pkm-task のコードが簡単になる
- リーディングビューのヘッダーも編集できるようにするのは、読むだけの作りを別に持たずに済むため。status の変更などは、読んでいるときにもしたい操作である
- 開いたときにすぐ差し込むのは、ボードから issue を何度も開くので、遅れて出るのが目立つため

## 却下した案

- **widget はそのままにして、リーディングビューにだけ差し込む**: 変更は少ないが、方式が 2 つになり、編集とリーディングでヘッダーの位置が違う
- **先送りして、pkm-template の方式を実機で使う期間を延ばす**: 待っても、編集する画面での懸念（操作、ちらつき）は確かめられない。試作を実機で確かめる方が早い
- **リーディングビューのヘッダーは表示だけにする**: 読むだけの作りが別に要る。読んでいるときに status を変えられない
- **差し込みの仕組みを各プラグインに持つ**: 同じ処理が 2 つになり、Obsidian の更新で崩れたときに 2 か所を直すことになる
- **ヘッダーを Properties 欄の下（`.cm-content` の先頭）に置く**: ノートのヘッダーと位置がそろわない。今の widget と同じ問題が残る

## 影響

- ADR-0008 の「issue 画面のヘッダーは CodeMirror の block widget」と、ADR-0012・ADR-0018・ADR-0035 の、画面のヘッダーを widget で差し込む部分を置き換える（一部置換）。ADR-0026 の「vault-task にも採用するかは Issue #42 で検討する」は、この ADR で決着する
- pkm-task: `src/header/extension.ts` を差し込みに置き換え、`registerEditorExtension` をやめる。Properties 欄を隠す CSS を、Live Preview とリーディングビューの両方に効くように変える
- pkm-template: `src/obsidian/header-mount.ts` を shared の仕組みに載せ替える。見た目と振る舞いは変えない
- Obsidian の内部の DOM 構造への依存が、pkm-task にも広がる。Obsidian を更新したときは、両方のプラグインのヘッダーを確かめる
- 子のもの（ノート、設定）は変わらないので、移行はない。子から見える変更（リーディングビューのヘッダー）は `.kit/changes/` に書く
- 依存の追加はない。ノートへの書き込みは今と同じで、増えない。セキュリティチェックの対象は、ビルド成果物
- プロダクトの文書（issue 画面、routine 画面、ノートのヘッダー）の「今の振る舞い」を直す
