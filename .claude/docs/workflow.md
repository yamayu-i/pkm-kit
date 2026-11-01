# 進め方

作業の種類ごとの工程と、git の運用。決定の理由は [ADR-0002](adr/0002-workflow-by-size.md)。

## 作業の種類と工程

| 作業 | 例 | 工程 |
|---|---|---|
| 大きい変更 | 新しいプラグイン・機能、設計の変更、ハーネスや wiki の仕組みの変更、依存の追加 | [ADR](adr/README.md)（設計判断を含むなら）→ [計画](../skills/dev-plan/SKILL.md)を Issue に書いて承認 → [実装](../skills/dev-implement/SKILL.md) → [PR](../skills/dev-pr/SKILL.md) |
| 小さい変更 | 不具合の修正、文言、設計を変えないリファクタリング | [計画](../skills/dev-plan/SKILL.md)をチャットで伝えて確認 → [実装](../skills/dev-implement/SKILL.md) → [PR](../skills/dev-pr/SKILL.md) |
| wiki の操作 | 取り込み、回答の蓄積、lint、デイリーノートの整理 | 各スキル（[LLM wiki の仕組み](llm-wiki.md)）に従って main に直接コミット |
| セキュリティチェック | 週 1 回 | [セキュリティチェックの頻度と実施ルール](security-check-schedule.md) |
| ハーネスの評価 | 月 1 回 | [harness-review](../skills/harness-review/SKILL.md) |

- どちらか迷ったら大きい変更として扱う
- ADR は計画より先に書き、合意してから計画に進む。プラグインの ADR は `.plugin-src/docs/adr/`、ハーネスと wiki の ADR は [adr/](adr/README.md)
- 途中で止めるときは [中断と再開](../skills/dev-handoff/SKILL.md)
- 作業中に訂正された・文書にないことを質問した・文書と実際が違った、などが起きたら、その場で [気づきを記録する](../skills/harness-note/SKILL.md)

## 止めて人に伝える場面

- 規約や ADR にないことを決める必要がある
- 計画にない変更が必要になった
- 検査を通せず、原因が分からない（同じ失敗を 3 回直しても通らない）
- 検査やテストの側が誤っていると思う
- 人のノートの既存の内容を変える必要がありそう

## git の運用

### ブランチ

- 開発の作業（大きい・小さい変更）は main から切ったブランチで行い、PR にする。main に直接コミットしない
- ブランチ名: Issue があれば `<Issue番号>-<英語の短い名前>`、なければ `<英語の短い名前>`。クラウドのセッションで指定されたブランチがあれば、それを使う
- force push をしない。PR をマージしない（マージはユーザーが行う）
- wiki の操作は main に直接コミットして push する。push の前に `git pull --rebase origin main` で端末の snapshot を取り込む。人のノートで衝突したら、止めてユーザーに伝える
- 例外として、気づきの記録（`.claude/notes/` だけの変更）は main に直接コミットしてよい（`harness(note): …`）。wiki の操作のコミットには含めない

### updated の自動付与

コミットする変更ノートの `updated` は、コミット時に自動で付く（[ADR-0028](../../.plugin-src/docs/adr/0028-auto-updated.md)）。PC の Git CLI では、リポジトリごとに 1 回 `git config core.hooksPath .githooks` を実行して pre-commit フックを有効にする（worktree 間で共有される）。手で書かない。コミット済みの `sources/` を変えようとするとフックが止める。

### コミットの形式

```
<type>(<scope>): <日本語の要約>

<本文。なぜ変えたか>
```

| type | 使う場面 |
|---|---|
| `feat` / `fix` / `refactor` / `test` / `perf` | プラグインのコード |
| `docs` | 文書（ADR、規約、README） |
| `harness` | スキル、検査、フック、設定 |
| `ci` | `.github/workflows/` |
| `build` / `deps` | ビルド設定、依存 |
| `security` | セキュリティチェックの記録 |
| `wiki` | wiki の操作。scope は `ingest` / `query` / `lint` / `daily`。CI が追記だけかを検査する |
| `wip` | 中断するときの途中のコミット |

- scope はプラグイン名（`vault-git`、`vault-task`）、`harness`、`vault` など
- Vault Git の自動コミット（`vault: snapshot (端末)`）とマージコミットは、この形式の対象外

### PR

- タイトルはコミットと同じ形式
- 本文: 概要（何を、なぜ。Issue があれば `Closes #N`）、検証（実行した検査と結果）、気づき（記録した件数）
- PR を出したら、URL と検証の結果をユーザーに伝える
