## 変更の要約

- PKM Git で、衝突を Obsidian の中で解けるようになった（ADR-0110）
  - マーカー入りのノート: 未解決の一覧の Resolve か、コマンド「Resolve conflicts in this note」で、衝突した箇所ごとに Use local / Use remote / Use both を選び、Apply で書く。開いた後に本文が変わっていたら書かない
  - 別名の版（`… (conflict <端末> <日時>).ext`）: 未解決の一覧の Use this version（元のファイルをこの版の中身にする）か Discard（別名の版を消す）
- ファイルの前の版に戻せるようになった。コマンド「Show file history」か、ファイルのメニューの Git: File history で、そのファイルを変えたコミットを新しい順に出す。Preview で中身を見て、Restore で戻す。戻す前に今の内容を `vault: keep before restore <パス>` としてコミットするので、戻したことも後から戻せる
- 最新の版だけを持つ端末（ADR-0106）では、履歴の始まりで Load older を押すと、30 コミット分ずつ履歴を取り足す
- 子への影響: 移行はない。スマホと PC で、マーカー入りのノートを Resolve で解けること、別名の版を Use this version か Discard で解けること、ファイルの履歴から前の版に戻して、ほかの端末に届くことを確かめる
