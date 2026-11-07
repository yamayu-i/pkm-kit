# ADR-0036: member の label と、Members の一覧の絞り込み・並べ替え

- 状態: 提案
- 日付: 2026-11-07

## 背景

- [ADR-0035](0035-member-view-and-fields.md) で member の項目（name / nickname / alias）と Members の一覧を作った。member が増えると、所属（チーム、取引先など）で分けて見たり、名前順に並べたりしたくなる
- issue と routine には `label` があり、定義（色）は `issue/labels.json` に 1 つだけ置いている（[ADR-0007](0007-labels-and-members.md)、[ADR-0024](0024-label-manager.md)）

## 決定

### 1. member の label

- member の frontmatter に、issue / routine と同じ `label`（名前のリスト）を足す。任意の項目で、作るときは書かない（[ADR-0023](0023-template-id-and-daily.md) の「任意の項目は書かない」と同じ。テンプレートも変えない）
- label の定義は issue / routine と共用する（`issue/labels.json`）。member 専用の label の一覧は作らない
- member の画面のヘッダーに、routine と同じ label の欄（`LabelsField`）を置き、そこから付け外しする。定義にない名前を入れたときの動きも issue / routine と同じ（その場で定義に足す）
- lint と vault-task は、member の `label` を issue / routine と同じ規則で読む（定義にない label は `unknown-label` の警告）

### 2. Labels 画面（ADR-0024）

- 使っている数に member も数える（「N 件の issue / routine / member で使用中」）。member で使われている label も削除できない
- 改名すると、その label が付いた member の `label` も書き換える

### 3. Members の一覧

- 行に label のバッジを出す
- 絞り込み: 検索欄（ADR-0035 のまま）に加えて、label のチップを置く。選んだ label をすべて持つ member だけを出す（Issues の一覧と同じ AND）。label が 1 つも定義されていなければチップの行を出さない
- 並べ替え: ID、nickname、name、alias、委任中の数、created から選び、昇順・降順を切り替える。既定は ID の昇順。文字の項目は `localeCompare("ja")` で比べる（かなは五十音の順になるが、漢字は読みの順にならない）。値が同じなら ID の順。値のないもの（created がない）は並び順にかかわらず後ろ
- 絞り込みと並べ替えの状態は、View を開いているあいだだけ持つ（保存しない。Issues の「保存した条件」のような仕組みは足さない）

## 理由

- label を共用すると、同じ「仕事」「経理」などの名前で、タスクと人を同じ切り口で見られる。定義と色の管理（Labels 画面）も 1 か所のまま
- 絞り込みと並べ替えを Issues の一覧と同じ規則（AND、値なしは後ろ、昇順・降順の切り替え）にすると、操作を覚え直さなくてよい

## 却下した案

- **member 専用の label（`member/labels.json` など）**: 定義と画面が 2 つになり、同じ名前が別の色を持てるようになる
- **絞り込みを OR にする**: Issues の一覧と規則が変わる
- **絞り込みと並べ替えを設定に保存する**: member の数は issue より少なく、開くたびに既定（ID 順）でも困らない。必要になったら足す

## 影響

- `Member` 型に `labels` を足し、`parseMember`、`labelUsage`、`TaskWriter.saveLabels`、lint、member のヘッダー、Members の一覧を変える
- 子の Vault に移行は要らない（任意の項目を足すだけ。既存の member は label なしとして読む）
- `.claude/docs/vault-conventions.md` の member の行に `label` を書き足す。`.kit/CHANGELOG.md` に書く
- ビルド成果物（vault-task の `main.js` と `styles.css`、`.kit/bin/`）をコミットする
