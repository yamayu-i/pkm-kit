---
name: harness-review
description: ハーネス（文書、スキル、検査、設定）と LLM wiki の仕組みを、利用実態と調査をもとに評価し、改善案を Issue として起票する手順。月 1 回行う。SessionStart フックが期限切れと出したとき、エージェントの間違いが続いたとき、Claude Code や Obsidian に大きな更新があったとき、ユーザーが見直しを頼んだときに使う。
---

# ハーネスと wiki の仕組みを評価する

出力は改善案（レポートと Issue）まで。変更は、その Issue から通常の工程（[進め方](../../docs/workflow.md)）で行う（[ADR-0006](../../docs/adr/0006-self-improvement-loop.md)）。

## いつ行うか

- 月 1 回（前回は `.claude/reviews/last-review.json`。SessionStart フックが期限を知らせる）
- 期限切れのときは、ユーザーの依頼に取りかかる前に一言伝えて実施を提案する。「後で」と言われたら依頼を優先し、セッションの終わりにもう一度提案する
- 時間がなければ、一部の手順だけでもよい。その場合はレポートに、行った手順を書く

## 1. 現在の設計を読む

- [ハーネスの設計](../../docs/harness.md)（前提、現在地、未決事項）
- [ADR](../../docs/adr/README.md) と [LLM wiki の仕組み](../../docs/llm-wiki.md)

## 2. 利用実態を集める

前回の評価のコミットを `last-review.json` の `commit` から取る（初回は全期間）。

```sh
node .claude/scripts/usage-report.mjs --since <前回の date>
git log --oneline <前回の commit>..HEAD
git diff <前回の commit> HEAD -- wiki/feedback.md
```

- `.claude/notes/` のファイルをすべて読む
- `wiki/log.md` の前回からの記録を読む（特に、query で答えられなかったもの、lint で繰り返し出た問題）
- `wiki/feedback.md` の前回からの追記を読む
- 前回のレポート（`.claude/reviews/`）の改善案がどうなったか（Issue の状態）

## 3. 調べる

- Claude Code の更新（スキル、フック、設定、クラウドのセッション）で、今のハーネスに効くもの
- Obsidian の API の更新で、プラグインに影響するもの
- LLM wiki の運用例で、取り入れられそうな工夫

調べた情報源はレポートに書く。

## 4. 評価する

3 つの目的ごとに、根拠を付けて「うまくいっていること」「うまくいっていないこと」を書く。

| 目的 | 見るもの |
|---|---|
| プラグイン | 開発のコミットと PR の流れ、検査で止まった問題、気づきの記録 |
| LLM wiki | 操作の回数と種類、ページの増え方、参照されない・更新されないページ、答えられなかった問い、フィードバック、未処理のデイリーノート |
| ハーネス | 繰り返し出た気づき、使われていないスキルや文書、文書と実際の食い違い、CLAUDE.md の大きさ |

同じ内容の気づきが複数あるものを優先する。

## 5. 改善案を出す

改善案ごとに、根拠（どの観測か）、変えるもの、検査で強制できるか、大きさを書く。規約を足す前に、検査にできないかを考える。

一覧をユーザーに見せ、起票するものを確認してから Issue にする（`gh issue create` か GitHub の MCP ツール。ラベル `harness` か `wiki`）。ここでは実装しない。

## 6. 記録する

ブランチを切って、次を 1 つのコミットにまとめ（`harness(review): YYYY-MM 評価`）、PR にする。

- レポート `.claude/reviews/YYYY-MM-DD.md`: 期間、行った手順、観測の要約、評価、改善案と Issue の番号、調べた情報源
- `.claude/reviews/last-review.json`

  ```json
  { "date": "YYYY-MM-DD", "commit": "<短縮 commit>", "report": "YYYY-MM-DD.md", "issues": [12, 13] }
  ```

- [ハーネスの設計](../../docs/harness.md) の「評価の記録」の表に 1 行足す。「現在地」と「未決事項」が変わっていたら直す
- 処理した `.claude/notes/` のファイルを消す（Issue にしたもの、見送ると決めたもの）。判断を保留したものは残す
