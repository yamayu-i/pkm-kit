# 進め方（上流）

上流 pkm-kit での作業の種類ごとの工程と、git の運用。決定の理由は [ADR-0002](adr/0002-workflow-by-size.md)。子の Vault での工程は [子の進め方](../../../.claude/docs/workflow.md)。

## 作業の種類と工程

| 作業 | 例 | 工程 |
|---|---|---|
| 大きい変更 | 新しいプラグイン・機能、設計の変更、ハーネスや wiki の仕組みの変更、依存の追加、子のものに手を入れる変更 | [ADR](adr/README.md)（設計判断を含むなら）→ [計画](../skills/dev-plan/SKILL.md)を Issue に書いて承認 → [実装](../skills/dev-implement/SKILL.md) → [PR](../skills/dev-pr/SKILL.md) |
| 小さい変更 | 不具合の修正、文言、設計を変えないリファクタリング | [計画](../skills/dev-plan/SKILL.md)をチャットで伝えて確認 → [実装](../skills/dev-implement/SKILL.md) → [PR](../skills/dev-pr/SKILL.md) |
| 子からのエスカレーションへの対応 | Issue のラベル `escalation` | [kit-review](../skills/kit-review/SKILL.md) で振り分け、受け入れたものを上の工程で直す |
| セキュリティチェック | 週 1 回 | [セキュリティチェックの頻度と実施ルール](security-check-schedule.md) |
| 上流の評価 | 月 1 回 | [kit-review](../skills/kit-review/SKILL.md) |

- どちらか迷ったら大きい変更として扱う
- ADR は計画より先に書き、合意してから計画に進む。プラグインの ADR は `.kit/src/docs/adr/`、ハーネスと wiki の ADR は [adr/](adr/README.md)
- 子のもの（ノート、`template/`、`.obsidian/*.json` など）に手を入れる必要が出る変更には、移行を付ける（[ADR-0010](adr/0010-upstream-updates-and-migrations.md)）
- 途中で止めるときは [中断と再開](../skills/dev-handoff/SKILL.md)
- 作業中に訂正された・文書にないことを質問した・文書と実際が違った、などが起きたら、その場で [気づきを記録する](../skills/kit-note/SKILL.md)

## 止めて人に伝える場面

- 規約や ADR にないことを決める必要がある
- 計画にない変更が必要になった
- 検査を通せず、原因が分からない（同じ失敗を 3 回直しても通らない）
- 検査やテストの側が誤っていると思う
- 公開してよいか迷う内容（個人の情報に見えるもの）がある

## git の運用

### ブランチ

- 作業はすべて main から切ったブランチで行い、PR にする。main に直接コミットしない
- ブランチ名: Issue があれば `<Issue番号>-<英語の短い名前>`、なければ `<英語の短い名前>`。クラウドのセッションで指定されたブランチがあれば、それを使う
- force push をしない。PR をマージしない（マージはユーザーが行う）
- 新しく clone したら、最初に `git config core.hooksPath .githooks` を実行する。コミットにフックを無効にする指定を付けない

### updated の自動付与

コミットする変更ノートの `updated` は、コミット時に自動で付く（[ADR-0028](../../src/docs/adr/0028-auto-updated.md)）。上流にノートはほとんどないが、テンプレートや資料を変えたときも同じフックが動く。

### コミットの形式

```
<type>(<scope>): <日本語の要約>

<本文。なぜ変えたか>
```

| type | 使う場面 |
|---|---|
| `feat` / `fix` / `refactor` / `test` / `perf` | プラグイン・セットアップ・CLI のコード |
| `docs` | 文書（ADR、規約、README） |
| `harness` | スキル、検査、フック、設定（子向けも上流も） |
| `ci` | `.github/workflows/` |
| `build` / `deps` | ビルド設定、依存 |
| `security` | セキュリティチェックの記録 |
| `wip` | 中断するときの途中のコミット |

- scope はプラグイン名（`vault-git`、`vault-task`）、`kit`、`harness` など
- マージコミットは、この形式の対象外

### PR

- タイトルはコミットと同じ形式
- 本文: 概要（何を、なぜ。Issue があれば `Closes #N`）、検証（実行した検査と結果）、子への影響（移行の有無、モバイルで確かめること）、気づき（記録した件数）
- PR を出したら、URL と検証の結果をユーザーに伝える
