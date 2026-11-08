# 自作プラグインの設計と開発

## pkm-git（git 同期）

コミュニティプラグインの Obsidian Git を使わずに、同期を自作したもの。モバイル（iOS / Android）でも動く。設計は [ADR-0089](../../src/docs/adr/0089-git-auto-sync.md)。

### 方針（jj の考え方を取り入れている）

- **作業中の変更も同期の区切りでコミット**: 同期のたびに未コミットの変更を自動でコミット（snapshot）する。保存のたびやオフラインではコミットしない。細かな版は Obsidian のファイル回復に任せる
- **コンフリクトで止まらない・消さない**: コンフリクトしたらマーカー入りのままマージコミットし、そのまま push できる。解決は後で行う
- **リモートを優先するのは、マーカーを入れられないファイルだけ**: JSON・バイナリなどはリモート版を採用し、ローカル版を `name (conflict <端末> <日時>).ext` として残す
- **Git の CLI がなくても先へ進める**: 想定できる失敗（オフライン、認証、送るのが重なる、同期中の編集、外からのコミット、取り込みの途中で落ちる）は状態として扱い、次の同期でやり直す。想定外のエラーは `.git/pkm-git/log.jsonl` に残す

### sync（1 回の同期。`PkmGit.sync()`）

1. 前回の取り込みが途中で終わっていたら（`.git/pkm-git/apply.json` がある）、続きを判断する。作業ファイルが取り込む前か後の内容なら揃えてブランチを進め、落ちた後に編集されていたらブランチを進めずに snapshot とマージに任せる
2. fetch。つながらなければ offline、認証の失敗なら auth で終わる（コミットしない）
3. snapshot → 取り込み
   - 最新 / ローカルが先行 → 何もしない
   - ローカルが遅れているだけ → fast-forward
   - 分岐 → ファイル単位の 3-way マージ（`src/merge/tree-merge.ts`）
     - 片側だけの変更 → 採用
     - 両側の変更 → 行単位でマージ。重なったら md / txt はマーカー、それ以外はリモート優先＋ローカル版を別名保存
     - Draw.io の図（`.drawio.svg` / `.drawio`）は両側の変更を行単位でマージせず、リモート優先＋ローカル版を別名保存（`<名前> (conflict …).drawio.svg`。ADR-0064）
     - 削除 vs 編集 → 編集側を残す
     - マージコミットのメッセージに `Conflicts:` として一覧を残す
4. push。拒否されたら 2 に戻る（3 回まで。それでも拒否されたら pending）
5. 作業ツリーへの反映は「記録を書く → 書く → インデックス更新 → ブランチが始めのままか確かめる → ブランチを進める → 記録を消す」の順。snapshot の後に編集されたファイルがあれば止め、pending で返す

`pull()` と `push()` はエンジンに残っている（テストと CLI 用）。プラグインのコマンドの Pull と Push は、どちらも `sync()` を呼ぶ。

### きっかけと状態（`src/sync/controller.ts`）

- 一定の間隔（前景のみ。既定 5 分）、再フォーカス（前回から 1 分以上）、起動、手動を、1 つの直列のキューで実行する。実行中に来たきっかけは、終わった後の 1 回にまとめる
- 自動の同期が続けて失敗したら、次の自動の実行までの間隔を倍にする（上限 30 分）
- 共有待ちは、Vault のイベントで分かる編集を数え、同期の後に HEAD と比べて決める

### コードの構成（`.kit/src/packages/pkm-git/src`）

| パス | 役割 | Obsidian 依存 |
|---|---|---|
| `git/engine.ts` | sync / pull / push / snapshot / clone、取り込みの記録と復旧 | なし |
| `git/sync-log.ts` | 同期の記録（`.git/pkm-git/log.jsonl`） | なし |
| `sync/controller.ts` | 同期のキュー、きっかけ、共有の状態 | なし |
| `merge/` | ツリーと行のマージ、パスの安全性検査 | なし |
| `stamp/updated.ts` | コミット時の updated の付与の規則(ADR-0028)。規則の正本はここだけ（ADR-0009）。PC の Git CLI 用の `cli/stamp-updated.mjs`（ビルドして `.kit/bin/stamp-updated.mjs`）と、Vault の検査（`.claude/scripts/wiki-lint.mjs`）もこれを使う。入出力の表は `test/fixtures/updated-cases.json` | なし |
| `fs/` | isomorphic-git 用の fs アダプタ | なし |
| `git/http.ts` | `requestUrl` を isomorphic-git の HTTP クライアントにする | なし（関数を注入） |
| `obsidian/` | Vault への読み書き、設定画面、モーダル | あり |
| `main.ts` | コマンド・ステータスバー（リボンのボタンは pkm-ribbon。ADR-0070） | あり |

Obsidian に依存しない部分は、テストで本物の `git http-backend` サーバーを立てて検証している（`test/engine.test.ts`）。
`test/bundle.test.ts` はビルド済みの `main.js` を Obsidian API のモック上で、Buffer がない状態（モバイル相当）で動かす。

### 注意点

- snapshot はコミットする変更ノートの `updated` の行だけを書き換える(ADR-0028)。付与できないノート(曖昧な `updated`、読んでから書くまでに編集された)は見送り、同期は止めない。マージでは `updated` を衝突の対象から外し、新しい方を採る
- isomorphic-git はファイルの更新時刻を秒単位でしか比べないので、snapshot で racy な候補だけハッシュを比べ直している
- 通常のノートは Vault API 経由で書く（開いているエディタとキャッシュに反映させるため）。`.git` / `.obsidian` などの隠しパスはアダプタで直接書く
- トークンは SecretStorage に置き、`data.json` には ID しか保存しない。エラーメッセージは `redactSecrets` で伏せる
- トークンは設定の「トークンを送るホスト」の `https://` にだけ送る（`src/git/auth-target.ts`）。onAuth と、HTTP 送信直前（Authorization ヘッダー付きのとき）の二段で検査する。http はループバックのみ例外

### 処理時間の計測

工程名と経過時間、通信した工程のリクエスト数と送受信のバイト数（body のみ）をコンソールに出す。fetch はサーバーも知っている追跡ブランチの先端を have として伝え、未 push のコミットがあっても全履歴を取り直さない（Issue #87）。計測範囲・検証・今後の高速化候補は [計測とツリー再利用](../../src/packages/pkm-git/PERFORMANCE-HANDOFF.md) を参照。

## pkm-task（タスク管理）

設計判断は ADR に残している: `.kit/src/docs/adr/README.md`（ハーネスと wiki の ADR は [別の場所](adr/README.md)）。実装するときは承認済みの ADR に従い、決定を変えるときは新しい ADR を作る。
ADR-0001 の段階 1〜5 はすべて実装済み（スキーマ・索引・lint、issue 画面・一括登録、DailyTaskView・タイマー、dead / caution の整理、グループ管理・各 View）。

### コードの構成（`.kit/src/packages/pkm-task`）

| パス | 役割 | Obsidian 依存 |
|---|---|---|
| `src/core/` | スキーマ、repeat、按分、索引、lint、ファイルの中身の生成 | なし |
| `src/obsidian/` | 索引の保持（metadataCache から）、Vault への書き込み、モーダル、一括登録 | あり |
| `src/header/` | issue・routine・member の画面のヘッダー（preact）。ページの一番上への差し込みは shared の `header-mount.ts`（ADR-0077） | あり |
| `src/views/` | 各 View（Today（DailyView）と Board、Issues、Inbox、Organize、Scheduled、Someday、Routines、Board groups） | あり |
| `src/ui/` | preact の部品（バッジ、一覧の行、操作バー、フォーム、カレンダー、ページング） | 一部 |
| `preview/` | UI のプレビュー（`pnpm preview:ui`）。モックとデータ。プラグインには同梱しない | なし |
| `cli/` | `pnpm task:lint`、`pnpm task:worklog-review`（worklog-review スキル用）、`pnpm task:mcp`（MCP サーバー。ADR-0025）の CLI。Node の API と `yaml` を使うので `src/` の外に置き、プラグインには同梱しない。ビルドして `.kit/bin/` に置き、Vault ではそれを直接使う | なし |

### 注意点

- frontmatter の更新は `fileManager.processFrontMatter` で行う（ほかの欄や書式を壊さない）。値が空なら欄ごと消す
- ボードの操作は端末別のログに追記し、状態は全端末のログの再生で作る（`src/core/board-log.ts`。ADR-0020）。デイリーノートの frontmatter の `board` は読み取り専用の初期状態で、もう書かない
- ボードを締めるときは `closeBoardNote` が未完了を再検査して本文に要約を書き、それから `close` を追記する
- `children` / `actual_effort` / `updated` は保存しない（ADR-0002）。索引で計算する
- データの置き場所: issue / routine / member の md、`worklog/<端末名>/YYYY-MM.jsonl`、`issue/labels.json`、`issue/board-groups.json`、`board/<端末名>/YYYY-MM.jsonl`（ADR-0020）、`statuslog/<端末名>/YYYY-MM.jsonl`（ADR-0031）
- status の変更は `TaskWriter.update` が見つけて、statuslog への追記、closed / canceled のときのタイマーの停止、取り消しのトースト（`onStatusChange` → `StatusUndo`）を行う。MCP は `updateIssueFrontmatter` に記録の情報を渡す。statuslog は分析用の履歴で、status の正本は frontmatter
- 端末ごとの設定（端末名・Issue List の保存した条件）は `.obsidian/plugins/pkm-task/data.json`。git に入れない
- 間違っていそうな worklog は [worklog-review スキル](../../../.claude/skills/worklog-review/SKILL.md) でユーザーと一緒に直す（止め忘れの警告や自動停止はしない。ADR-0009）
- worklog の編集・削除は `vault.process` で 1 行だけ書き換える（`replaceWorklogLine`）。行の ID が合わなければ書かない。開始日時を別の月に変えても、ファイルは移さない
- CodeMirror（`@codemirror/*`）は Obsidian 本体のものを使うので external にする。security-scan もそれだけを許可している
- **UI はデザインルール `.kit/src/docs/design.md` に従う**（ADR-0016）。値は `packages/design/tokens.json` にだけ書き、`styles.css` ではトークン（`--vt-*`）だけを使う。新しい色や部品を足したら、トークンと design.md も更新する
- `styles.css` はビルドで `tokens.css`（生成物）の後ろに連結して出力する
- UI は Obsidian なしで確認できる: `pnpm preview:ui`（`packages/pkm-task/preview/`）。`obsidian` をモックに差し替えて束ね、Vault のスニペットを読み込み、Chromium でライト / ダーク × 広い / 狭いペインのスクリーンショットを撮る。続けて描画した画面を検査する（コントラスト・押せる大きさ・フォーカス・キーボード）。UI を変えたら、通して見てからコミットする。Playwright は `pkm-task` の devDependencies にあり、Chromium は初回だけ `pnpm --filter pkm-task exec playwright install chromium` で入れる（入れられない環境では `CHROMIUM_PATH`。[クラウドのセッションでの準備](#クラウドのセッションでの準備)）。CI（`plugin.yml` の `preview-ui`）でも実行し、スクリーンショットを成果物 `preview-ui` に残す

## pkm-template（テンプレートからのノート作成）

上流の既定（`.kit/templates/file/`）にその Vault の `template/file/` を重ねたテンプレートを選び、日時・タイトル・プロンプト入力・ID・カーソル位置を展開してノートを作成するプラグイン（ADR-0022、ADR-0023）。表示順・生成先・ファイル名パターンは上流の `.kit/templates/config.json` だけで決め、設定タブはない（ADR-0061）。

- 変数: `{{date}}` `{{time}}` `{{title}}` `{{path}}` `{{folder}}` `{{prompt:ラベル}}` `{{cursor}}` と、連番の ID `{{id:i}}` `{{id:r}}` `{{id:m}}`（既存のノートの basename の最大番号 + 1。pkm-task と同じ規則）、日付を尋ねる `{{prompt-date[:ラベル]}}`（作成・挿入の前にダイアログを開く。出力は `YYYY-MM-DD` か `YYYY-MM-DD DDD`。ADR-0065）
- スニペット（ADR-0060）: 行頭の `/` で `template/snippet/`（上流の既定は `.kit/templates/snippet/`）の断片を挿入する。インラインテンプレート（ADR-0067）: 行頭か半角空白の後の `@` で `template/inline/`（上流の既定は `.kit/templates/inline/`）のものを行の中に挿入する。書式と検索は同じで、インラインは本文の終わりの改行を削る
- 日付の短い書き方の解釈（`parseDateInput`。ADR-0017）と日付の計算は `packages/shared/src/date-input.ts`・`dates.ts` にあり、pkm-task と pkm-template で共有する
- `fileNamePattern` に `{{id:…}}` があるテンプレートは、ファイル名が ID で固定され、モーダルの入力欄は `{{title}}`（タイトル）になる。issue / routine / member が該当する
- コマンド「今日のデイリーノートを開く」（リボンのボタンは pkm-ribbon が出す。ADR-0029）: `.kit/templates/config.json` の `daily.md` の設定（無効でも）で今日のパスを決め、あれば開き、なければ作って開く
- 連番の関数は pkm-task（`core/ids.ts`）と pkm-template（`core/ids.ts`）の両方にある。規則を変えるときは両方を変える
- 一覧 View（Daily notes / Notes / Sources）とノートのヘッダー（ADR-0026）: 対象は frontmatter の `type` で決める。ヘッダーは `.cm-sizer` / `.markdown-preview-sizer` の先頭への DOM の差し込みで、編集とリーディングの両方に出る（Obsidian の内部の DOM に依存するので、Obsidian を更新したら見た目を確かめる）。issue / routine には出さない（pkm-task のヘッダーがある）
- Temporary files（ADR-0045）: `tmp/` の下のファイルを場所で集める唯一の一覧（`src/core/tmp-list.ts`、`src/views/TmpListView.tsx`）。ほかの一覧は `withoutTmp` で `tmp/` を除く。Obsidian が開けない拡張子を PC で開くのに、公開の API にない `app.openWithDefaultApp` を、あるときだけ使う
- `test/templates-repo.test.ts` が、上流の既定のテンプレート（`.kit/templates/`）を読んで、created と updated が同じ値で入ること、pkm-task が必要とする項目があることを検査する
- 上流のテンプレートは隠しパスにあり、Vault の索引（`vault.getFiles()` など）に載らない。`vault.adapter` の `exists` / `list` / `read` で読む（モバイルでも使える）。その Vault の `template/file/` は Vault の API で読む

### コードの構成（`.kit/src/packages/pkm-template`）

| パス | 役割 | Obsidian 依存 |
|---|---|---|
| `src/core/date-format.ts` | `{{date:FORMAT}}` / `{{time:FORMAT}}` の日時フォーマット展開 | なし |
| `src/core/template.ts` | `{{prompt:...}}`・`{{prompt-date}}` 抽出、変数展開、`{{cursor}}` 位置算出、生成先パスの検証、今日のデイリーノートのパス | なし |
| `src/core/date-prompt.ts` | 日付のダイアログの入力（`-d` で曜日付き）と出力の形式（ADR-0065） | なし |
| `src/core/ids.ts` | `{{id:…}}` の連番（pkm-task の `core/ids.ts` と同じ規則） | なし |
| `src/core/config.ts` | 上流の設定（`.kit/templates/config.json`）の読み込みと、実在するテンプレートとの突き合わせ | なし |
| `src/core/note-title.ts` | タイトルの決め方（`title` → `name` → ファイル名）、daily の日付と曜日 | なし |
| `src/core/note-list.ts` / `note-format.ts` / `note-header.ts` | 一覧の絞り込み・並べ替え・取り込み状態の導出、値の整形、ヘッダーに出す内容の組み立て | なし |
| `src/obsidian/` | 新規ファイル作成モーダルと日付のダイアログ（Preact）、ファイル作成とカーソル移動、ノートのヘッダーの差し込み（`header-mount.ts`） | あり |
| `src/views/` | 一覧 View（Preact） | あり |
| `src/main.ts` | コマンド・View の登録 | あり |

## pkm-ribbon（リボンのボタン）

自作プラグインのリボンのボタンを、並びの表（`src/core/buttons.ts`）の順に登録するプラグイン（ADR-0029、ADR-0070）。リボンの並びはボタンを登録した順で決まるので、1 つのプラグインがすべてを登録する。

- **自作プラグインの `src/` で `addRibbonIcon` を使ってよいのは pkm-ribbon だけ**（`test/ribbon-owner.test.ts` が検査する）。ほかのプラグインはコマンドだけを持ち、ボタンを足すときは表に 1 行足す
- どのプラグインにも依存しない（import しない）。実行時に `app.commands.executeCommandById` でコマンドを ID で呼ぶ。コマンドがない（そのプラグインが無効）ときは Notice で伝える。コマンドの ID を変えるときは、表も変える
- バッジ: ボタンに数を出したいプラグインは、インスタンスに `getRibbonBadge(commandId): number | null` を持ち、数が変わったら `app.workspace.trigger("pkm-ribbon:badge-changed", commandId)` を出す。pkm-ribbon は起動の後とそのイベントで `app.plugins.getPlugin(<コマンドの接頭辞>)` に尋ねて描き直す。表示の規則（99+、0 と null は出さない）は `badgeText` だけ
- `app.commands` と `app.plugins` は Obsidian の公開の型にないので、使う形だけを型に書いてある
- `test/bundle.test.ts` が、ビルド済みの `main.js` でボタンの順、コマンドの呼び出し、バッジを確かめる

## pkm-updates（一覧 View の前回からの変更）

一覧 View ごとのセクションに、前回の確認（Viewed）より後に `updated` が新しくなったノートを出す View（ADR-0070）。

- 載せる規則は、pkm-task と pkm-template の `src/core/`（Obsidian に依存しない）を相対パスで読んで束ねる（`collectVault`、`isInbox`、`organizeQueue`、`isScheduledAhead`、`noteTitle` など）。規則を写さない。一覧の規則を変えたら、`test/sections.test.ts` も見る
- 実行時には pkm-task と pkm-template に依存しない。セクションの見出しは、一覧 View のコマンドを ID で呼ぶ（`src/core/sections.ts` の `SECTIONS`）
- Viewed の記録は `updates/<端末名>/YYYY-MM.jsonl` に `{"viewed_at": …}` を追記するだけ。基準は全端末の最大。端末名は pkm-task の `taskSettings.deviceName`、なければ pkm-git の `settings.deviceName`
- リボンのバッジの数（重複を除いたノートの数）を `getRibbonBadge` で返し、変わったら間引いて（1 秒に 1 回まで）pkm-ribbon に知らせる

### コードの構成（`.kit/src/packages/pkm-updates`）

| パス | 役割 | Obsidian 依存 |
|---|---|---|
| `src/core/sections.ts` | セクションの定義、基準より新しいものの抽出と並べ替え、件数 | なし |
| `src/core/viewed-log.ts` | Viewed のログのパス・行・全端末の最大 | なし |
| `src/core/paging.ts` / `format.ts` | 50 行ずつの表示、日時の表示 | なし |
| `src/obsidian/model.ts` | metadataCache とログからの作り直し、Viewed の書き込み | あり |
| `src/views/UpdatesView.tsx` | View（Preact）。無限スクロールは `IntersectionObserver` | あり |
| `src/main.ts` | View・コマンドの登録、バッジ | あり |

## pkm-view-selector（View を探して開く）

pkm-task・pkm-template・pkm-updates の一覧の View を、1 つのダイアログ（`SuggestModal`）から探して開くプラグイン（ADR-0072）。コマンド `pkm-view-selector:open` の既定のホットキーは Mod+K。

- pkm-task・pkm-template・pkm-updates には依存しない（import しない）。ダイアログを開くたびに `app.commands.commands` から `<プラグイン>:open-<名前>` のコマンドを集め、`app.viewRegistry.viewByType` に `<プラグイン>-<名前>` がある（View を開く）ものだけを候補にする。選んだら `executeCommandById` で呼ぶ
- View を足すときは、これまでどおり `open-<名前>` のコマンドを、View のアイコン（`icon`）付きで登録すれば候補に載る。コマンドの ID と View の種類の対応を崩さない
- 「Markdown リンクを挿入」（`editor:insert-link`）の Mod+K は、`.kit/obsidian-required.json` の `hotkeys.json` で外している
- `src/views.ts` が候補の集め方とあいまい検索（大文字と小文字を区別しない）の純粋な関数で、`test/views.test.ts` が確かめる

## pkm-html（HTML の読み取り専用の表示）

Vault の中の `.html` / `.htm` を、読み取り専用の View（`FileView`）で出し、トークンと画像を埋め込んだ 1 ファイルとして `tmp/` に書き出すプラグイン（ADR-0037、ADR-0044）。実行時には、ほかのプラグインに依存しない。

- 4 重の守り: iframe の `sandbox="allow-same-origin"`（`allow-scripts` を付けない）、`<head>` の最初の CSP（`default-src 'none'; img-src data:` など）、読み込む前の除去（`<script>`、`on*` 属性、`<meta http-equiv>`、`<link>`、`<iframe>` など、`javascript:`）、リンクのクリックを親で扱う
- **`allow-scripts` を足さない**。`allow-same-origin` と一緒になると、iframe の中のスクリプトが親（Obsidian）に触れる
- `srcdoc` への代入は `src/ui/frame.ts` だけ（security-scan が検査する）
- Vault の中の画像は `vault.readBinary` で読み、`data:` に置き換える。CSP を緩めない
- テーマ: `tokens.css` を文字列として束ね（esbuild の `loader`）、iframe に差し込む。`css-change` で `<body>` のクラスと `color-scheme` を付け直す
- `tmp/` への書き出し（ADR-0044）: コマンド・ファイルのメニューと CLI（`.kit/bin/html.mjs export`）が、同じ `src/core/standalone.ts` を使う。解析はプラグインでは `DOMParser`、CLI では linkedom（解析後に `<head>` / `<body>` を整える）。トークンは design が生成する `tokens-standalone.css`（`prefers-color-scheme` 版）を埋め込む。図の共有用の SVG と書き出し先の名前は pkm-drawio の `src/core/` を束ねて使う

### コードの構成（`.kit/src/packages/pkm-html`）

| パス | 役割 | Obsidian 依存 |
|---|---|---|
| `src/core/policy.ts` | CSP、画像の拡張子と上限、パスの解決、リンクの分類 | なし（DOM もなし） |
| `src/core/sanitize.ts` | 除去、画像の置き換え、CSP・トークン・テーマの差し込み、`srcdoc` の文字列 | なし（`DOMParser` を使う） |
| `src/ui/frame.ts` | iframe を作り、リンクのクリックとテーマの付け直しを扱う | なし |
| `src/core/standalone.ts` | `tmp/` に書き出す HTML の文字列（除去、画像と図の埋め込み、CSP・トークンの差し込み） | なし（解析は呼ぶ側が渡す） |
| `src/obsidian/html-view.ts`・`src/obsidian/export.ts`・`src/main.ts` | View、拡張子の登録、Vault からの読み込み、リンクを開く、書き出しのコマンドとメニュー | あり |
| `cli/html.ts` | `.kit/bin/html.mjs`（`export`）。Node の API と linkedom を使う | なし |
| `preview/` | `pnpm --filter pkm-html preview:ui`。悪い HTML でスクリプトが動かないこと・外部への要求がないこと、リンク、画像、見本の描画と検査、書き出した HTML（ライト / ダークの追従、スクリプト・外部への要求がないこと）を Chromium で確かめる。CI では動かない | なし |

- `test/` は policy の単体テスト、書き出しの変換のテスト（linkedom で解析）、ビルド済み `main.js` と `.kit/bin/html.mjs` のテスト。iframe の表示は preview で確かめる
- Playwright と違う版の Chromium しかない環境では、`CHROMIUM_PATH` に実行ファイルを渡す

## pkm-drawio（Draw.io の図）

`asset/*.drawio.svg`（Draw.io の編集可能 SVG。ルートの `<svg>` の `content` 属性に全ページの編集用 XML を持つ）を、ノートからコピー・編集し、`tmp/` への書き出しで埋め込むプラグイン（ADR-0064）。表示は Obsidian の標準の画像の表示のまま（`.svg` の拡張子を View に登録しない）。

- 操作バーは `document.body` に置く 1 つの要素を画像に重ねる。Reading view・Live Preview の DOM（CodeMirror の widget を含む）を書き換えない。画像からファイルへは、埋め込みの `src` か `vault.getResourcePath()` の値で引く
- 編集は Modal の iframe（`https://embed.diagrams.net/`、JSON protocol）。保存は save → その XML を指定して `export`（`xmlsvg`）→ 検査 → `vault.process()` で、編集を始めたときの中身と同じときだけ書く。状態は `src/core/protocol.ts` の `EditSession`（DOM なしでテストする）
- **`allow-scripts` を付けた iframe は `src/obsidian/frame.ts` だけ**（security-scan が検査する）。`postMessage` の送り先は固定の origin。受け取るのは origin と source が合うものだけ
- 共有用の SVG は、ルートの開始タグから `content` 属性だけを除いた文字列（`toSharingSvg`）。DOM を使わないので CLI でも同じ結果になる
- パスの解決と base64 は pkm-html の `src/core/policy.ts` を相対パスで読む

### コードの構成（`.kit/src/packages/pkm-drawio`）

| パス | 役割 | Obsidian 依存 |
|---|---|---|
| `src/core/svg.ts` | ルートの `<svg>` の読み取り、編集用 XML の取り出し、共有用の SVG、SVG の検査 | なし（DOM もなし） |
| `src/core/document.ts` | md / html の図の参照を探し、data URI に置き換える。書き出したものの検査 | なし（DOM もなし） |
| `src/core/protocol.ts` | embed の URL・メッセージの読み取り・保存の流れの状態 | なし（DOM もなし） |
| `src/core/names.ts` / `encoding.ts` | 図と書き出しのファイル名、data URI | なし |
| `src/obsidian/` | 編集の Modal と iframe、操作バー、コピー（PNG は Canvas）、tmp/ への書き出し、ダイアログ | あり（`frame.ts` と `toolbar.ts` は DOM と `setIcon` だけ） |
| `cli/drawio.ts` | `.kit/bin/drawio.mjs`（`export` / `check` / `extract` / `strip`）。Node の API を使う | なし |
| `preview/` | `pnpm --filter pkm-drawio preview:ui`。embed を偽の Draw.io（`fake-drawio.html`）に差し替えて、保存の往復・別の origin の無視・衝突・新しい図・未保存で閉じるときの確認、操作バーの位置と描画した画面の検査、PNG を Chromium で確かめる。CI では動かない | なし |

- 本物の Draw.io との往復と、Obsidian の中の操作バーの位置、クリップボードは、実機で確かめる（自動の検査ではできない）

## shared（プラグインの共通の処理）

`.kit/src/packages/shared`。プラグインではなく、複数のプラグインが同じ規則で動く必要がある処理を置く。各プラグインが `src/` を相対パスで読み、束ねる。Obsidian の値は import せず、型だけを使う（テストは偽の workspace で書く）。

| パス | 役割 |
|---|---|
| `src/list-pane.ts` | 一覧の View を左の固定ペインに、そこから開くノートを右のノートペインに出す（ADR-0033）。pkm-task・pkm-template・pkm-updates がノートや View を開くときは、`getLeaf` を直接使わずにここを通す |
| `src/header-mount.ts` | ノートの一番上（`.cm-sizer` と `.markdown-preview-sizer` の先頭）にヘッダーを差し込む（ADR-0026、ADR-0077）。pkm-task と pkm-template が使う。Obsidian が描き直して外れたら戻す。Obsidian を更新したら、両方のプラグインのヘッダーを実機で確かめる |

## design（デザイントークンと検査）

`.kit/src/packages/design`。プラグインではなく、デザインの値の正本と検査を置く（ADR-0016）。

| パス | 役割 |
|---|---|
| `tokens.json` | 値の正本（Design Tokens Format Module 2025.10） |
| `src/tokens.ts` | 読み込みと書式の検査 |
| `src/color.ts` / `src/contrast.ts` | WCAG のコントラスト比と、トークンに書いた条件の検査 |
| `src/emit.ts` / `scripts/generate.ts` | 生成（`pnpm build` に含まれる） |
| `node/` | ファイルの読み書きとパス。Node の API を使うので `src/` の外に置く（security-scan は `src/` で Node の API を禁止している） |
| `src/css-lint.ts` / `src/obsidian-config.ts` / `src/doc-lint.ts` | CSS・Obsidian の設定・design.md の検査（`pnpm check` の test で走る） |
| `src/audit.ts` | 描画した画面の検査（`pnpm preview:ui` から使う） |
| `generated/tokens.ts` | TS から使う色（pkm-task の label の検査）。生成物 |

- pkm-task は `src/color.ts` と `generated/tokens.ts` を相対パスで読み、プラグインに束ねている（`src/` は Obsidian にも Node にも依存しない）
- スクリプトは Node の型の除去で `.ts` をそのまま動かす（ビルドしない）

## 開発環境の準備

- Node と pnpm は `mise.toml` の版を使う（`mise install`）。`node .claude/scripts/verify.mjs` は最初に版を比べ、違えば警告する（止めない。結果が CI と揃わないことがある）
- 新しい clone・worktree では、最初に `.kit/src` で `pnpm install --frozen-lockfile` を実行する。単一パッケージのテスト（`pnpm --filter <id> test`）を先に実行すると、ほかのパッケージの依存が入らないことがある。`verify.mjs --plugin` は、依存が一部のパッケージにしかなければ `pnpm check` の前で止める

### クラウドのセッションでの準備

mise がなく、Node や pnpm の版が `mise.toml` と違う環境（Claude Code のクラウドのセッションなど）では、次のようにする。

- Node: 公式の配布物（`https://nodejs.org/dist/v<版>/`）の tar と `SHASUMS256.txt` を取り、`sha256sum -c` で照合してから、Vault の外の作業用のフォルダに展開し、`PATH` の先頭に足す
- pnpm: その Node で `npm install -g pnpm@<mise.toml の版>`
- Chromium: Playwright の求める版がなく、別の版の Chromium が入っているなら、その実行ファイルを `CHROMIUM_PATH` に渡す（`pkm-task`・`pkm-html`・`pkm-drawio` の `preview:ui`）。例: `CHROMIUM_PATH=$(find / -path '*chrome-linux64/chrome' -type f 2>/dev/null | head -1) pnpm --filter pkm-task preview:ui`

### Obsidian の実機で確かめる

テストと `preview:ui` は `obsidian` をモックにして描く。そのため、Obsidian 本体の CSS との詳細度の争い（本体の規則が勝ってプラグインの隠す CSS が効かない）や、View の生成の順の誤り（親のコンストラクタの中で未代入の値を読む）は見つからない。設定・CSS・View を変えたら、マージ後に試すことを PR の本文に挙げる。ユーザーはマージした後に本番で試す。エージェントは実機での確認のために止まらず、PR まで進める（[dev-implement](../skills/dev-implement/SKILL.md)）。

下は、本番で見つかった不具合を、頼まれて実機で調べるときの方法。

- 使える環境: Obsidian が起動している PC。Obsidian の CLI を有効にしておく（設定で有効にし、`obsidian` コマンドが使えること）。クラウドのセッションでは使えない
- 起動中のアプリで JavaScript を評価して、DOM と適用中の CSS を読む。引数の書き方は `obsidian help` で確かめる。例:

```sh
# 開いている View の種類
obsidian eval code="app.workspace.getLeavesOfType('pkm-task-daily').length"
# 要素に効いている CSS の値（本体の規則に負けていないか）
obsidian eval code="getComputedStyle(document.querySelector('.metadata-container')).display"
```

## 進め方

- 工程は [進め方](workflow.md) に従う（計画 → テストを先に書いて実装 → PR）
- 変更したら `pnpm check`（型チェック・ビルド・テスト）を通してからコミットする。`node .claude/scripts/verify.mjs --plugin` でハーネスの検査とまとめて実行できる
- 新しいマージのケースを扱うときは、先に `test/engine.test.ts` か `test/tree-merge.test.ts` にテストを足す
- 新しいプラグインを作るときは `.kit/src/packages/<id>/` に置き、ビルド結果を `.obsidian/plugins/<id>/` に出す。`.kit/owned-paths.json` に、その ID の `main.js`・`manifest.json`・`styles.css` を足す（足し忘れると、上流の所有の境界の検査が失敗する。子が足すプラグインは子のもの）
- Vault で使う CLI は、依存も束ねて `.kit/bin/` に出す（ビルド済みのものをコミットする。ADR-0009）。ESM に CJS の依存を束ねるときは、`createRequire` の banner を付ける（pkm-task の `esbuild.config.mjs`）
