# 0152: scheduled を Calendar（その日にやる日 1 つ）にし、Tickler を足す

## 何が変わったか

`.kit/src/docs/adr/0152-calendar-and-tickler.md`。

- `scheduled`（Do Date）は日付のリストだった。今日やるものを決める・先の日に予定を積む・その日にやらなければならない日、の 3 つが混ざっていた
- `scheduled` を **Calendar**（その日にやらなければならない日）の意味に絞り、日付 1 つにした。その日になると、これまでどおり自動でボードに載る。過ぎて片付いていないものは、Today の Calendar の段階の「Missed」に出る
- 今日やるものは、Today の **Pick**（Next から選ぶ）とボードの「Add issue」で載せる。載せても日付は書かない
- **Tickler**（`tickler`。日付 1 つ）を足した。その日まで出さず、その日に Inbox に戻る（整理を先送りしたもの）。Organize の ↑、Today の Pick と前のボード、issue 画面、MCP で付ける
- Do Today は「Add to today's board」、Do Tomorrow はなくなった（明日考え直すなら Tickler、明日やらなければならないなら Move date）。Move Do Date は「Move date」（Calendar の日を持つものだけ）
- Organize: → Next、↑ Tickler、← Someday、↓ Cancel。Calendar（日付 1 つ）と Already done はボタン
- サブイシューの `scheduled` も日付 1 つ。サブは `tickler` を持たない
- pkm-task は、リストのまま残った `scheduled` を最も早い日として読み、`legacy-scheduled-list` の警告を出す

## スクリプトが行うこと（migrate.mjs）

- `issue/i-N.md` の frontmatter と、本文のサブイシューのブロック（`<!-- sub-issue` 〜 `-->`）の `scheduled` のリスト（`[a, b]` と、字下げした `- ` の行）を、移行した日以降の最も早い日 1 つにする
- 移行した日より前の日付だけのリスト（空のリストも）は、`scheduled` の行を消す
- 日付 1 つの `scheduled`、本文のほかの行、行末（CRLF も）は変えない
- `node .kit/migrate.mjs --dry-run` で、直す issue を一覧にする

## スクリプトで扱えない場合（AI が行うこと）

- **リストに日付でない値がある**: ファイルは変えずに、check が失敗する。どの日付にするか（またはなくすか）をユーザーに確かめて、`scheduled: YYYY-MM-DD` の 1 行に直すか、行を消す。直したら `node .kit/migrate.mjs` をもう一度実行する
- 子だけのスキル（`skills/local-*`）、`local/CLAUDE.md` が Do Date・Do Today・Do Tomorrow や、`scheduled` のリストを前提にしていれば、Calendar・Tickler・Pick に合わせて直すかをユーザーに確かめる

## 確かめ方（check.mjs）

- `issue/i-N.md` の frontmatter とサブイシューのブロックに、リストの `scheduled` が残っていない

あわせて `node .kit/bin/lint.mjs .` で、`legacy-scheduled-list` が出ないことを確かめる。

## 取り込んだ後（人が行うこと）

- 複数の日に分けていた予定は、最も早い未来の日だけが残り、2 日目以降は失われる。分けて進める作業は、サブイシューと期間（`start`・`end`）で表す
- これまで「やりたい日」として入れていた `scheduled` も、Calendar（その日にやらなければならない日）として残る。その日のボードに載るのはこれまでどおり。必ずその日でなくてよいものは、issue 画面で Calendar の日を消すか、Today の「Back to Next」で Next に戻す
- 移行は issue の frontmatter とサブのブロックを書き換える。取り込む前にすべての端末で同期を済ませる
