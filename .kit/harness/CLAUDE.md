# pkm-kit（上流）のハーネス

上流のリポジトリ [pkm-kit](https://github.com/yamayu-i/pkm-kit) を開発するときの目次。各 Vault（子）は上流を merge で取り込む（[ADR-0009](docs/adr/0009-upstream-and-child-vaults.md)）。
子の Vault でも merge で届くが、子では使わない。子で上流を直したくなったら、子の escalate で伝える。全体像は [上流のハーネスの設計](docs/harness.md)。

## 目的

1. Obsidian 上で動くプラグインを作る・改善する
2. LLM wiki の仕組みを、子の利用実態とエスカレーションを踏まえて改善する
3. 子向けのハーネス（`.claude/`）と、この上流のハーネス自体を改善する
4. 子が更新を取り込めるようにする（移行。[ADR-0010](docs/adr/0010-upstream-updates-and-migrations.md)）

## 構成

- `.kit/src/` : プラグインのソース（pnpm workspace）と、プラグインの ADR（`docs/adr/`）。UI のデザインルールは `docs/design.md`（UI を作る・変えるときは従う）。デザインの値の正本は `packages/design/tokens.json`
- `.obsidian/plugins/<id>/`、`.obsidian/snippets/vault-theme.css`、`.kit/bin/` : ビルド成果物（モバイルではビルドできないのでコミットする）
- `.kit/templates/` : テンプレートの既定。`.kit/setup.mjs`・`.kit/kit.json`・`.kit/lib/` : 子のセットアップ
- `.kit/owned-paths.json` : 上流が持つパス。`.kit/obsidian-required.json` : 子の Obsidian の設定に必要なキー
- `.claude/` : 子向けのハーネス（子の Vault で使う）。`.kit/harness/` : この上流のハーネス
- `.github/workflows/` : CI（上流でも子でも動く）

## 絶対に守るルール

1. 作業はすべてブランチで行い PR にする（上流に main への直接のコミットはない）
2. force push をしない。PR をマージしない。検査を迂回しない（`--no-verify`、フックを無効にする指定、テストの削除・スキップ）
3. **上流は公開リポジトリ**。個人のノートの内容、端末名、秘密情報を、ソース・テスト・資料・文書・コミットに入れない
4. 設計判断を含む変更は、実装の前に ADR を書いて合意する。ADR と移行の番号は Issue の番号（[ADR-0056](docs/adr/0056-conflict-free-numbering.md)）
5. 子のもの（ノート、`template/`、`.obsidian/*.json` など）に手を入れる必要が出る変更には、移行を付ける（[移行の書き方](docs/migrations.md)）。子から見える変更は `.kit/changes/` に 1 変更 1 ファイルで書く
6. 秘密情報はプラグインでは Obsidian の SecretStorage に置く
7. 依存はバージョン固定（`^` / `~` を使わない）。追加する前に必要性をユーザーに説明する
8. ソースを変えたら必ず `pnpm build` して、成果物（`.obsidian/plugins/`、スニペット、`.kit/bin/`）も一緒にコミットする
9. 上流のファイルは、すべて `.kit/owned-paths.json` に当たる場所に置く（`check-kit-paths.mjs` が検査する）
10. 訂正された、文書にないことを質問した、などが起きたら、その場で記録する（[kit-note](skills/kit-note/SKILL.md)）。メモリだけに保存しない

## 作業の流れ

作業の種類ごとの工程とコミットの形式は [進め方](docs/workflow.md)。ここのスキルは Claude Code のスキルとしては読み込まれないので、リンク先の手順を読んで従う。

| 作業 | 手順 |
|---|---|
| 計画を立てて承認を得る（大きい変更は ADR と Issue、小さい変更はチャット） | [dev-plan](skills/dev-plan/SKILL.md) |
| テストを先に書いて実装し、検査を通す | [dev-implement](skills/dev-implement/SKILL.md) |
| 自分でレビューして PR を出す | [dev-pr](skills/dev-pr/SKILL.md) |
| 中断と再開 | [dev-handoff](skills/dev-handoff/SKILL.md) |
| 上流の開発中の気づきを記録する | [kit-note](skills/kit-note/SKILL.md) |
| 使う人の体験の困りごと（機会）を自分で見つけて起票する（月 1 回） | [product-review](skills/product-review/SKILL.md) |
| 上流の仕組みを、子からのエスカレーションと利用実態で評価する（月 1 回） | [kit-review](skills/kit-review/SKILL.md) |
| セキュリティチェック（週 1 回） | [security-check](skills/security-check/SKILL.md) |

## 文書の地図

| 知りたいこと | 読む文書 |
|---|---|
| 上流のハーネスの全体像、現在地、未決事項 | [上流のハーネスの設計](docs/harness.md) |
| 作業の進め方、git、コミットの形式 | [進め方](docs/workflow.md) |
| ハーネスと wiki の設計判断 | [ADR](docs/adr/README.md) |
| 誰のどんな場面のために作るか、今の体験、用語（機能を変える前に読む） | [プロダクト](docs/product/README.md) |
| プラグインの設計と開発 | [プラグインの設計と開発](docs/plugin-development.md) |
| セキュリティチェックの頻度と実施ルール | [実施ルール](docs/security-check-schedule.md) |
| 子のものに手を入れる変更に付ける移行の書き方 | [移行の書き方](docs/migrations.md) |
| 子向けのハーネス（子で使う手順と規約） | [子向けの目次](../../.claude/CLAUDE.md) |

## コマンド

```sh
mise install                          # Node / pnpm
node .claude/scripts/verify.mjs       # ハーネスの検査（--plugin でプラグインの pnpm check も）
cd .kit/src
pnpm install --frozen-lockfile
pnpm check                            # 型チェック → ビルド → テスト
pnpm security:scan                    # セキュリティチェックの機械的な部分
pnpm --filter vault-task preview:ui   # UI のスクリーンショットと、描画した画面の検査
```

## このファイルを変えるとき

- 100 行以内に保つ（`check-docs.mjs` が検査する）。詳細は `docs/` に書き、ここにはリンクだけを置く
