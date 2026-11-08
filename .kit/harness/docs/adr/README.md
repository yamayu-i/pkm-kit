# ADR（ハーネスと LLM wiki）

ハーネス（進め方・スキル・検査）と LLM wiki の仕組みについて、決めたことと理由を残す。
プラグインの設計判断は別の場所にある: `.kit/src/docs/adr/`（0038 までの番号はディレクトリごとに振ったので、参照するときはパスで書く）。

- 1 決定 = 1 ファイル。`NNNN-短い名前.md`
- 番号は、その変更の GitHub Issue の番号（4 桁のゼロ埋め）。ADR を書く前に Issue を作る。1 つの Issue に ADR は 1 つ。2 つのディレクトリで共通なので、並行する PR でも重ならない（[ADR-0056](0056-conflict-free-numbering.md)）
- 状態: `提案`（未確定）→ `承認` → 必要なら `廃止` / `置換（ADR-NNNN）`
- 承認済みの ADR は書き換えない。決定を変えるときは新しい ADR を作り、古い方の状態を `置換` にする（状態の行は書き換えてよい）
- 書式は [template.md](template.md)

## ADR を書く条件

次のどれかに当たる変更は、実装の前に ADR を書いて合意する（[進め方](../workflow.md)）。

- 工程・人間の確認地点・検査を変える
- wiki の構成（フォルダ、ページの種類、frontmatter、所有の区分）を変える
- 新しいスキルやスクリプトの置き場所、言語、依存を決める
- 一度決めたことを覆す

## 一覧

各 ADR の見出しと `- 状態:` の行から `node .claude/scripts/adr-index.mjs --write` で作る。手で書かない（`verify.mjs` が検査する）。

<!-- adr-index:start -->
| ADR | 状態 | 内容 |
|---|---|---|
| [0001](0001-harness-scope.md) | 承認（一部置換: ADR-0009） | ハーネスは Claude Code 専用。正本は `.claude/` に置く |
| [0002](0002-workflow-by-size.md) | 承認（一部置換: ADR-0015） | 工程は変更の大きさで分ける。wiki の操作は main に直接コミットする |
| [0003](0003-wiki-layout.md) | 承認 | wiki は `sources/`・`wiki/` に分ける。`daily/` はその場で元資料として扱う |
| [0004](0004-human-notes-append-only.md) | 置換（[ADR-0007](0007-note-format.md)） | 人のノートに LLM は追記だけ。CI で検査する |
| [0005](0005-checks-in-ci.md) | 承認 | 検査は依存なしの Node スクリプトにし、GitHub Actions で実行する |
| [0006](0006-self-improvement-loop.md) | 承認（一部置換: ADR-0011） | 自己改善は 4 つの観測から月 1 回評価し、提案までにする |
| [0007](0007-note-format.md) | 承認（一部置換: ADR-0008、ADR-0015） | PKMの共通書式とDailyNote本文の保護 |
| [0008](0008-updated-on-create.md) | 承認 | updated は作成時にも入れる |
| [0009](0009-upstream-and-child-vaults.md) | 承認（一部置換: プラグインの ADR-0061） | 仕組みを上流のリポジトリに分け、各 Vault はその子として更新を取り込む |
| [0010](0010-upstream-updates-and-migrations.md) | 承認（一部置換: ADR-0056） | 上流の更新は merge と移行で取り込み、Breaking Change は AI が移行する |
| [0011](0011-harness-parent-and-child.md) | 承認 | ハーネスを親と子に分け、子で見つけた上流の改善はエスカレーションする |
| [0012](0012-product-responsibility.md) | 承認 | ユーザー体験に責任を持つ責務（プロダクト）をハーネスに置く |
| [0013](0013-output-by-reader-and-stage.md) | 承認（5 段階で試行し、記録をもとに見直す） | 出力を、読み手（LLM・人・両方）と、人が読む出力の段階で制御する |
| [0015](0015-english-file-names.md) | 承認 | ノートは日本語のタイトルで作り、あとでファイル名だけを英語のケバブケースに改名する |
| [0056](0056-conflict-free-numbering.md) | 承認 | 並行する PR がぶつからないように、番号は Issue から取り、書き足す共有のファイルをなくす |
| [0092](0092-research-report-types.md) | 提案 | 調査報告の出力を、調査の型ごとに制御する |
<!-- adr-index:end -->
