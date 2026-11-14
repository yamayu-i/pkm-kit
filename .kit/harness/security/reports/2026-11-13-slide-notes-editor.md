# セキュリティチェック 2026-11-13

- 対象 commit: 1f55a77
- 前回: 2026-11-12（9e1a5e6）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、main.js と .kit/bin の再現、require、pnpm audit）
- `pnpm check`: 型チェック・ビルド・テストがすべて通った（pkm-slide 16、slide 106、shared 39 ほか）
- `pnpm --filter slide preview:ui`: すべて確かめた

## 目視レビュー

差分: 発表者ノートの編集（ADR-0132）。pkm-slide の編集の画面・保存・プラグインの中のビルド、slide の規則 `notes-format` とノートの書き換えの関数、shared の SHA-256 とノートペインに View を開く関数、両方の esbuild の設定。

### 認証情報・通信
- 問題なし。通信もトークンもない。束ねた linkedom も通信しない

### ファイル書き込み
- 問題なし。書くのは Vault の API（`vault.modify`、`vault.create`）だけで、先は `<デッキ>/deck.html` と `<デッキ>/index.html` の 2 つに限る。デッキのパスは Slides の一覧が見つけたデッキ（`slide/` の下）か、開いているファイルのパス（`deckOfFile` が `slide/…/(index|deck).html` だけを通す）から作る
- 読むのは `deck.html` と、アダプターで `.kit-local/theme.json`（固定のパス）だけ
- 添付があるかの判定（`resolveInDeck`）は `..` でデッキの外に出るもの・絶対パス・スキームのあるものを、ないものとして扱う（テストあり）。ビルドの `asset-outside` の検査もこれまでどおり効く

### データ消失
- 問題なし。`deck.html` は変えたスライドの aside の中だけを入れ替え、ほかは 1 バイトも変えない（テストで確かめる）
- 開いたときの `deck.html` と保存の直前の中身が違えば書かない（Claude Code や同期での変更を上書きしない）。ビルドがエラーなら `deck.html` も `index.html` も書かない
- 保存していない変更があるまま閉じると、保存するか捨てるかを聞く（答えずに閉じたら保存する）

### スクリプトの混入
- 問題なし。入力欄の文字は `& < >` をエスケープしてから `deck.html` に入れる（テストあり）。書式の範囲（文字・`<p>`・`<br>`・`<ul>`/`<ol>`/`<li>`、属性なし）の外は `notes-format` がビルドを止める。ビルドはこれまでどおり `stripDangerous` を通し、`index.html` の CSP も変えない

### UI
- 問題なし。preact で作り、HTML 文字列を DOM に入れない。確かめのダイアログは `createEl` の `text` と `Setting` のボタン

### サプライチェーン
- lockfile と `pnpm-workspace.yaml` の差分はない。新しいパッケージ・版はない
- pkm-slide の `main.js` に linkedom 0.18.15（pkm-slide の devDependencies にすでにある版。CLI に束ねているものと同じ）と、閲覧の画面の CSS・スクリプト（CLI と同じもの）を束ねた。`main.js` は約 53KB から約 1.08MB になった（理由: プラグインの中で CLI と同じビルドを動かすため。ADR-0132）
- linkedom の `require("canvas")` は、プラグインのビルドで必ず失敗するモジュールに置き換えた（Vault の外のモジュールを探させない。linkedom は代わりの実装を使う）。security-scan の require の検査も通る
- `allowBuilds` は esbuild のみ、`minimumReleaseAge` は残っている

## 依存

- `pnpm outdated`: 出力なし
- 増えたパッケージ: なし

## 対応したこと / 残課題

- linkedom の canvas の require を、プラグインのビルドで止めた（上）
- 実機で確かめること: モバイルで linkedom と SHA-256 が動き、保存した `index.html` を PC の `slide.mjs check` が「古い」と言わないこと（自動のテストでは Node の上で CLI と一致を確かめている）
