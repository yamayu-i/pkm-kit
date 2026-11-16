# 0190: サブイシューの期限を end にまとめる

## 何が変わったか

`.kit/src/docs/adr/0190-sub-end-as-due.md`。

- サブイシューの `soft_deadline` / `deadline` をなくした。サブの期限は `end`（期間の終わり）が兼ね、Daily の Overdue / Due soon の「end」の表に出る
- issue の `soft_deadline` / `deadline` は変わらない
- サブを someday にすると、Calendar の日と期間（`start` / `end`）を外す。someday のサブに期間を入れると open に戻る
- 古い項目はプラグインが読まず、lint が警告（`sub-deadline-removed`）を出す。この移行で `end` にまとめる

## スクリプトが行うこと（migrate.mjs）

`issue/i-N.md` のサブのブロックの項目（`<!-- sub-issue` から `-->` まで）について:

- `end` がない: `end` を `deadline`（なければ `soft_deadline`）の日にする。`start` がその日より後なら `start` の日にする（`end` は `start` より前にできない）
- `end` がある: `soft_deadline` / `deadline` を消すだけにする（期間の終わりを期限にする）
- 値が日付として読めない: 消すだけにする
- どれも、消した値を移行の報告に出す（`node .kit/migrate.mjs --dry-run` で先に見られる）
- ほかの項目、本文、改行コード（CRLF も）は変えない。閉じの `-->` がないブロックには触れない。DailyNote には触れない

## スクリプトで扱えない場合（AI が行うこと）

なし。報告の中に、`end` があって期限を消したサブがあれば、ユーザーに伝える（消した期限が `end` より前なら、`end` を直したいか確かめる）。

## 確かめ方（check.mjs）

- `issue/i-N.md` のサブの項目に、`soft_deadline` / `deadline` の行が残っていない
