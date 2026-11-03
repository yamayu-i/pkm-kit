# 進め方（子の Vault）

この Vault での作業の種類ごとの工程と、git の運用。上流（pkm-kit）を開発するときの工程は [上流の進め方](../../.kit/harness/docs/workflow.md)。

## 作業の種類と工程

| 作業 | 例 | 工程 |
|---|---|---|
| wiki の操作 | 取り込み、回答の蓄積、lint、デイリーノートの整理 | 各スキル（[LLM wiki の仕組み](llm-wiki.md)）に従って main に直接コミット |
| タスク管理 | 計画・振り返り、ボードの操作、worklog の修正 | [task-coach](../skills/task-coach/SKILL.md)・[worklog-review](../skills/worklog-review/SKILL.md)。データは MCP ツールか CLI を通して書く |
| この Vault のものの仕組みを変える | `template/` のテンプレート、`local/CLAUDE.md`、`skills/local-*`、`.obsidian/*.json` | 何をどう変えるかをチャットで伝えて確認 → ブランチで変えて `verify.mjs` を通す → PR |
| 上流の更新の取り込み | 新しい機能、上流の修正 | [vault-upgrade](../skills/vault-upgrade/SKILL.md)（ブランチで merge と移行 → 検査 → PR） |
| 上流を変えないと直らないこと | 上流のスキルの誤り、プラグインの不具合、上書きの手段がない | 上流のものは変えずに [escalate](../skills/escalate/SKILL.md) |
| 評価 | 月 1 回 | [harness-review](../skills/harness-review/SKILL.md) |

- 作業中に訂正された・文書にないことを質問した・文書と実際が違った、などが起きたら、その場で [気づきを記録する](../skills/harness-note/SKILL.md)
- 上流のものを変えたくなったら、変えずに escalate する。急ぎで回避が要るなら、子のもの（`local-*` など）で回避し、回避したこともエスカレーションに書く

## 止めて人に伝える場面

- 規約にないことを決める必要がある
- 検査を通せず、原因が分からない（同じ失敗を 3 回直しても通らない）
- 検査やテストの側が誤っていると思う
- 人のノートの既存の内容を変える必要がありそう

## git の運用

### ブランチ

- wiki の操作と気づきの記録（`.claude/notes/` だけの変更）は main に直接コミットして push する。push の前に `git pull --rebase origin main` で端末の snapshot を取り込む。人のノートで衝突したら、止めてユーザーに伝える
- それ以外は main から切ったブランチで行い、PR にする。ブランチ名は `<英語の短い名前>`。クラウドのセッションで指定されたブランチがあれば、それを使う
- force push をしない。PR をマージしない（マージはユーザーが行う）

### updated の自動付与

コミットする変更ノートの `updated` は、コミット時に自動で付く（[ADR-0028](../../.kit/src/docs/adr/0028-auto-updated.md)）。PC の Git CLI では、リポジトリごとに 1 回 `git config core.hooksPath .githooks` を実行する（`node .kit/setup.mjs` も行う）。手で書かない。フックを無効にする指定を付けない。コミット済みの `sources/` を変えようとするとフックが止める。

### コミットの形式

```
<type>(<scope>): <日本語の要約>

<本文。なぜ変えたか>
```

| type | 使う場面 |
|---|---|
| `wiki` | wiki の操作。scope は `ingest` / `query` / `lint` / `daily`。CI が追記だけかを検査する |
| `harness` | この Vault のハーネス（`local/`、`skills/local-*`）。気づきの記録は `harness(note): …` |
| `docs` | この Vault の文書 |
| `vault` | テンプレート・設定など、この Vault のそのほかのもの |
| `wip` | 中断するときの途中のコミット |

- Vault Git の自動コミット（`vault: snapshot (端末)`）とマージコミットは、この形式の対象外

### PR

- タイトルはコミットと同じ形式
- 本文: 概要（何を、なぜ）、検証（実行した検査と結果）、気づき（記録した件数）
- PR を出したら、URL と検証の結果をユーザーに伝える
