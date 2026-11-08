# 変更の記録

**2026-11-08 までの記録。ここには書き足さない。** 新しい変更は 1 変更 1 ファイルで [.kit/changes/](changes/README.md) に書く（並行する PR がぶつからないように。ハーネスの ADR-0056）。

子の Vault から見える変更と、移行。新しいものが上。

## git で管理しない一時ファイルの置き場 tmp/（temporary/ を使わない）

- **移行 0006-tmp-untracked**: 上流の `.gitignore` に `tmp/` を入れた。`tmp/` は、外部共有用の書き出し先と、自分が一時的に見るだけで端末間で同期しなくてよいファイルの置き場（ADR-0038）。移行は何も変えず、git が追跡している `tmp/` のファイルがあれば一覧を出して止まる（追跡を外すと、ほかの端末で次の同期のときに消えるため）。ファイルごとに、`tmp/` の外へ移すか追跡を外すかをユーザーに確かめる
- 一時ファイルの置き場は `tmp/` だけにした。updated の自動付与（vault-git と `.kit/bin/stamp-updated.mjs`）の対象外から `temporary/` を外した
- `.claude/docs/vault-conventions.md`: 配置の表に `tmp/` を足し、除外の記述を `tmp/` にそろえた。`tmp/` の外のノートから `tmp/` へリンクしない
- `tmp/` の一覧 View は #45 で扱う
- 子への影響: 移行 0006 を実行する。`temporary/` にノートを置いているなら、コミット時に updated が付き、wiki-lint の対象になる。一時ファイルなら `tmp/` に移す。vault-git の `main.js` と `.kit/bin/` の CLI が変わった。モバイルの Vault Git で、`tmp/` に置いたファイルがコミットされないことを確かめる

## Vault の中の HTML を読み取り専用で表示する（vault-html）

- **移行 0005-html-viewer**: 新しいプラグイン vault-html を有効にする（`community-plugins.json` に `vault-html` を足す）。`.html` / `.htm` がファイルエクスプローラーに出て、Obsidian のタブで読み取り専用で開ける。Markdown リンクからも開ける（ADR-0037）
- HTML の中のスクリプトは動かず、外部に通信しない（iframe の sandbox と CSP。外部の画像・CSS・フォントは出ない）。Vault の中の画像は出る。リンクは、Vault の中のファイルは Obsidian で、`https:` / `mailto:` はブラウザで開く
- ライト / ダークは Obsidian のテーマに合わせる。トークン（`var(--vt-…)`）で書いた HTML はデザインルールの見た目になる（`.kit/src/docs/design.md` の「HTML のページ」）
- 子への影響: 移行 0005 を実行する。`.obsidian/plugins/vault-html/`（`main.js`、`manifest.json`、`styles.css`）が増えた。PC とスマホで HTML を開き、表示されること、編集できないこと、リンクと画像を確かめる

## 入力欄を M3 の outlined text field にそろえる

- vault-task と vault-template の入力欄（`input` / `textarea` / `select`）から、Obsidian が付ける浮いて見える影をなくした。面・枠・文字をトークンで決め（ダークモードでは暗い面）、ホバーで枠が濃くなり、フォーカスで primary の 2px の枠になる（M3 の outlined text field。#32）
- vault-task の View・ヘッダー・モーダルの根に `.vt-ui` を付け、その中の入力欄に共通のルールを当てる。デザインの検査に `input/outlined` を足した
- 子への影響: 移行はない。vault-task・vault-template の `main.js` と `styles.css` が変わった。PC とモバイルの両方で、ライト / ダークの入力欄（issue の題名の編集、日付、routine の作成、テンプレートからの新規作成、Notes の絞り込み）に影がなく、フォーカスで紫の枠になることを確かめる

## member の項目（name / nickname / alias）と Members の View

- **移行 0004-member-nickname-alias**: member に `nickname`（自分が呼んでいる呼び名）と `alias`（検索と委任先の候補に出す短い呼び方。単数の文字列）を足した。`name` は本名（姓・名）。移行は `member/*.md` に、`nickname` がなければ `name` と同じ値を、`alias` がなければ ID を足す。`nickname` / `alias` が空・ないときは、vault-task が `name` / ID を使う（ADR-0035）
- 新しく作る member（委任先を選ぶ画面の「新しく作る」、Members の「member を作成」、テンプレート `member.md`）は、`name` と `nickname` に登録名、`alias` に ID が入る
- 委任先を選ぶ画面は、候補を `@alias - nickname (name)` の形で出し、alias・nickname・name・ID のどれでも探せる。ボードと issue 画面の委任先には nickname を出す
- vault-task に Members の一覧（コマンド「Members を開く」、Tasks サイドバー）を足した。検索・作成と、委任中の issue の数を出す
- member のノートを開くと、vault-task のヘッダーが出る（`[人のアイコン] nickname (name)`、nickname・name・alias の編集欄、委任中の issue）。Properties 欄は issue と同じく隠す。vault-template の簡素なヘッダーは member に出さない
- member に issue / routine と共用の `label` を付けられるようにした（member の画面の label の欄。任意の項目で、作るときは書かない）。Labels 画面の使用件数・改名・削除の制限は member も対象にする。Members の一覧は label のチップで絞り込み（すべて持つもの）、ID・nickname・name・alias・委任中の数・created で並べ替えられる（ADR-0036）
- 子への影響: 移行 0004 を実行する（label には移行は要らない）。子の `template/file/member.md` で上流のテンプレートを上書きしているなら、`nickname` と `alias` を足すか確かめる。vault-task・vault-template の `main.js` と vault-task の `styles.css`、`.kit/bin/` の CLI が変わった。モバイルで、member のヘッダーの入力欄が狭いペインで収まるか、委任先を選ぶ画面で `@alias` で探せるかを確かめる

## Daily の段階表示を縮める

- vault-task の Daily: 上部の段階表示は、今の段階だけ名前と件数を出し、ほかは番号（済みはチェック）の丸に縮めた。残りがある段階は丸の右上に赤い点が付き、名前と件数はホバーのツールチップで分かる。狭いペインでも横スクロールにならない
- 子への影響: 移行はない。vault-task の `main.js` と `styles.css` が変わった。モバイルで、Daily の段階表示が 1 行に収まり、丸を押すとその段階に移るかを確かめる

## estimated の単位入力と 1d = 24h、今日の予定の自動のボード入り、カードの置き場所の記憶

- vault-task の estimated: 「入力…」で `30m` / `2h` / `1d` / `1h30m` のように単位付きで入れられるようにした（今までは日数だけ）。単位のない数字は分。routine を作るフォームの estimated も同じ書き方になった（ADR-0034）
- 表記の換算を 1d = 24h にした（今までは 8h）。データは分のままなので、変わるのは表示だけ。今まで `1d` と出ていた見積もりは `8h` と出る
- Daily: 「今日の予定」の段階をなくした。Daily を開いているあいだ、今日が実行日の issue は自動で今日のボードに載る。その日にボードから外した issue は載せ直さない
- task board: カードを移したグループを覚え、別の日のボードでも、前に置いたグループに初めから出す（issue も routine も。routine の `group` は一度も移していないときの置き場所）。MCP の `get_board` も同じ
- 子への影響: 移行はない。vault-task の `main.js` と `.kit/bin/` の CLI が変わった。子だけのスキルや `local/CLAUDE.md` が「1d = 8h」や「今日の予定」の段階に触れていれば直す。モバイルで、Daily を開いて今日の予定がボードに載るか、カードを移した翌日に同じグループに出るかを確かめる

## 一覧の View を左の固定ペインに出す

- vault-task の View（Daily、Issues、Inbox、Organize、Scheduled、Someday、Routines、Board groups、Labels）と vault-template の一覧 View（Daily notes、Notes、Sources）は、メイン領域の左半分の「一覧ペイン」にタブで開き、固定するようにした。一覧ペインがなければ、最後に使ったタブを左右に分けて左に開く（ADR-0033）
- 一覧ペインがあるとき、プラグインから開くノート（一覧の行、ボード、サイドバー、issue 画面のリンク、テンプレートから作ったノート、今日のデイリーノート）は、右の「ノートペイン」で開く。Ctrl/Cmd+クリックではノートペインに新しいタブを足す。ノートペインを閉じていたら、一覧ペインの右に作り直す
- すでに開いている一覧の View は場所を変えない（固定だけする）。ノートと同じタブ列にあるものは、閉じて開き直すと一覧ペインに移る
- スマホでは画面を分けず、一覧の View を固定したタブで開く。ノートは別のタブで開き、一覧のタブは置き換わらない
- 子への影響: 移行はない。vault-task・vault-template の `main.js` が変わった。PC で、Daily を開いて左右に分かれるか、issue が右に開くか、ファイルエクスプローラーからノートを開いても一覧が置き換わらないかを確かめる。モバイルで、一覧のタブから issue を開いて、一覧のタブが残るかを確かめる

## 日付のアクション名、mid_due の改名（soft_deadline）、ボードからの delegated

- **移行 0003-soft-deadline**: issue の緩い締切のキーを `mid_due` から `soft_deadline` に改名した（`deadline` と対になる名前。ADR-0032）。移行は `issue/*.md` と `template/file/*.md` の frontmatter と、`.obsidian/types.json` を書き換える。`mid_due` が残っている issue は lint と vault-task が `legacy-mid-due` のエラーとして出す。MCP の引数と並べ替えのキーも `soft_deadline` になった
- vault-task の操作バー: 「Schedule」を **Add Do Date**（実行日を足す）、実行日を移す「Reschedule」を **Move Do Date**、期限切れ・期限が近いの「Reschedule」を **Change Deadline** / **Change Soft Deadline** にした。動きは変わらない。Do Tomorrow のアイコンを `sunrise` にした
- vault-task の task board: カードの status メニューで `delegated…` を選べるようにした。選ぶと委任先を選ぶ画面（名前で探し、いなければその場で作る）が開く。delegated のカードには委任先の名前を出し、押すと選び直せる。メニューから delegated 以外にすると `delegated_to` を外す（今までは残っていた）
- 子への影響: 移行 0003 を実行する。子だけのスキルや `local/CLAUDE.md` が `mid_due` に触れていれば直す。vault-task の `main.js` と `styles.css`、`.kit/bin/` の CLI が変わった。モバイルで、カードの委任先のチップが狭いペインで折り返すか、委任先を選ぶ画面が開くかを確かめる

## task board の status を 1 クリックで変える

- vault-task の task board: カードの status バッジの右に「次の status」のボタンを置いた。open / waiting → in-progress、in-progress → closed、delegated → in-progress か closed（ボタン 2 つ）。someday には出さない。アイコンは押した後の status（ADR-0031）
- status のバッジの色の点を、○ を土台にした status のアイコンに置き換えた（すべての画面）。in-progress はゆっくり回り、closed は閉じた直後にチェックを描く。動きを減らす設定では動かない
- closed / canceled の issue と、結果を記録した routine は、ボードのグループから外して下の「完了」の欄に出す。↩ で閉じる前の status に戻せる
- status を変えると、画面の右下に「N件のステータスが変更されました。 やり直す ›」を 5 秒出す。続けて変えると件数を足して数え直す。「やり直す」でまとめて元に戻す
- closed / canceled にすると、その issue の記録中のタイマーを止める。open の issue のタイマーを始めると in-progress にする（MCP も同じ）
- status の変化を `statuslog/<端末名>/YYYY-MM.jsonl` に 1 行ずつ記録する（分析用。正本は今までどおり frontmatter）。worklog-review は、これで「閉じた後のログ」を見つける
- 子への影響: 移行はない。Vault に `statuslog/` フォルダが増える（タスク管理のデータ）。vault-task の `main.js` と `styles.css` が変わった。モバイルで、カードのボタンが押しやすいか、トーストが下のツールバーに重ならないかを確かめる

## frontmatter のエスケープ、CI の検査の一本化、リボン、Organize の予定入れ

- **移行 0002-ribbon-and-core-daily-notes**: 新しいプラグイン vault-ribbon が「今日のデイリーノートを開く」（カレンダー）と「Daily を開く」のボタンを、続けて並べる（デイリーノートが上）。vault-template と vault-task は、このボタンを出さない（コマンドは残る）。コアプラグイン「デイリーノート」は無効にする（使っていないのにボタンが残っていた）。移行は `core-plugins.json` の `daily-notes` を `false` にし、`vault-ribbon` を有効にし、既定のままの `daily-notes.json` を消す（ADR-0029）
- vault-task の Organize: 「予定」はカレンダーだけを開き、日付を複数選んで「決定」する。1 日も選んでいないと決定は押せない。Inbox で estimated がないときだけ、カレンダーの下で estimated も選ぶ。カレンダーで選んだ後に何も編集できなくなる不具合も、これで直る（ADR-0030）
- カレンダーの今日: 選んでいないときは枠と文字を primary にして、一目で分かるようにした。読み上げとツールチップにも「今日」と出す

- vault-template: frontmatter の引用符（`"…"` / `'…'`）の中に展開する値（`{{title}}`、`{{prompt:…}}` など）を、YAML として正しくエスケープするようにした。タイトルに `"` や `\` を含めても、frontmatter が壊れない（yamayu-i/pkm-kit#10）。本文の展開は変わらない
- CI（`vault.yml`）は `verify.mjs` を呼ぶようにした。今まで CI で動いていなかった Obsidian の設定の検査（末尾改行、必要なキー）も動く（yamayu-i/pkm-kit#17）
- 子への影響: 移行 0002 を実行する。vault-ribbon・vault-template・vault-task の `main.js` が変わった。モバイルで、リボンの並び（デイリーノート → Daily）と、Organize の予定入れを確かめる。モバイルで、`"` を含むタイトルの issue をテンプレートから作り、開けるかを確かめる。子の CI で Obsidian の設定の検査が動くようになるので、`.obsidian/*.json` に末尾改行や足りないキーがあると失敗する（`node .kit/setup.mjs` で直る）

## 移行の仕組みと vault-upgrade

- 上流の更新を取り込む `vault-upgrade` のスキルを足した。merge と、移行（`.kit/migrations/`）の実行で取り込む
- `node .kit/migrate.mjs`: 未適用の移行を実行する。`verify.mjs` と CI は、未適用の移行があると失敗する
- SessionStart フックが、未取り込みの上流の更新と未適用の移行を知らせる
- `setup.mjs` は、移行を適用済みにせず、実行するようになった
- **移行 0001-template-overrides**: 子の `template/` から、切り出した時点の上流と同じ中身のテンプレートを消し、`template/config.json` を上流と違う項目だけにする。上流のテンプレートの改善が届くようになる
- 子への影響: 移行 0001 を実行する。モバイルで確かめることはない

## ハーネスの親子分離（pkm-kit #3）

- 子向けのハーネス（`.claude/`）と上流のハーネス（`.kit/harness/`）に分けた
- 子の改善のサイクル: `harness-note`（直す先を書く）、`harness-review`（子で直すものと上流に伝えるものに振り分ける）、`escalate`（上流に伝える）
- 子だけの規約とスキルは `.claude/local/CLAUDE.md` と `.claude/skills/local-*` に置く
- 子への影響: 移行なし。`node .kit/setup.mjs` を実行し直すと `.claude/local/CLAUDE.md` が置かれる

## テンプレートの重ね合わせとセットアップ（pkm-kit #2）

- テンプレートの既定を `.kit/templates/` に移した。子の `template/` は、同じ名前のファイルと設定の項目を上書きする
- `node .kit/setup.mjs`: エスカレーションの方法、取り込んだ上流のコミット、Obsidian の設定に必要なキー、初期値、pre-commit フック
- 子の検査: 上流のものを変えていないか、Obsidian の設定に必要なキーが入っているか
- 子への影響: vault-template の `main.js` が変わった。モバイルでテンプレートのモーダルと設定画面が開けるかを確かめる

## 上流の構成（pkm-kit #1）

- プラグインのソースを `.kit/src/` に移した。Vault で使う CLI を `.kit/bin/` に置いた（ビルド不要）
- updated の付与の規則を vault-git の `stamp/updated.ts` に一本化した。pre-commit フックは `.kit/bin/stamp-updated.mjs` を呼ぶ
- 子への影響: 移行なし
