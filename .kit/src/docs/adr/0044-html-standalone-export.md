# ADR-0044: Vault の中の HTML を、トークンと画像を埋め込んだ 1 ファイルにして tmp/ に書き出す

- 状態: 承認
- 日付: 2026-11-08

## 背景

[Issue #44](https://github.com/yamayu-i/pkm-kit/issues/44)。Vault の中の HTML は、pkm-html（[ADR-0037](0037-html-viewer.md)）が開くときにデザイントークン（`tokens.css`）とテーマのクラスを差し込み、Vault の中の画像を `data:` に置き換えて表示する。HTML そのものは `var(--vt-…)` だけで書き、値を持たない。

そのため、同じ HTML を Vault の外（ブラウザ、メールの添付、ほかの人）に渡すと、色と大きさが付かず、Vault の中の画像も出ない。ADR-0037 は、外部に共有するときはトークンと画像を埋め込んだ 1 ファイルを `tmp/`（[ADR-0038](0038-tmp-folder.md)）に書き出すとし、その方法をこの Issue に送った。

pkm-drawio（[ADR-0064](0064-drawio-diagrams.md)）には、md / html の図の参照を共有用の SVG の data URI に置き換えて `tmp/` に書き出す処理がすでにある。HTML の書き出しは、それと名前の付け方と図の扱いをそろえる必要がある。

## 決定

### 1. 書き出しの手段

- pkm-html に、コマンド「Export HTML to tmp/」と、`.html` / `.htm` のファイルのメニュー（右クリック）の項目を足す。PC でもスマホでも使える
- PC の Claude Code とスキルのために、Node の CLI `.kit/bin/html.mjs`（`export <ファイル.html> [--output <パス>] [--vault <ルート>]`）も作る。pkm-drawio の `drawio.mjs` と同じく、依存を束ねてビルドし、ビルド済みのものをコミットする
- 変換は、Obsidian に依存しない `src/core/standalone.ts` に 1 つだけ置き、コマンドと CLI が使う。取り除く処理と画像の埋め込みは、表示と同じ関数（`stripDangerous`・`inlineImages`）を使う
- HTML の解析（`Document` を作る関数）は呼ぶ側が渡す。Obsidian ではブラウザの `DOMParser`、CLI では **linkedom**（依存に足す。版を固定）。linkedom は `<head>` / `<body>` を補わないので、解析した後に `<html>` の直下の要素を `<head>` か `<body>` に移して整える（ブラウザでは何もしない）
- 解析器が違うので、コマンドと CLI の出力は同じバイト列になるとは限らない（属性の順など）。どちらも、それぞれの中では同じ入力から同じバイト列になる。解析の違いで取り除く処理に漏れが出ても、書き出した HTML の CSP（下の 2）がスクリプトと外部の読み込みを止める

### 2. 書き出す HTML の中身

表示（`buildSrcdoc`）と同じ順で、次を行う。

1. `stripDangerous` で取り除く（表示と同じ。スクリプトなし、外部の読み込みなし）
2. `inlineImages` で Vault の中の画像を `data:` に埋め込む（表示と同じ規則。Vault の外を指すもの・見つからないもの・10MB を超えるものは埋め込まない）
   - 図（`*.drawio.svg`）は、編集用 XML（ルートの `<svg>` の `content` 属性）を除いた共有用の SVG にして埋め込む（ADR-0064 の共有用の SVG と同じバイト列）
3. `<head>` の最初に次を入れる
   - CSP の `<meta>`（表示と同じ値）。ブラウザで開いても外部に通信しない
   - `<meta charset="utf-8">` と `<meta name="viewport" content="width=device-width, initial-scale=1">`（元の HTML になければ）
   - 共有用のトークンの CSS（下の 3）
- テーマのクラス（`theme-light` / `theme-dark`）は付けない。ライト / ダークは OS の設定（`prefers-color-scheme`）で切り替える
- 出力は `<!DOCTYPE html>\n` + `documentElement.outerHTML`。日時などの入力に依存する値を入れないので、同じ HTML と同じ画像からは同じバイト列になる

### 3. 共有用のトークンの CSS

- design パッケージの生成（`pnpm --filter design build`）に、共有用の CSS を足す。中身は次の 3 つ
  - `:root { color-scheme: light dark; …ライトの値… }`
  - `@media (prefers-color-scheme: dark) { :root { …ダークの値… } }`
  - フォントの変数（`--font-interface` など、トークンが Obsidian から借りているもの）に、OS のフォントの既定値を入れる
- pkm-html はこの生成物を `tokens-standalone.css` として持ち、ビルドで `main.js` に入れる（`tokens.css` と同じ扱い）。手で編集しない

### 4. 書き出し先の名前

- `tmp/<元のファイル名>.html`。同じ名前があれば上書きせず、`tmp/<名前> 2.html` のように番号を付けた別名にする（ADR-0064 の書き出しと同じ規則。共有する前のファイルを消さない）
- 元の HTML と画像は変えない。書き出したら、パスを通知に出す

### 5. pkm-drawio の「tmp/ に書き出す」との関係

- HTML の図の参照は、pkm-html の書き出しが共有用の SVG にして埋め込むので、HTML については pkm-html の書き出しだけで足りる。pkm-drawio の書き出しは md のために残す（HTML も今のまま書き出せる。こちらはトークンと画像を埋め込まない）
- 共有用の SVG を作る処理（`toSharingSvg`）と書き出し先の名前（`exportPath`）は、pkm-drawio の `src/core/` をビルド時に束ねて使う（pkm-drawio が pkm-html の `policy.ts` を束ねているのと同じ）。実行時には、ほかのプラグインに依存しない
- Claude Code が `tmp/` に HTML を作るときは `node .kit/bin/html.mjs export` を通し、md は今のまま `node .kit/bin/drawio.mjs export` を通す（`.claude/docs/vault-conventions.md`）

### 6. 外部への共有の体験

- プロダクトの文書（`.kit/harness/docs/product/`）の `surfaces/` の HTML の表示に、書き出しの節を足す。外部への共有を 1 つの仕事（`jobs/`）として書くのは、md の書き出し（pkm-drawio）と合わせて、使い方が見えてから別の Issue で行う

## 理由

- **pkm-html のコマンドにする**: 表示と同じ取り除く処理・画像の埋め込みを、そのまま使える。`DOMParser` があるので依存が増えない。スマホでも書き出せる
- **CLI も作る**: Claude Code が `tmp/` に HTML の成果物を作るとき、コマンドを呼べない。md の書き出し（`drawio.mjs export`）と同じく、CLI を通せば決定論的に埋め込める
- **linkedom にする**: 依存が少なく（htmlparser2 などの純粋な JS）、esbuild で 1 ファイルに束ねられる。jsdom は大きく、束ねにくい。CLI はスクリプトを動かさないので、DOM の実装に要るのは解析・検索・属性の操作・文字列化だけ
- **`prefers-color-scheme` にする**: 書き出した HTML にはスクリプトを入れないので、テーマのクラスを付け替えられない。OS の設定に追従するのが、スクリプトなしでできる唯一の方法
- **CSP を残す**: 書き出した HTML を受け取った人のブラウザでも、外部に通信しないことを保証できる。取り除く処理の漏れがあっても止まる
- **上書きしない**: ADR-0064 と同じ。書き出した直後、共有する前のファイルを消さない。ADR-0038 は消すのを人に任せている

## 却下した案

- **Node の CLI だけにする**: DOM の実装の依存が要り、スマホで書き出せない
- **コマンドだけにして CLI を後に回す**: 依存は増えないが、Claude Code が HTML の成果物を書き出せない
- **CLI の DOM に jsdom / happy-dom を使う**: 大きく、jsdom は esbuild で束ねにくい
- **取り除く処理を DOM を使わない文字列の処理に書き直し、Node でも動かす**: HTML の解析を自前で持つことになり、取り除く処理の漏れのおそれが増える
- **書き出しのたびに日時を名前に付ける**: 名前が読みにくく、同じものを何度も書き出すと `tmp/` が増える。番号の別名は、重なったときだけ付く
- **テーマを選んで（ライトかダークに固定して）書き出す**: 受け取った人の設定に合わない。選ぶ手間が増える
- **pkm-drawio の書き出しに、トークンと画像の埋め込みを足す**: pkm-drawio が HTML の取り除く処理を持つことになり、HTML の守りが 2 つのプラグインに分かれる

## 影響

- pkm-html: `src/core/standalone.ts`（書き出しの変換）、`src/obsidian/export.ts` と `main.ts`（コマンドとファイルのメニュー）、`cli/html.ts`（CLI）を足す。`main.js` と `.kit/bin/html.mjs` をビルドする
- 依存: pkm-html の devDependencies に `linkedom`（版を固定）。CLI に束ねるだけで、プラグインの `main.js` には入らない
- design: 共有用の CSS の生成（`standaloneCss`）を足し、`pkm-html/tokens-standalone.css` に出す
- テスト（`test/`。linkedom で解析）: 同じ入力から同じバイト列になること、スクリプトと外部の読み込みがないこと、CSP が `<head>` の最初にあること、Vault の中の画像と図（`content` なし）が埋め込まれること、Vault の外の画像が埋め込まれないこと、断片の HTML を文書の形に整えること。ビルド済みの CLI を動かすテスト
- `preview/`: ブラウザの `DOMParser` で書き出した HTML を、iframe なしで Chromium で開き、ライト / ダーク（`colorScheme` のエミュレート）でトークンの値になること、スクリプトが動かず外部への要求が出ないこと、画像が出ることを確かめ、スクリーンショットと描画した画面の検査を行う
- security-scan とセキュリティチェック: ビルドの再現の確認に `.kit/bin/html.mjs` を足す。pkm-html の書き出しの処理を読む範囲に足す（`vault.create` で `tmp/` に書く。CLI はシンボリックリンクで Vault の外を指す画像を読まない）
- 子の Vault: プラグインの更新だけで、子のものは変えない（移行なし）。`.kit/changes/` に書く
- 実機で確かめること: スマホでの書き出しと、書き出した HTML を OS のブラウザで開いたときの表示
