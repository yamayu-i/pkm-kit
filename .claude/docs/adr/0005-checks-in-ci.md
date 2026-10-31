# ADR-0005: 検査は依存なしの Node スクリプトにし、GitHub Actions で実行する

- 状態: 承認
- 日付: 2026-10-31

## 背景

テンプレートは、git フック・CI・手順書が同じ検証ゲート（`pnpm verify`）を呼ぶ。このリポジトリでは、コミットの多くがモバイルの Vault Git（isomorphic-git）から来るので、git フックが動かない。

## 決定

- 検査は `.claude/scripts/` の Node スクリプト（`.mjs`）にする。依存パッケージを使わず、ビルドもしない。テストは `node --test`
- まとめて実行する入口は `node .claude/scripts/verify.mjs`（`--plugin` を付けるとプラグインの `pnpm check` も実行する）
- GitHub Actions で 2 つのワークフローを動かす
  - `.github/workflows/vault.yml`: PR と main への push のたびに、ハーネスと Vault の検査（テスト、文書の構造、wiki の lint、追記だけの検査）
  - `.github/workflows/plugin.yml`: プラグインのソースか成果物を変えたときだけ、`pnpm check` と、ビルドし直した `main.js` がコミットされたものと一致するかの検査
- Node と pnpm の版は `mise.toml` と同じにする。ワークフローは `mise.toml` から版を読む
- git フックは使わない

## 理由

- 依存なしにすると、`.plugin-src` の依存（サプライチェーン対策を施してある）と独立して、どの端末でも `node` だけで動く。既存の SessionStart フックと同じ形
- モバイルからの push でも、CI なら必ず動く。人のノートの問題は警告に留め、CI を失敗させない（同期のたびに失敗の通知が来るのを避ける）
- プラグインの検査は重いので、パスで絞る

## 却下した案

- git フック: PC だけで動き、モバイルの push を止められない。PC でも、フックを入れる手順を覚える必要がある
- TypeScript で書く（テンプレートと同じ）: このリポジトリの Node は `mise.toml` の版だが、ハーネスのスクリプトはそれより古い Node でも動かしたい（クラウドの環境など）。`.mjs` なら型を消す仕組みに頼らない

## 影響

- 依存を足したくなったら、この ADR を置き換える
- ワークフローの変更は、セキュリティチェックの対象に含める（CI はリポジトリの内容を読めるため）
