# 0148: Inbox を日付ではなく clarified（整理済み）で決める

## 何が変わったか

`.kit/src/docs/adr/0148-inbox-clarified.md`。

- これまで Inbox は「`open` で、`scheduled`・`soft_deadline`・`deadline` がどれもない issue」だった。これは「日付がない」と「未整理」を取り違えていて、締切だけ決まった曖昧な issue が Inbox に出ず、整理済みで日付のない issue が Inbox に残っていた
- issue に `clarified`（真偽値）を足した。Inbox は「`open` で `clarified` でない issue」になる。日付は見ない。未設定は未整理
- Organize: → は Next（日付を決めずに整理済みにする）。Later はなくなった。Do Date はボタンで選び、`clarified: true` も書く。estimated は求めない
- 「Inbox に戻す」は `clarified` を外すだけで、予定と期限を残す
- issue 画面の status の横で、`Inbox` / `Clarified` を切り替えられる。MCP の `create_issue`・`update_issue` も `clarified` を受け付ける
- サブイシューは対象にしない（サブの整理は親の issue 画面で行う）

## スクリプトが行うこと（migrate.mjs）

- `issue/i-N.md` のうち、`status` が `open` で、`scheduled`・`soft_deadline`・`deadline` のどれかに値があり、`clarified` がないものの frontmatter の最後に `clarified: true` の行を足す。ほかの行・本文・行末（CRLF も）は変えない
- 日付のない `open` の issue は変えない（これまでどおり Inbox に出る）
- `open` 以外の issue、すでに `clarified` を持つ issue、サブイシューは変えない
- `node .kit/migrate.mjs --dry-run` で、足す issue を一覧にする

## スクリプトで扱えない場合（AI が行うこと）

- スクリプトが読めない形（`status` や日付が複数行の値など）の issue は変えない。その issue が Inbox に出て困るなら、ユーザーに確かめて `clarified: true` を足す
- 子だけのスキル（`skills/local-*`）、`local/CLAUDE.md` が Inbox を「日付のないもの」として扱っていれば、新しい定義に合わせて直すかをユーザーに確かめる

## 確かめ方（check.mjs）

- `issue/i-N.md` に、日付がある `open` の issue で `clarified` がないものが残っていない

## 取り込んだ後（人が行うこと）

- 見た目は移行の前後で変わらない（日付のあった issue は整理済みになり、Inbox に出ない）
- 締切は決まっているが中身が曖昧な issue があれば、issue 画面の `Clarified` を押して `Inbox` に戻すと、Organize で整理し直せる
- 移行は issue の frontmatter を書き換える。取り込む前にすべての端末で同期を済ませる
