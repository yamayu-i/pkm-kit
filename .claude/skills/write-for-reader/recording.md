# 記録

段階ごとに、次の 3 つを記録する。段階の分け方と規則を後で直すときの判断材料にする（[ADR-0013](../../../.kit/harness/docs/adr/0013-output-by-reader-and-stage.md)）。

1. **使われた回数**: 段階ごと、読み手ごと、既定からの上げ下げ
2. **かかった時間と、出力したモデルの名前**
3. **出力に問題があった会話の短い記録**: ユーザーに長い・足りないなどと言われたこと

記録には `.claude/scripts/output-log.mjs` を使う。置き場所は、子の Vault では `.claude/output-log/`、上流では `.kit/harness/output-log/`。1 出力 1 ファイル（`YYYY-MM/<id>.jsonl`）に追記する。

## いつ記録するか

| 時点 | コマンド |
|---|---|
| 段階を決めた直後（棚卸しの前） | `start` |
| 出力をユーザーに渡した、またはファイルに書いた時点 | `end` |
| 出力に問題があった会話の直後 | `issue` |

時間は `start` から `end` までで測る。棚卸し・書く・確かめるの全部を含む。

## コマンド

```sh
# 始める（id が出力される。end と issue で使う）
node .claude/scripts/output-log.mjs start --reader human --stage 2 --kind "wiki-query の回答" --skill wiki-query --format chat

# 既定から上げ下げしたとき
node .claude/scripts/output-log.mjs start --reader human --stage 4 --default 3 --reason "ユーザーが全部と言った" --kind "評価のレポート" --skill kit-review --format md

# 段階を混ぜるとき（主な段階を先に）。両方が読むものは、人が読む層の段階
node .claude/scripts/output-log.mjs start --reader both --stage 3,4 --kind "PR の本文" --skill dev-pr --format github

# LLM だけが読むもの（段階を付けない）
node .claude/scripts/output-log.mjs start --reader llm --kind "サブエージェントへの依頼" --format chat

# 終える
node .claude/scripts/output-log.mjs end --id <id> --model <モデル名>

# 問題を記録する（--id を省くと、最後に始めた出力）
node .claude/scripts/output-log.mjs issue --id <id> --type missing --summary "比較の観点（費用）が抜けていると指摘された"

# 集計する（評価で使う）
node .claude/scripts/output-log.mjs summary --since 2026-11-01
```

- `--kind`: 出力の種類を、評価で数えられる粒度で書く（「wiki-query の回答」「ADR」「点検の結果」）。毎回の題名は書かない
- `--format`: `chat`、`md`、`html`、`github` など。[形式への渡し方](formats.md)の表の形式
- `--id last`: 最後に始めた出力（`end` では、終わっていないもののうち最後）。並行して複数の出力を書くときは id を書く

## モデルの名前

出力したモデルの識別子を `--model` に書く。

- システムプロンプトに書かれたモデルの識別子を使う
- クラウドのセッションで、実際に応答したモデルが別でありうるときは、`get_session` の `external_metadata.last_served_model` を使う
- 分からなければ `unknown` と書く。推測で書かない

## 問題の種類

ユーザーの言葉の例と、記録する `--type`。

| `--type` | 起きたこと | ユーザーの言葉の例 |
|---|---|---|
| `long` | 長すぎた、読めなかった | 「長い」「短くして」「もっと簡潔に」 |
| `missing` | 要る観点・件が抜けていた | 「〜は？」「〜が入っていない」「全部出して」 |
| `unclear` | 要点や結論が分からなかった | 「で、結論は？」「何をすればいい？」 |
| `stage` | 段階そのものが合っていなかった | 「そこまで要らない」「判断材料がほしかった」 |
| `format` | 形式・表示の問題（形式の規約との食い違いを含む） | 「表が崩れている」「リンクが開けない」 |
| `wrong` | 内容の誤り | 「違う」「それは古い」 |
| `other` | 上のどれでもない | — |

- `--summary` は 200 字以内で、事実を書く（何を出して、何を言われたか）。ユーザーの言葉は要点だけを引く
- 個人のノートの内容、秘密情報を書かない。上流は公開リポジトリで、子の記録も評価で上流に伝えることがある
- 1 つの会話で複数の問題があれば、問題ごとに 1 回ずつ記録する
- 出力の長さ・網羅・要点についての訂正はここに記録し、harness-note・kit-note には書かなくてよい。スキルの手順そのものの問題（スキルが段階を書いていない、など）は、harness-note・kit-note に書く

## コミット

- 記録は、その作業のコミットに含める
- 子の Vault: 作業がコミットを伴わないとき（会話だけのとき）は、気づきの記録と同じ扱いで main にコミットしてよい（`harness(note): 出力の記録`）
- 上流: 作業のブランチの PR に含める。クラウドのセッションでは、終える前にコミットして push する（コンテナが消えると記録も消える）

## 評価で使う

- 子: [harness-review](../harness-review/SKILL.md) が `usage-report.mjs` で集計を読む（集計は `output-log.mjs summary` と同じ）。段階の分け方や規則の問題は、直す先を `上流` にして [escalate](../escalate/SKILL.md) で伝える。そのときは集計の数と問題の種類だけを書き、`--summary` の文を書き写さない
- 上流: [kit-review](../../../.kit/harness/skills/kit-review/SKILL.md) が `summary` を読み、子からのエスカレーションと合わせて段階の規則を見直す

見るもの（例）:

| 観測 | 疑うこと |
|---|---|
| ある段階で `long` が多い | 長さの目安、または段階 3・4 に寄りすぎている |
| ある段階で `missing` が多い | 判断のロジックの選ぶ基準、棚卸しの集める先 |
| `stage` が多い、既定からの上げ下げが同じ向きに多い | スキルの既定の段階 |
| 時間の中央値が段階に比べて長い | 確かめ方の手間（サブエージェントの使い方） |
| モデルによって問題の数・時間が違う | 指示の書き方がモデルに依存している |
| 未完了が多い | `end` の記録し忘れ（手順の見直し） |
