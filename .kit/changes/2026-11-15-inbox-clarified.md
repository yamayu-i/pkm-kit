## 変更の要約

- **移行 0148-inbox-clarified**: `open` で `scheduled`・`soft_deadline`・`deadline` のどれかがある issue に `clarified: true` を足す（見た目を変えない）。日付のない `open` の issue は変えない
- Inbox を日付ではなく `clarified`（整理済みか。真偽値）で決めるようにした（ADR-0148）。Inbox は「`open` で `clarified` でない issue」。締切だけ決まっていて中身が曖昧な issue も Inbox に入り、整理済みで日付のない issue は Inbox に出ない
- Organize: → を Next（日付を決めずに整理済みにする）にした。Later（何も決めずにキューから外す）をなくした。Do Date はボタンで選び、整理済みにもする。Do Date で estimated を求めなくなった
- 「Inbox に戻す」（一覧・ボードの持ち越し・MCP の `carry_issues`）は、`clarified` を外すだけで、予定と期限を残すようにした
- issue 画面の status の横に `Inbox` / `Clarified` の切り替えを足した（open のときだけ）
- MCP: `create_issue` と `update_issue` が `clarified` を受け付ける（`false` / `null` で Inbox に戻す）。`list_issues(inbox_only: true)` は新しい定義の Inbox を返す
- サブイシューは Inbox・Organize の対象にしない（サブの整理は親の issue 画面で行う）
- 子への影響: 移行 0148-inbox-clarified がある。issue の frontmatter を書き換えるので、取り込む前にすべての端末で同期を済ませる。子だけのスキルや `local/CLAUDE.md` が Inbox を「日付のないもの」として扱っていれば直す。Organize の Later（↑）がなくなったので、迷うものは Someday か Next にする
