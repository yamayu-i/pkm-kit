# ADR-0035: Vault の中の HTML を、新しいプラグイン vault-html で読み取り専用で表示する

- 状態: 承認
- 日付: 2026-11-08

## 背景

ユーザー体験の定義（`.kit/harness/docs/product/`）を 1 枚の HTML にまとめ、子の Vault で見られるようにしたい（Issue #41 の後の Issue）。しかし Obsidian は `.html` を開けない。コミュニティプラグインも使わない方針なので、見るための自作プラグインが要る。

HTML はスクリプトを動かせ、画像・CSS・フォントの読み込みで外部に通信できる。Vault には同期で他の端末や他の人から届くファイルもあるので、開いただけで何かが動いたり、外部に何かが送られたりしてはいけない。

## 決定

### プラグイン

- 新しいプラグイン **vault-html** を作る。`.html` / `.htm` の拡張子を、読み取り専用の View（`FileView`）に登録する（`registerExtensions`）
- 拡張子を登録すると、ファイルエクスプローラーに出て、そこから開ける。Markdown リンク（`[…](docs/foo.html)`）と、検索・クイックスイッチャーからも同じ View で開く
- 編集の手段は持たない。表示を変えたいときは、元のファイルを PC のエディタで直す

### 表示の方式

HTML を `iframe` の `srcdoc` に入れて表示する。次の 4 つを重ねる（どれか 1 つが破られても、残りで止める）。

1. **`sandbox="allow-same-origin"`**（`allow-scripts` を付けない）: iframe の中のスクリプトは動かない（`<script>`、`onerror` などの属性、`javascript:` の URL）。フォームの送信、ポップアップ、親や上位の画面の遷移もできない。`allow-same-origin` は、親（プラグイン）からリンクのクリックを受け取るためだけに付ける。`allow-scripts` と一緒に付けることはしない
2. **CSP を先頭に差し込む**: `<head>` の最初に `<meta http-equiv="Content-Security-Policy">` を入れる。`default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; form-action 'none'`。外部の画像・CSS・フォント・`<iframe>`・`<object>` などは読み込まない。CSS の `@import` と `url(https://…)` も止まる。`<meta>` の CSP は iOS（WKWebView）でも効く（`iframe` の `csp` 属性は Chromium にしかないので使わない）
3. **読み込む前に取り除く**: `DOMParser` で解析し、`<script>`、`<noscript>`、`<base>`、`<meta http-equiv>`（`refresh` と、元の HTML の CSP）、`<link>`（外部の CSS・先読み）、`<iframe>` / `<frame>` / `<object>` / `<embed>` / `<portal>`、`on*` 属性、`javascript:` / `vbscript:` の URL（SVG のアニメーションの `to` / `values` なども）を消す。その上で 2 の CSP を差し込み、文字列に戻して `srcdoc` に入れる。sandbox と CSP があれば動かないものだが、念のため消す
4. **リンクは親が扱う**: iframe の中のクリックを親が受け取り、既定の動き（iframe の中での遷移）を止める
   - Vault の中のファイル（相対パス、または Vault ルートからのパス。`.md` も `.html` も）: `workspace.openLinkText` で Obsidian で開く（ADR-0033 の右のノートペイン）
   - `https:` / `http:` / `mailto:`: `window.open` で OS の既定のブラウザ（メール）で開く。開く前に確かめない（Markdown の外部リンクと同じ）
   - `#見出し`: iframe の中でその要素までスクロールする
   - それ以外（`file:`、`app:`、`data:` など）: 何もしない

### 対象にする HTML

- 任意の HTML を開く（上流が作ったものに限らない）。上の 4 つは、どの HTML にも同じようにかける
- スクリプトで描く HTML（グラフなど）は動かない。外部の画像・CSS・フォントを使う HTML は、その部分が欠ける。上流が作る HTML は、この前提で 1 ファイルに閉じて作る

### Vault の中の画像

- `<img src>` と `<picture>` の `<source srcset>` が Vault の中の画像を指していたら、`vault.readBinary` で読み、`data:` の URL に置き換えてから `srcdoc` に入れる。CSP は `img-src data:` のままにする（iframe からローカルのファイルを取りに行かせない。資源の URL の形が PC・Android・iOS で違うことにも左右されない）
- パスは HTML ファイルからの相対パスか、Vault ルートからのパスとして解決する。対象は、解決したパスが Vault の中のファイルで、拡張子が `png` / `jpg` / `jpeg` / `gif` / `webp` / `svg` のものだけ。`../` で Vault の外に出るパス、見つからないファイルは置き換えない（出ない）
- SVG も `<img>` として読み込むので、中のスクリプトは動かない
- 1 枚の上限は 10MB。超えたものは置き換えない。CSS の `url(...)`（背景の画像）は対象にしない

### テーマとデザイン規約

- vault-html は、ほかのプラグインと同じく `tokens.json` から生成した `tokens.css`（ADR-0016）を持ち、iframe の `<head>` に差し込む。iframe の `<body>` には Obsidian のテーマのクラス（`theme-light` / `theme-dark`）を付け、Obsidian の `css-change` で付け直す
- HTML の側は `var(--vt-…)` だけで書けば、ライト / ダークのテーマとデザイン規約に従う。トークンを使わない HTML は、そのままの色で出る（背景が白い HTML はダークでも白い）
- 上流が作る HTML の書き方は、デザインルール（`.kit/src/docs/design.md`）に節を足す。値はトークンだけを使う（`styles.css` と同じ）。上流が HTML を作る仕組みは別の Issue で作り、その `<style>` には `styles.css` と同じ CSS の検査（`css-lint`）と、描画した画面の検査（コントラストなど）をかける

### Vault の外に共有するとき

- Vault の中の HTML には、トークンの値も画像も埋め込まない（vault-html が開くときに差し込む）。そのため、Vault の外（ブラウザなど）で開くと、色と大きさが付かず、Vault の中の画像も出ない
- 外部に共有するときは、トークンの値と画像を埋め込んだ 1 ファイルを `tmp/` に書き出す。埋め込むのはこのときだけで、変換は LLM ではなくコードで決定論的に行う。書き出しは [Issue #44](https://github.com/yamayu-i/pkm-kit/issues/44)（`tmp/` 自体は [Issue #14](https://github.com/yamayu-i/pkm-kit/issues/14)）で決める
- そのため、取り除く処理と画像の埋め込みは、Obsidian に依存しないコード（`src/core/`）に置き、書き出しから使えるようにする

### 検査

- `test/`（`pnpm check`）で、パスの解決・リンクの分類などの DOM を使わない規則と、ビルド済みの `main.js`（`allow-scripts` を含まない、登録する拡張子）を検査する
- `preview/` で、Playwright の Chromium に View を描画し、組み立てた `srcdoc`（消すべきものが消え、CSP が `<head>` の最初にある）を確かめ、悪い HTML（`<script>`、`onerror`、外部の `<img>` / `<link>` / `@import` / フォント、`<meta refresh>`、`<form>`、`javascript:` のリンク）を開いて、スクリプトの副作用がないこと、外部への要求が 1 つも出ないこと（`page.on("request")`）を確かめる。Vault の中の画像が出ること、Vault の外を指す画像・上限を超える画像が出ないことも確かめる。ライト / ダーク × 広い / 狭いのスクリーンショットと、描画した画面の検査（ADR-0016）も行う
- security-scan: `srcdoc` への代入は HTML 文字列の挿入なので、規則に足す。許可するのは vault-html の表示を組み立てる 1 ファイルだけにする

## 理由

- **新しいプラグインにする**: HTML の表示は、セキュリティの面で他と性質が違う。小さく分けておけば、security-check で読む範囲が 1 つのプラグインで済み、不要な Vault では無効にできる。vault-ribbon（ADR-0029）と同じく、ほかのプラグインに依存しない
- **iframe の `srcdoc` + sandbox**: スクリプトを止めるのはブラウザの仕組みで、取り除く処理の漏れに頼らない。HTML の CSS が Obsidian の画面に漏れない（逆も）。PC・Android（Chromium）・iOS（WKWebView）のどれにもある
- **CSP を足す**: sandbox は外部の読み込み（画像・CSS・フォント）を止めない。外部に通信しないためには CSP が要る
- **`allow-same-origin` を付ける**: 付けないと、親から iframe の中のクリックを受け取れず、リンクが iframe の中で遷移してしまう。`allow-scripts` がなければ、iframe の中のコードは動かないので、同じ origin でも中から親には触れない
- **任意の HTML も開く**: 守りはどの HTML にも同じようにかかるので、上流が作ったものに限る理由がない。限ると、そのための目印（frontmatter のようなもの）を HTML に決める必要が出る

## 却下した案

- **HTML を解析して DOM に変換し、Obsidian の画面に直接入れる**（`sanitizeHTMLToDom` など）: 取り除く処理の漏れが、そのまま Obsidian の画面でのスクリプトの実行になる。HTML の CSS が Obsidian の画面に漏れる（Shadow DOM で閉じても、外部の読み込みは別に止める必要がある）
- **sandbox の `allow-same-origin` も付けない**: いちばん強いが、リンクを Obsidian で開けない。iframe の中にスクリプトを入れて `postMessage` で伝える方法は、`allow-scripts` が要るので取らない
- **vault-template に足す**: 新しいプラグインを有効にする移行は要らなくなるが、ノートの作成と一覧のプラグインに、性質の違う守りが混ざる。security-check で vault-template 全体を読む必要が出る
- **Vault の中の画像を資源の URL（`app://…` など）で読ませる**: 埋め込むより軽いが、CSP にローカルの資源の origin を許す必要があり、その形が PC・Android・iOS で違う。PC の `app://` は Vault の外のファイルも指せる
- **テーマの色を親の `getComputedStyle` から読んで差し込む**: 生成した `tokens.css` を差し込めば、規約の値と一致することがビルドで保証される
- **HTML ではなく PDF にする**: Obsidian は PDF を開けるが、テーマに追従せず、スマホでは文字が小さく、作るのに別の道具が要る

## 影響

- `.kit/src/packages/vault-html/` と `.obsidian/plugins/vault-html/`（`main.js`、`manifest.json`、`styles.css`）が増える。security-scan とビルドの再現の確認の対象に加える
- `.kit/obsidian-required.json` の `community-plugins.json` に `vault-html` を足す。子の `.obsidian/community-plugins.json` を変えるので、移行 `0004-html-viewer` を付ける（`vault-html` を足すだけ）
- `.kit/CHANGELOG.md`、プラグインの設計と開発（`.kit/harness/docs/plugin-development.md`）、デザインルール（HTML の書き方）、プロダクトの文書（`surfaces/` に HTML の表示）を更新する
- 子の Vault では、`.html` がファイルエクスプローラーに出るようになる。モバイルでは、pull した後に HTML を開き、表示とリンクを確かめる
- Obsidian の内部の DOM には依存しない（`FileView` と `iframe` だけ）。ただし、`.html` を別のプラグインが登録していると衝突する（コミュニティプラグインを使わない方針なので起きない想定）
