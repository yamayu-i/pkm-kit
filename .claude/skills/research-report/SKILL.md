---
name: research-report
description: 技術選定・フィジビリティ調査・コードベースの理解・不具合の原因調査・影響範囲・事実の確認・動向の調査・移行・点検・性能やコストの調査・実装への引き継ぎ・概念の理解などの調査報告を書くときに、調査の型を選び、型ごとの結論の形・必須の節・語彙と粒度で、tmp/ に md か html で書く手順。内容の取捨・文体・記録は write-for-reader に従う。ユーザーが「調べて」「調査して」「比較して」「できるか確かめて」「仕組みを教えて」と頼み、結果を報告として渡すときに使う。
---

# 調査報告を型に合わせて書く

調査報告は、調査の種類によって、何を軸に書くか・どの語彙と粒度で書くかが違う。このスキルは**調査の型**を選び、型ごとの書き方を決める（[ADR-0092](../../../.kit/harness/docs/adr/0092-research-report-types.md)）。どこまで書くか（内容の取捨）、文体、確かめ方、記録は [write-for-reader](../write-for-reader/SKILL.md) に従い、ここでは繰り返さない。

## 対象

調査の結果を、報告として渡す出力。会話の中で一言で答えて済む問い（「このファイルはどこ？」）は対象にしない。wiki を根拠にした回答は [wiki-query](../wiki-query/SKILL.md) が受け持つ。

## 流れ

1. **型を選ぶ**: [型の選び方](select-type.md)。推定したときは、報告の冒頭に「型: <型>（段階 N）」を 1 行書く
2. **語彙の層を選ぶ**: [語彙の層](vocabulary.md)（コード・技術・業務）。型の既定から、読み手に合わせて変える
3. **形式を選ぶ**: md か html（[出力先と形式](#出力先と形式)）。依頼になければ、推奨を添えてユーザーに選んでもらう
4. **write-for-reader の 1〜3 を型の既定で埋める**: 読み手と段階は型のファイルの「既定」から取る。記録は `node .claude/scripts/output-log.mjs start … --skill research-report --kind "調査報告: <型の id>" --format md|html`
5. **棚卸し**: write-for-reader の[棚卸し](../write-for-reader/inventory.md)をする。型の「必須の節」を観点の一覧として使い、どの節にも入らない事実も落とさない
6. **型の「書くときの指示」と、段階の規則で書く**: 冒頭は型の「冒頭の結論の形」にする。節は型の「必須の節」の順に並べる
7. **確かめる**: 段階の「確かめ方」に、型の「確かめ方」を足す
8. **`tmp/` に書き、会話で知らせる**: 会話の返答は段階 1（パス、結論の 1〜2 文、期待と違ったこと）。`output-log.mjs end …` を実行する

1 つの調査が複数の型に当たるときは、節ごとに型を混ぜる（[型の選び方](select-type.md#混ぜる)）。

## 型の一覧

| 型の id | 型 | 読んだ後にすること | 既定の段階 | 冒頭の結論の形 |
|---|---|---|---|---|
| [tech-selection](types/tech-selection.md) | 技術選定 | 採用するものを選ぶ | 3 | 推奨 1 つと決め手 |
| [feasibility](types/feasibility.md) | フィジビリティ調査 | やるか・PoC に進むかを決める | 3 | 判定（Go / No-go / 条件付き Go） |
| [codebase-map](types/codebase-map.md) | コードベースの理解 | 読み進める・変更に入る | 5 | 地図（入口・層・データの流れ） |
| [impact-analysis](types/impact-analysis.md) | 変更の影響範囲 | 変更の可否と工数を見積もる | 4 | 範囲・件数・最も重いもの |
| [root-cause](types/root-cause.md) | 不具合の原因調査 | 直し方を選ぶ・直す | 3 | 原因と確度、直し方の推奨 |
| [fact-check](types/fact-check.md) | 事実の確認 | 答えを使って次を考える | 2 | Yes / No / 条件付きの答え |
| [landscape](types/landscape.md) | 動向・先行事例の調査 | 視野を広げる・次の調査先を決める | 2 | 分類と、調べた範囲 |
| [migration](types/migration.md) | 移行・アップグレードの調査 | 移行の計画を承認する | 3 と 4 | 推奨と Breaking Change の件数 |
| [audit](types/audit.md) | 点検（セキュリティ・ライセンス・規約） | 漏れなく確かめ、対応を割り振る | 4 | 範囲・件数・最も重いもの |
| [performance-cost](types/performance-cost.md) | 性能・コストの調査 | 打ち手を選ぶ・予算を決める | 3 | 測った値と、打ち手の推奨 |
| [handoff](types/handoff.md) | 実装への引き継ぎ | そのまま作業に入る（LLM） | LLM | 何を作るか（確定した仕様） |
| [concept](types/concept.md) | 学習・概念の理解 | 理解し、後で引き直す | 5 | 一言の定義 |

## 出力先と形式

- **出力先**: `tmp/` の直下（サブフォルダを作らない）。ファイル名は `YYYY-MM-DD-<型の id>-<題>.md` か `.html`（題は英小文字・数字・ハイフン）。同じ名前があれば `-2` などを付け、上書きしない
- **形式の選び方**: 依頼に形式があればそれにする。なければ、推奨を先頭に置いて md か html かをユーザーに質問する（型・語彙の層の推定と同じ質問にまとめてよい）。`handoff` は md に決め、質問しない

| 推奨 | 目安 |
|---|---|
| md | 後で wiki・Issue・PR に転記する。LLM がまた読む。段階 1〜2 で短い。テキストの差分で見比べたい |
| html | 比較の表・図・件の一覧が主で、人が画面で読む。ほかの人に見せる。重さや判定を色で見分けたい |

- **描き方**: write-for-reader の[形式への渡し方](../write-for-reader/formats.md)に従う。md は [ノートの書式](../../docs/vault-conventions.md) のリンクと図の書き方に従う（`tmp/` は frontmatter の対象外なので、frontmatter は付けない）。html は 1 ファイルに閉じ、デザインルール（`.kit/src/docs/design.md`）の「HTML のページ」に従う（値は `var(--vt-…)`、スクリプトと外部の読み込みを使わない）
- **書いた後**: `node .kit/bin/drawio.mjs check tmp/` を通す。外部に渡すものは `node .kit/bin/drawio.mjs export <元のファイル>` を通す（[ノートの書式](../../docs/vault-conventions.md#編集するとき)）
- **残すとき**: `tmp/` は git で管理せず、端末間で同期しない。残したい報告は [wiki-ingest](../wiki-ingest/SKILL.md) で取り込む。`tmp/` の外のノートから `tmp/` の報告へリンクしない

## ファイル

| ファイル | 内容 |
|---|---|
| [select-type.md](select-type.md) | 型の選び方、混ぜ方、どれにも当たらないとき |
| [vocabulary.md](vocabulary.md) | 語彙の層（コード・技術・業務）と選び方 |
| [types/](types/tech-selection.md) | 型ごとの目的、既定、冒頭の結論の形、必須の節、語彙と粒度、省くもの、書くときの指示、確かめ方、よくある失敗、根拠 |
| [maintaining.md](maintaining.md) | 型を足す・消す・直す手順と、型のファイルのひな形 |
| [evidence.md](evidence.md) | 型の規則の根拠（`R1` などの ID） |

## 出力の段階

型ごとの既定は、上の「型の一覧」と各型のファイルの「既定」にある。会話の返答は、どの型でも人・段階 1。
