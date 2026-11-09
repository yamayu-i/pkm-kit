# ADR-0064: Draw.io の図を、編集用 XML を内包した SVG（asset/*.drawio.svg）として持ち、pkm-drawio で表示・コピー・編集・書き出しする

- 状態: 置換（ADR-0111）
- 日付: 2026-11-08

## 背景

ノートに図を描きたい（Issue #64）。図はノートの書式（素の Markdown、添付は `asset/` 直下、Vault ルートからのパス）のまま扱いたい。プラグインがなくても図が見え、Draw.io 単体でも開けて、外部に共有するときは 1 ファイルにまとめたい。

コミュニティプラグインは使わない方針なので、既存の Draw.io プラグインは使わない。

## 決定

### 保存の形式

- 図は `asset/<名前>.drawio.svg` に置き、`![説明](asset/<名前>.drawio.svg)` で参照する。中身は Draw.io の編集可能 SVG（ルートの `<svg>` の `content` 属性に、全ページの編集用 XML `<mxfile>` を持つ）。描画と編集用 XML を 1 ファイルに持ち、別のファイルと対で管理しない
- 編集用 XML が正本。描画部分は保存のたびに Draw.io が同じ XML から作る。XML だけを外から書き換えても描画は変わらないので、図を変えるのは Draw.io を通す
- 開いただけ・表示しただけでは、ファイルを書き換えない
- 編集用 XML のない普通の SVG は画像として見えるが、図としては編集できない（そう伝える）

### 表示と操作（pkm-drawio）

- 表示は Obsidian の標準の画像の表示をそのまま使う。図のための描画も、CodeMirror の widget も作らない。プラグインを無効にしても、図は普通の SVG として見える
- Reading view と Live Preview の両方で、`.drawio.svg` の画像にマウスを載せる（タッチでは押す）と、画像の右上に「コピー」「編集」の操作バーを浮かべる。操作バーは `document.body` に置く 1 つの要素で、Obsidian の描画した DOM（CodeMirror の widget を含む）を書き換えない
- 画像から Vault のファイルへの対応は、埋め込みの `src`（リンクの文字列）か、`vault.getResourcePath()` の値で取る
- キーボードと、操作バーが出しにくい場面のために、コマンド（「ノートの図を編集」「ノートの図をコピー」「図を作る」「tmp/ に書き出す」）と、ファイルのメニュー（`.drawio.svg` を右クリック）からも同じ操作をできるようにする

### コピー

コピーは「PNG」「SVG」「XML」のメニュー。

| 形式 | 中身 | できないとき |
|---|---|---|
| PNG | 共有用の SVG を Canvas で 2 倍の大きさに描いた `image/png`。Canvas が汚染されたら（`foreignObject` など）、`<switch>` の中の `foreignObject` を外して描き直す | 失敗を通知する（成功したふりをしない） |
| SVG | 共有用の SVG（編集用 XML を除いたもの）。`image/svg+xml` と `text/plain` を同じ ClipboardItem に入れる | `text/plain` だけでコピーし、そう通知する |
| XML | 全ページの編集用 XML（`<mxfile>`）を `text/plain` で | — |

### 編集

- Obsidian の中の Modal に、公式の embed（`https://embed.diagrams.net/`、JSON protocol）を iframe で出す。外部のブラウザは使わない
- 保存（`save`）を受けたら、その XML を指定して `export`（`format: "xmlsvg"`）を頼み、返った SVG を検査してから、ファイル全体を書く。未完了の `export` は 1 つまで。保存中の編集は次の保存に回す
- 検査: data URI を読めること、編集用 XML を持つこと、保存した XML とページ（`<diagram>`）の数が同じこと、大きさの上限（10 MiB）
- 書くのは `vault.process()` の中で、今の中身が編集を始めたとき（か前の保存）と同じときだけ。違えば上書きせず、「別名で保存」「上書き」「編集に戻る」を選ぶ
- 保存に失敗したら編集画面を残す。保存していない変更があるまま閉じるときは、破棄するかを確かめる
- iframe: `sandbox="allow-scripts allow-same-origin allow-forms"`（トップの遷移・popup・ダウンロードは許さない）。`postMessage` の送り先は固定の origin。受け取るのは `event.origin` と `event.source` が合うものだけ。保存先のパスは親が持ち、iframe からは受け取らない
- 編集にはネットワークが要る。表示・コピー・書き出しは保存済みの SVG だけで行い、通信しない

### 共有用の SVG と tmp/ への書き出し

- 共有用の SVG は、ルートの `<svg>` の開始タグから `content` 属性だけを除いたもの（ほかのバイトは変えない）。同じ図からは常に同じバイト列になる。DOM を使わない文字列の処理なので、プラグインと Node の CLI で同じコードを使う
- 共有用の SVG は検査する。`<script>`、`on*` 属性、`javascript:`、`<iframe>` などがあれば失敗にする。外部の読み込み（`<image href="https:…">`、`url(https:…)`、`@import`）は警告として出す（`<img>` の中の SVG は外部を読み込まないので、表示が欠けるだけ）
- 書き出しは md と html の両方。`![…](….drawio.svg)` と `<img src="….drawio.svg">` の参照を、共有用の SVG の data URI（UTF-8 を base64）に置き換える。コードブロック・インラインのコード・HTML のコメント・エスケープした記述は変えない。置き換えるのは参照の範囲だけで、ほかの本文は変えない
- md の参照は Vault ルートからのパス（ノートの規約）。html は pkm-html と同じ規則（ファイルからの相対、なければルート。`candidatePaths()`）
- 書き出し先は `tmp/<名前>.<拡張子>`。あれば上書きせず、番号を付けた別名にする。元のノートと図は変えない
- Obsidian のコマンドと、PC 用の CLI（`.kit/bin/drawio.mjs`。`export` / `check` / `extract` / `strip`）が同じ処理を使う。Claude Code が tmp/ に成果物を作るときは、CLI の `export` を通す（`.claude/docs/vault-conventions.md`）

### 同期

- pkm-git は、両側で変わった `.drawio.svg` / `.drawio` を行単位でマージしない。リモート版を採り、ローカル版を `<名前> (conflict <端末> <日時>).drawio.svg` として残す（二重の拡張子を保つので、別名の版も図として開ける）
- PC の Git CLI でも行単位でマージしないように、`.gitattributes` で `merge=binary` を指定する

### コードの置き場所

- `.kit/src/packages/pkm-drawio/`。Obsidian にも DOM にも依存しない処理は `src/core/`、Obsidian のものは `src/obsidian/`、Node の CLI は `cli/`
- パスの解決と base64 は pkm-html の `src/core/policy.ts` を相対パスで読んで束ねる（同じ規則を 2 か所に書かない）。HTML の自己完結の書き出し（Issue #44）も `src/core/` の書き出しを使える

## 理由

- 編集可能 SVG は Draw.io の標準の形式で、プラグインがなくても普通の画像として見え、Draw.io 単体でも開ける。1 ファイルなので、描画と XML が別々に同期されて食い違うことがない
- 標準の画像の表示に操作バーを重ねるだけなら、Obsidian の内部の DOM（Live Preview の widget）を書き換えず、二重の表示やカーソルの跳びが起きない。表示の互換性を Obsidian に任せられる
- 共有用の SVG を開始タグの属性の削除だけで作ると、描画を変えずに編集用 XML だけを確実に外せ、出力が決定的になる。DOM の実装を CLI に持ち込まなくて済む
- 図の XML と描画は行単位で混ぜると意味が壊れるので、ファイル単位で衝突として扱い、両方の完全な版を残す

## 却下した案

- **編集用 XML と表示用 SVG を別のファイル（または独自の JSON の入れ物）で持つ**: 対の片方だけが同期・編集されると食い違う。独自の形式は Draw.io 単体で開けない
- **Live Preview で、図の画像を CodeMirror の widget に置き換える**: Obsidian の標準の埋め込みと二重に出ないようにするために内部の DOM に依存し、カーソルの扱いも自分で持つことになる。操作を足すだけなら、浮かべる操作バーで足りる
- **Draw.io をプラグインに同梱する（オフラインの編集）**: 配布物が大きく、モバイルでの読み込み・origin・更新の負担が大きい。必要になったら編集の部分だけを差し替えられるようにしておく
- **外部のブラウザで Draw.io を開く**: Obsidian と通信できるとは限らず（特にモバイル）、保存の経路にできない
- **共通の処理を別のパッケージ（drawio-core）にする**: 今使うのは pkm-drawio とその CLI だけ。pkm-html から読むときも相対パスで足りる
- **書き出しで XML から描き直す**: Draw.io の版やフォントで結果が変わり、通信も要る。保存済みの描画を使えば、通信なしで決定的に書き出せる
- **書き出しの `files` モード（md と SVG を別ファイルで置く）、XML から SVG を作る CLI（`render`）**: 今は要らない。要るようになったら足す

## 影響

- 新しいプラグイン pkm-drawio。子は移行 0064 で `community-plugins.json` に足す
- pkm-git のマージの規則と、衝突の版の名前の付け方（二重の拡張子）が変わる
- `.gitattributes` に `*.drawio.svg merge=binary` などが増える
- security-scan: `allow-scripts` を付けた iframe は pkm-drawio の編集画面（`src/obsidian/frame.ts`）だけに許す。pkm-html には引き続き付けない
- 実機で確かめること（自動の検査ではできない）: embed の起動と保存の往復（PC・Android・iOS）、Reading view と Live Preview での操作バーの位置、PNG / SVG のクリップボード、tmp/ の md の data URI の表示
