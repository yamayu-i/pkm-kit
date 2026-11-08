# ADR（ハーネスと LLM wiki）

ハーネス（進め方・スキル・検査）と LLM wiki の仕組みについて、決めたことと理由を残す。
プラグインの設計判断は別の場所にある: `.kit/src/docs/adr/`（番号はディレクトリごとに振るので、参照するときはパスで書く）。

- 1 決定 = 1 ファイル。`NNNN-短い名前.md`
- 状態: `提案`（未確定）→ `承認` → 必要なら `廃止` / `置換（ADR-NNNN）`
- 承認済みの ADR は書き換えない。決定を変えるときは新しい ADR を作り、古い方の状態を `置換` にする
- 書式は [template.md](template.md)

## ADR を書く条件

次のどれかに当たる変更は、実装の前に ADR を書いて合意する（[進め方](../workflow.md)）。

- 工程・人間の確認地点・検査を変える
- wiki の構成（フォルダ、ページの種類、frontmatter、所有の区分）を変える
- 新しいスキルやスクリプトの置き場所、言語、依存を決める
- 一度決めたことを覆す

## 一覧

| ADR | 状態 | 内容 |
|---|---|---|
| [0001](0001-harness-scope.md) | 承認（一部置換: 0009） | ハーネスは Claude Code 専用。正本は `.claude/` に置く |
| [0002](0002-workflow-by-size.md) | 承認 | 工程は変更の大きさで分ける。wiki の操作は main に直接コミットする |
| [0003](0003-wiki-layout.md) | 承認 | wiki は `sources/`・`wiki/` に分ける。`daily/` はその場で元資料として扱う |
| [0004](0004-human-notes-append-only.md) | 置換（0007） | 人のノートに LLM は追記だけ。CI で検査する |
| [0005](0005-checks-in-ci.md) | 承認 | 検査は依存なしの Node スクリプトにし、GitHub Actions で実行する |
| [0006](0006-self-improvement-loop.md) | 承認（一部置換: 0011） | 自己改善は 4 つの観測から月 1 回評価し、提案までにする |

| [0007](0007-note-format.md) | 承認（一部置換: 0008） | PKMの共通frontmatter・type別テンプレート・DailyNote本文の保護 |
| [0008](0008-updated-on-create.md) | 承認 | updated は作成時にも入れる（作成時は created と同じ値） |
| [0009](0009-upstream-and-child-vaults.md) | 承認 | 仕組みを上流のリポジトリに分け、各 Vault はその子として更新を取り込む（2 層） |
| [0010](0010-upstream-updates-and-migrations.md) | 承認 | 上流の更新は merge と移行で取り込み、Breaking Change は AI が移行する |
| [0011](0011-harness-parent-and-child.md) | 承認 | ハーネスを親と子に分け、子で見つけた上流の改善はエスカレーションする |
| [0012](0012-product-responsibility.md) | 承認 | ユーザー体験に責任を持つ責務（プロダクト）を置き、機会は Claude が自分で見つける |
