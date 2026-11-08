# セキュリティチェックの頻度と実施ルール

自作プラグインのセキュリティチェックは **`security-check` スキル** で行う。
**少なくとも週に 1 回**実施し、結果を記録する。

## 期限の判定

- 記録: `.kit/harness/security/reports/` のレポート。日付はファイル名、commit と結果は本文の `- 対象 commit:` と `- 結果:` の行。前回は、作業ツリーと `origin/main` のレポートのうち最新の日付のもの（同じ日に `pass` があればそれ）。別の記録ファイルは置かない（並行するブランチがぶつかるため。[ADR-0056](adr/0056-conflict-free-numbering.md)）
- セッション開始時に SessionStart フック（`.kit/harness/hooks/security-check-status.mjs`。上流のときだけ）が経過日数を出力する
- 次のどれかに当てはまれば **期限切れ**:
  - レポートがない
  - 前回の日付から 7 日以上経っている
  - 前回の結果が `pass` ではない

フックの出力が見当たらないとき（フックが動かない環境など）は、自分で `node .kit/harness/hooks/security-check-status.mjs` を実行して判定する。

## 期限切れのときの動き

1. ユーザーの依頼に取りかかる前に、期限切れであることを一言伝え、`security-check` スキルを実行する
2. ユーザーが「後で」と言ったら依頼を優先してよい。ただし、そのセッションの作業が終わる前に改めて実施を提案する
3. 結果が `fail` のときは、プラグインの変更を push する前にユーザーへ報告し、対応方針を確認する

## 期限内でも実施するとき

次の変更をコミットする前には、期限に関係なく実施する。

- 依存の追加・更新（`package.json` / `pnpm-lock.yaml` / `pnpm-workspace.yaml` の変更）
- 認証・通信・ファイル書き込みに関わるコードの変更（`src/git/`, `src/fs/`, `src/obsidian/`）
- ビルド設定（`esbuild.config.mjs`）の変更
- CI（`.github/workflows/`）の変更

## 記録

- レポート: `.kit/harness/security/reports/YYYY-MM-DD-名前.md`（名前はブランチの作業。2026-11-08 までは `YYYY-MM-DD.md`）
- 実施したらレポートをコミットする（他の端末やセッションから記録が見えるようにするため）
