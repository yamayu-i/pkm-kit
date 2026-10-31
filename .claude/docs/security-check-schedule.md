# セキュリティチェックの頻度と実施ルール

自作プラグインのセキュリティチェックは **`security-check` スキル** で行う。
**少なくとも週に 1 回**実施し、結果を記録する。

## 期限の判定

- 記録: `.claude/security/last-check.json`（`date`, `commit`, `result`, `report`）
- セッション開始時に SessionStart フック（`.claude/hooks/security-check-status.mjs`）が経過日数を出力する
- 次のどれかに当てはまれば **期限切れ**:
  - `last-check.json` がない
  - `date` から 7 日以上経っている
  - `result` が `pass` ではない

フックの出力が見当たらないとき（フックが動かない環境など）は、自分で `last-check.json` を読んで判定する。

## 期限切れのときの動き

1. ユーザーの依頼に取りかかる前に、期限切れであることを一言伝え、`security-check` スキルを実行する
2. ユーザーが「後で」と言ったら依頼を優先してよい。ただし、そのセッションの作業が終わる前に改めて実施を提案する
3. 結果が `fail` のときは、プラグインの変更を push する前にユーザーへ報告し、対応方針を確認する

## 期限内でも実施するとき

次の変更をコミットする前には、期限に関係なく実施する。

- 依存の追加・更新（`package.json` / `pnpm-lock.yaml` / `pnpm-workspace.yaml` の変更）
- 認証・通信・ファイル書き込みに関わるコードの変更（`src/git/`, `src/fs/`, `src/obsidian/`）
- ビルド設定（`esbuild.config.mjs`）の変更

## 記録

- レポート: `.claude/security/reports/YYYY-MM-DD.md`
- 実施したら `last-check.json` を更新し、レポートと一緒にコミットする（他の端末やセッションから記録が見えるようにするため）
