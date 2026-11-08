# 自作プラグインの設計と開発

## pkm-git（git 同期）

コミュニティプラグインの Obsidian Git を使わずに、pull / push だけを自作したもの。モバイル（iOS / Android）でも動く。

### 方針（jj の考え方を取り入れている）

- **作業中の変更も常にコミット**: pull / push の最初に未コミットの変更を自動でコミット（snapshot）する
- **コンフリクトで止まらない・消さない**: コンフリクトしたらマーカー入りのままマージコミットし、そのまま push できる。解決は後で PC で行う
- **リモートを優先するのは、マーカーを入れられないファイルだけ**: JSON・バイナリなどはリモート版を採用し、ローカル版を `name (conflict <端末> <日時>).ext` として残す

### pull

1. snapshot → fetch
2. 最新 / ローカルが先行 → 何もしない
3. ローカルが遅れているだけ → fast-forward
4. 分岐 → ファイル単位の 3-way マージ（`src/merge/tree-merge.ts`）
   - 片側だけの変更 → 採用
   - 両側の変更 → 行単位でマージ。重なったら md / txt はマーカー、それ以外はリモート優先＋ローカル版を別名保存
   - 削除 vs 編集 → 編集側を残す
   - マージコミットのメッセージに `Conflicts:` として一覧を残す
5. 作業ツリーへの反映は「書く → インデックス更新 → 最後にブランチを進める」の順。snapshot の後に編集されたファイルがあれば中断する

### push

1. fetch → リモートが先に進んでいたら（behind）モーダルを出して中断（コミットもしない）
2. snapshot → push。fetch と push の間に他の端末が push して拒否された場合も同じモーダル

### コードの構成（`.kit/src/packages/pkm-git/src`）

| パス | 役割 | Obsidian 依存 |
|---|---|---|
| `git/engine.ts` | pull / push / snapshot / clone | なし |
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

工程名と経過時間をコンソールに出す。計測範囲・検証・今後の高速化候補は [計測とツリー再利用](../../src/packages/pkm-git/PERFORMANCE-HANDOFF.md) を参照。

## pkm-task（タスク管理）

設計判断は ADR に残している: `.kit/src/docs/adr/README.md`（ハーネスと wiki の ADR は [別の場所](adr/README.md)）。実装するときは承認済みの ADR に従い、決定を変えるときは新しい ADR を作る。
ADR-0001 の段階 1〜5 はすべて実装済み（スキーマ・索引・lint、issue 画面・一括登録、DailyTaskView・タイマー、dead / caution の整理、グループ管理・各 View）。

### コードの構成（`.kit/src/packages/pkm-task`）

| パス | 役割 | Obsidian 依存 |
|---|---|---|
| `src/core/` | スキーマ、repeat、按分、索引、lint、ファイルの中身の生成 | なし |
| `src/obsidian/` | 索引の保持（metadataCache から）、Vault への書き込み、モーダル、一括登録 | あり |
| `src/header/` | issue 画面のヘッダー（CodeMirror の block widget + preact） | あり |
| `src/views/` | 各 View（Daily と Board、Issues、Inbox、Organize、Scheduled、Someday、Routines、Board groups） | あり |
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
- UI は Obsidian なしで確認できる: `pnpm preview:ui`（`packages/pkm-task/preview/`）。`obsidian` をモックに差し替えて束ね、Vault のスニペットを読み込み、Chromium でライト / ダーク × 広い / 狭いペインのスクリーンショットを撮る。続けて描画した画面を検査する（コントラスト・押せる大きさ・フォーカス・キーボード）。UI を変えたら、通して見てからコミットする。Playwright は `pkm-task` の devDependencies にあり、Chromium は初回だけ `pnpm --filter pkm-task exec playwright install chromium` で入れる

## pkm-template（テンプレートからのノート作成）

上流の既定（`.kit/templates/file/`）にその Vault の `template/file/` を重ねたテンプレートを選び、日時・タイトル・プロンプト入力・ID・カーソル位置を展開してノートを作成するプラグイン（ADR-0022、ADR-0023）。表示順・生成先・ファイル名パターンは上流の `.kit/templates/config.json` だけで決め、設定タブはない（ADR-0061）。

- 変数: `{{date}}` `{{time}}` `{{title}}` `{{path}}` `{{folder}}` `{{prompt:ラベル}}` `{{cursor}}` と、連番の ID `{{id:i}}` `{{id:r}}` `{{id:m}}`（既存のノートの basename の最大番号 + 1。pkm-task と同じ規則）、日付を尋ねる `{{prompt-date[:ラベル]}}`（作成・挿入の前にダイアログを開く。出力は `YYYY-MM-DD` か `YYYY-MM-DD DDD`。ADR-0065）
- スニペット（ADR-0060）: 行頭の `/` で `template/snippet/`（上流の既定は `.kit/templates/snippet/`）の断片を挿入する。インラインテンプレート（ADR-0067）: 行頭か半角空白の後の `@` で `template/inline/`（上流の既定は `.kit/templates/inline/`）のものを行の中に挿入する。書式と検索は同じで、インラインは本文の終わりの改行を削る
- 日付の短い書き方の解釈（`parseDateInput`。ADR-0017）と日付の計算は `packages/shared/src/date-input.ts`・`dates.ts` にあり、pkm-task と pkm-template で共有する
- `fileNamePattern` に `{{id:…}}` があるテンプレートは、ファイル名が ID で固定され、モーダルの入力欄は `{{title}}`（タイトル）になる。issue / routine / member が該当する
- コマンド「今日のデイリーノートを開く」（リボンのボタンは pkm-ribbon が出す。ADR-0029）: `.kit/templates/config.json` の `daily.md` の設定（無効でも）で今日のパスを決め、あれば開き、なければ作って開く
- 連番の関数は pkm-task（`core/ids.ts`）と pkm-template（`core/ids.ts`）の両方にある。規則を変えるときは両方を変える
- 一覧 View（Daily notes / Notes / Sources）とノートのヘッダー（ADR-0026）: 対象は frontmatter の `type` で決める。ヘッダーは `.cm-sizer` / `.markdown-preview-sizer` の先頭への DOM の差し込みで、編集とリーディングの両方に出る（Obsidian の内部の DOM に依存するので、Obsidian を更新したら見た目を確かめる）。issue / routine には出さない（pkm-task のヘッダーがある）
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

## pkm-html（HTML の読み取り専用の表示）

Vault の中の `.html` / `.htm` を、読み取り専用の View（`FileView`）で出すプラグイン（ADR-0037）。ほかのプラグインには依存しない。

- 4 重の守り: iframe の `sandbox="allow-same-origin"`（`allow-scripts` を付けない）、`<head>` の最初の CSP（`default-src 'none'; img-src data:` など）、読み込む前の除去（`<script>`、`on*` 属性、`<meta http-equiv>`、`<link>`、`<iframe>` など、`javascript:`）、リンクのクリックを親で扱う
- **`allow-scripts` を足さない**。`allow-same-origin` と一緒になると、iframe の中のスクリプトが親（Obsidian）に触れる
- `srcdoc` への代入は `src/ui/frame.ts` だけ（security-scan が検査する）
- Vault の中の画像は `vault.readBinary` で読み、`data:` に置き換える。CSP を緩めない
- テーマ: `tokens.css` を文字列として束ね（esbuild の `loader`）、iframe に差し込む。`css-change` で `<body>` のクラスと `color-scheme` を付け直す
- 外部に共有する HTML（`tmp/` への書き出し）は Issue #44。そのため、除去と画像の置き換えは Obsidian に依存しない `src/core/` に置く

### コードの構成（`.kit/src/packages/pkm-html`）

| パス | 役割 | Obsidian 依存 |
|---|---|---|
| `src/core/policy.ts` | CSP、画像の拡張子と上限、パスの解決、リンクの分類 | なし（DOM もなし） |
| `src/core/sanitize.ts` | 除去、画像の置き換え、CSP・トークン・テーマの差し込み、`srcdoc` の文字列 | なし（`DOMParser` を使う） |
| `src/ui/frame.ts` | iframe を作り、リンクのクリックとテーマの付け直しを扱う | なし |
| `src/obsidian/html-view.ts`・`src/main.ts` | View、拡張子の登録、Vault からの読み込み、リンクを開く | あり |
| `preview/` | `pnpm --filter pkm-html preview:ui`。悪い HTML でスクリプトが動かないこと・外部への要求がないこと、リンク、画像、見本の描画と検査を Chromium で確かめる。CI では動かない | なし |

- `test/` は policy の単体テストと、ビルド済み `main.js` のテスト（`allow-scripts` を含まないこと、登録する拡張子）。DOM を使う部分は preview で確かめる
- Playwright と違う版の Chromium しかない環境では、`CHROMIUM_PATH` に実行ファイルを渡す

## shared（プラグインの共通の処理）

`.kit/src/packages/shared`。プラグインではなく、複数のプラグインが同じ規則で動く必要がある処理を置く。各プラグインが `src/` を相対パスで読み、束ねる。Obsidian の値は import せず、型だけを使う（テストは偽の workspace で書く）。

| パス | 役割 |
|---|---|
| `src/list-pane.ts` | 一覧の View を左の固定ペインに、そこから開くノートを右のノートペインに出す（ADR-0033）。pkm-task・pkm-template・pkm-updates がノートや View を開くときは、`getLeaf` を直接使わずにここを通す |

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

## 進め方

- 工程は [進め方](workflow.md) に従う（計画 → テストを先に書いて実装 → PR）
- 変更したら `pnpm check`（型チェック・ビルド・テスト）を通してからコミットする。`node .claude/scripts/verify.mjs --plugin` でハーネスの検査とまとめて実行できる
- 新しいマージのケースを扱うときは、先に `test/engine.test.ts` か `test/tree-merge.test.ts` にテストを足す
- 新しいプラグインを作るときは `.kit/src/packages/<id>/` に置き、ビルド結果を `.obsidian/plugins/<id>/` に出す
- Vault で使う CLI は、依存も束ねて `.kit/bin/` に出す（ビルド済みのものをコミットする。ADR-0009）。ESM に CJS の依存を束ねるときは、`createRequire` の banner を付ける（pkm-task の `esbuild.config.mjs`）
