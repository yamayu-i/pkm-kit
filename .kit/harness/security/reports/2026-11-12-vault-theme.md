# セキュリティチェック 2026-11-12

- 対象 commit: 9e1a5e6
- 前回: 2026-11-11（3d69a63）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、ビルドの再現性、require、pnpm audit）
- 再現性の検査の対象に、新しい CLI `.kit/bin/theme.mjs`（design パッケージ）を足した
- `pnpm check`: 型チェック・ビルド・テストがすべて通った

## 目視レビュー

差分は design パッケージ（`src/theme.ts`、`node/theme-cli.ts`、`cli/theme.ts`、`esbuild.config.mjs`）、`.kit/lib/obsidian-required.mjs`、`.claude/scripts/verify.mjs`。プラグインの `main.js` は変わっていない。

### 認証情報
- 問題なし。認証情報を扱うコードの変更はない

### 通信
- 問題なし。新しい CLI は通信しない

### ファイル書き込み
- 問題なし。`theme.mjs build` が書くのは、Vault のルートからの決まったパス 2 つ（`.obsidian/snippets/pkm-theme-local.css`、`.obsidian/appearance.json`）だけ。パスに入力値を使わない。ルートは CLI の置き場所から決める（テストでは `KIT_VAULT_ROOT` で変える）
- スニペットに書く値は `theme.json` から読むが、不透明な `#rrggbb` だけを通すので、CSS に別の規則を差し込めない。色の名前のキーも、上書きできる色の一覧にあるものだけを通す
- `appearance.json` は `accentColor` と `enabledCssSnippets` だけを書き換え、ほかのキーを残す
- 規約に合わないときは、何も書かずに止まる

### データ消失
- 問題なし。マージの処理の変更はない

### UI
- 問題なし。UI の変更はない

### サプライチェーン
- lockfile の差分は、design パッケージの devDependencies に `esbuild` 0.28.2 を足しただけ。ワークスペースの他のパッケージ（slide など）が使っているものと同じ版で、新しいパッケージは入っていない
- `allowBuilds`、`minimumReleaseAge` は変えていない
- プラグインのバンドルは変わっていない。新しい CLI は 70 KB（トークンの JSON を束ねている）

## 依存

- 新しいパッケージなし（esbuild は既存の版を design でも使うようにしただけ）

## 対応したこと / 残課題

- 再現性の検査が新しい CLI を見ていなかったので、`security-scan.mjs` の対象に design を足した
- 残課題なし
