## 変更の要約

- **移行 0190-sub-end-as-due**: サブイシューの `soft_deadline` / `deadline` を `end` にまとめる。`end` がなければ `deadline`（なければ `soft_deadline`）の日を `end` にし、あれば期限を消すだけにする（ADR-0190）
- サブイシューから `soft_deadline` / `deadline` をなくした。サブの期限は `end`（期間の終わり）が兼ねる。issue の `soft_deadline` / `deadline` は変わらない
- Daily の Calendar の段階で、Overdue / Due soon に、サブを `end` で出す（issue の deadline / soft_deadline の表の下の「end」の表）
- サブを someday にすると、Calendar の日と期間（`start` / `end`）を外す。someday のサブに期間を入れる（Timeline で棒を作るのを含む）と open に戻る。canceled にしても期間は残す
- Edit のダイアログと本文のカードから Soft deadline / Deadline の欄を、Timeline から期限の印（amber / red の線）をなくした
- MCP の `create_sub_issues` / `update_sub_issue` は `soft_deadline` / `deadline` を受け付けない（`end` を使うよう、エラーで返す）
- md に古い項目が残っていると、lint が警告（`sub-deadline-removed`）を出す
- 子への影響: 移行 0190 が issue の md のサブの項目を書き換える。報告に「end … を期限にする」と出たサブ（`end` があって期限を消したもの）は、`end` でよいかを確かめる。移行の後、Daily の Overdue / Due soon に、`end` を過ぎた・近いサブが出ることを確かめる
