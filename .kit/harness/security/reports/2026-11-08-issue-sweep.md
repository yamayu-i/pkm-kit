# セキュリティチェック 2026-11-08

- 対象 commit: a484d8c
- 前回: 2026-11-08（755a530）
- 結果: pass

すぐ着手できる Issue（#35・#33・#19・#51・#49・#52・#9）をまとめて片付けたブランチのチェック。`src/obsidian/` の変更、ルートの build の変更、CI の変更を含むので、期限に関係なく行った。

## 機械的チェック

- `pnpm security:scan`: 8/8 成功（秘密情報、data.json、危険な API、依存の固定、lockfile、成果物の再現、require、pnpm audit）
- `node .claude/scripts/verify.mjs --plugin`: すべて成功（pnpm check を含む）
- `pnpm test` を 3 回続けて実行し、すべて成功（#5 の不安定なテストは見つからなかった）

## 目視レビュー

### 認証情報・通信・ファイル書き込み・データ消失

- 変更なし（pkm-git、書き込みの処理に触れていない）。問題なし

### UI

- `status-undo.ts` はボタンの文言（`append` の文字列）を変えただけで、HTML 文字列は DOM に入れていない。`OrganizeView.tsx` も JSX の文言だけ。問題なし

### ビルド設定

- ルートの `build` を `pnpm --filter design build && pnpm -r --filter !design build` にした。ビルドの対象と出力は変わらず、順だけを固定した。成果物の再現の検査は成功。問題なし
- パッケージの依存に `design`（`workspace:*`）を足す案は、「依存はバージョン固定」の検査を緩めることになるので採らなかった

### CI

- `plugin.yml` に `preview-ui` のジョブを足した。権限はワークフロー全体の `contents: read` のまま。秘密情報は使わない。`pull_request` で動き、`pull_request_target` は使わない
- 新しく使うアクション: `actions/upload-artifact@v4`（GitHub 公式。既存の `actions/checkout@v6`・`actions/setup-node@v6` と同じくタグで参照）。SHA に固定するかは #11 の残課題で扱う
- `playwright install --with-deps chromium` は lockfile で固定した Playwright（devDependencies）が求める Chromium を入れる。成果物は PNG だけ

### サプライチェーン

- lockfile の変更なし。`pnpm-workspace.yaml` の変更なし

### 所有の境界

- `.kit/owned-paths.json` の `.obsidian/plugins/*/` を、上流のプラグインの ID ごとの列挙にした。上流が持つ範囲は狭まるだけで、上流のファイルはすべて当たる（所有の境界の検査は成功）

## 依存

- `pnpm outdated`: 出力なし（更新のある依存はない）
- lockfile の差分: なし

## 対応したこと / 残課題

- 残課題なし。`actions/upload-artifact` の SHA 固定は、既存のアクションと一緒に #11 で決める
