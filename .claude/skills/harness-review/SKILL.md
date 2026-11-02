---
name: harness-review
description: 子の Vault のハーネスと LLM wiki の使い方を、利用実態をもとに評価し、この Vault で直すものは Issue に、上流（pkm-kit）を変えないと直らないものはエスカレーションに振り分ける手順。月 1 回行う。SessionStart フックが期限切れと出したとき、エージェントの間違いが続いたとき、ユーザーが見直しを頼んだときに使う。上流そのものの評価は上流の kit-review で行う。
---

# この Vault のハーネスと wiki の使い方を評価する

出力は改善案まで（Issue とエスカレーション）。変更は、その Issue から通常の工程（[進め方](../../docs/workflow.md)）で行う。上流のものは変えない（[ADR-0011](../../../.kit/harness/docs/adr/0011-harness-parent-and-child.md)）。

## いつ行うか

- 月 1 回（前回は `.claude/reviews/last-review.json`。SessionStart フックが期限を知らせる）
- 期限切れのときは、ユーザーの依頼に取りかかる前に一言伝えて実施を提案する。「後で」と言われたら依頼を優先し、セッションの終わりにもう一度提案する
- 時間がなければ、一部の手順だけでもよい。その場合はレポートに、行った手順を書く

## 1. 現在の設計を読む

- [ハーネスの設計](../../docs/harness.md)（上流と子の分け方、改善のサイクル）
- [LLM wiki の仕組み](../../docs/llm-wiki.md)
- この Vault の `.claude/local/CLAUDE.md`（あれば）

## 2. 利用実態を集める

前回の評価のコミットを `last-review.json` の `commit` から取る（初回は全期間）。

```sh
node .claude/scripts/usage-report.mjs --since <前回の date>
git log --oneline <前回の commit>..HEAD
git diff <前回の commit> HEAD -- wiki/feedback.md
```

- `.claude/notes/` のファイルをすべて読む（「直す先」も見る）
- `wiki/log.md` の前回からの記録を読む（特に、query で答えられなかったもの、lint で繰り返し出た問題）
- `wiki/feedback.md` の前回からの追記を読む
- 前回のレポート（`.claude/reviews/`）の改善案がどうなったか（Issue の状態）
- 送ったエスカレーション（`.kit-local/escalations.json`）がどうなったか。`issue` なら上流の Issue の状態とコメント

## 3. 評価する

根拠を付けて「うまくいっていること」「うまくいっていないこと」を書く。

| 観点 | 見るもの |
|---|---|
| LLM wiki | 操作の回数と種類、ページの増え方、参照されない・更新されないページ、答えられなかった問い、フィードバック、未処理のデイリーノート |
| タスク管理 | task-coach・worklog-review の使われ方、繰り返し出た訂正 |
| ハーネス | 繰り返し出た気づき、使われていないスキルや文書、文書と実際の食い違い |

同じ内容の気づきが複数あるものを優先する。

## 4. 振り分ける

改善案ごとに、根拠（どの観測か）と、直す先を決める（[harness-note](../harness-note/SKILL.md) の「直す先」と同じ基準）。

| 直す先 | 出力 |
|---|---|
| 子 | この Vault の Issue（ラベル `harness` か `wiki`）。変えるもの、検査で強制できるか、大きさを書く |
| 上流 | [escalate](../escalate/SKILL.md) の下書き。個人の内容を含めない |
| 見送り | 理由をレポートに書く |

一覧をユーザーに見せ、起票・送付するものを確認してから行う。ここでは実装しない。

上流で閉じたエスカレーションのうち、取り込み済み（`.kit-local/upstream.json` のコミットに含まれる）のものは、効いているかを確かめてレポートに書く。

## 5. 記録する

ブランチを切って、次を 1 つのコミットにまとめ（`harness(review): YYYY-MM 評価`）、PR にする。

- レポート `.claude/reviews/YYYY-MM-DD.md`: 期間、行った手順、観測の要約、評価、改善案（直す先、Issue の番号、エスカレーションの番号かファイル名）
- `.claude/reviews/last-review.json`

  ```json
  { "date": "YYYY-MM-DD", "commit": "<短縮 commit>", "report": "YYYY-MM-DD.md", "issues": [12, 13], "escalations": ["yamayu-i/pkm-kit#5"] }
  ```

- 処理した `.claude/notes/` のファイルを消す（Issue にしたもの、エスカレーションしたもの、見送ると決めたもの）。判断を保留したものは残す
