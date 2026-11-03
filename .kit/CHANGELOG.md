# 変更の記録

子の Vault から見える変更と、移行を書く。新しいものを上に足す。`vault-upgrade` がこれを読んで、取り込みの PR の本文を書く（ADR-0010）。

各項目に、子への影響（移行の有無、モバイルで確かめること）を書く。

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
