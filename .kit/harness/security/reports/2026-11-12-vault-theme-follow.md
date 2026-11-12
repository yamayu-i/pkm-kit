# セキュリティチェック 2026-11-12

- 対象 commit: 8f5e476
- 前回: 2026-11-12（9e1a5e6）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、ビルドの再現性、require、pnpm audit）
- `pnpm check`: 型チェック・ビルド・テストがすべて通った
- `node .claude/scripts/verify.mjs --plugin`: 通った（移行のテストを含む）
- `pnpm --filter pkm-html preview:ui`: 問題なし（スクリプト・外部への要求・遷移・リンク・画像・描画した画面の検査）

## 目視レビュー

対象は Issue #129（ADR-0129）の差分（main の 0c17bf2 から）。design（`theme.ts`・`primary.ts`・`tokens.ts`・`diagram.ts`）、slide（`build.ts`・`color.ts`）、pkm-html（`live-vars.ts`・`sanitize.ts`・`frame.ts`・`html-view.ts`）、移行 0129。

### 認証情報
- 問題なし。認証情報を扱うコードに変更はない

### 通信
- 問題なし。通信するコードはない。新しい外部 URL もない

### ファイル書き込み
- 問題なし。`theme.mjs` が書くファイルはこれまでどおり `pkm-theme-local.css` と `appearance.json` だけ。移行 0129 は `theme.json` がある Vault でだけ、上流の `.kit/bin/theme.mjs build` を `KIT_VAULT_ROOT` を付けて実行し、書く先は同じ 2 つ。`theme.json` が規約に合わなければ何も書かない（テストで確かめた）
- 移行が子プロセスに渡すのは、`process.execPath` と Vault の中の固定のパスだけ（シェルを通さない）

### データ消失
- 問題なし。`appearance.json` は `accentColor` と `enabledCssSnippets` だけを書き換え、ほかのキーと子が足したスニペットは残す（既存の処理。移行のテストで `my-snippet` が残ることを確かめた）

### UI
- 閲覧画面の iframe に入れる CSS が増えた（`style[data-pkm-html="live"]`）。値は Obsidian の `body` の計算済みの `--vt-*` だが、iframe の `<style>` に入るので、次を通したものだけを入れる
  - 名前は `--vt-[a-z0-9-]+`
  - 値は 200 文字以内で、英数字と `#` `.` `,` `%` `(` `)` `+` `-` `*` `/` と空白だけ。`;` `{` `}` `<` `>` 引用符・バックスラッシュを含む値は落とす（`</style>` での抜け出し、宣言の追加、エスケープを防ぐ）
  - `url(` `image-set(` などの外を読み込む関数を含む値は落とす（CSP でも外部の読み込みは止まる）
  - テスト（`live-vars.test.ts`）で、抜け出し・url・image-set・エスケープ・長すぎる値を落とすことを確かめた
- 入れる場所は、これまでどおり CSP の後。`textContent` で入れ、HTML 文字列として DOM に入れていない
- iframe の sandbox（`allow-same-origin` だけ）は変えていない

### サプライチェーン
- 依存の追加・更新はない（lockfile と package.json の変更なし）。`pnpm-workspace.yaml` の変更もない
- バンドルのサイズ: `.kit/bin/slide.mjs` は 899 KB → 1006 KB。スライドの CLI が、子の primary から作る色を `theme.mjs` と同じ関数で作るため、`tokens.json` とトークンの読み込み・`theme.ts` を束ねるようになった（ADR-0129）。`.kit/bin/theme.mjs` は 71 KB → 79 KB、`pkm-html/main.js` は 36 KB → 37 KB。どれも理由を説明できる

## 依存

- `pnpm outdated`: 更新のある依存はない
- lockfile の差分で増えたパッケージはない

## 対応したこと / 残課題

- なし
