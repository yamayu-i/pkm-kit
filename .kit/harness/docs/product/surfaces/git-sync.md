# PKM Git

- 種類: コマンド・リボン・ステータスバー
- 開き方: リボンの Git: Sync、コマンド「Sync now」「Keep this version」「Show sync log」「List unresolved conflicts」「Resolve conflicts in this note」「Show file history」（ファイルのメニューの Git: File history も）「Clone the remote into this vault (first time only)」。以前の「Pull」「Push (commit and send)」も同期になる
- 場面: [端末間の同期](../jobs/sync-devices.md)

## 今の振る舞い

- 自動で同期する。画面を表示している間は一定の間隔（既定 5 分。設定で変える。0 で止める）、戻ってきたとき、起動したとき。バックグラウンドでは同期しない
- 1 回の同期で、取り込んでから送る。他の端末と送るのが重なったら、取り込み直して 3 回まで送る
- Git のコミットは、同期でリモートに届いたときと「Keep this version」のときだけ作る。オフラインではコミットせず、つながったときに 1 つの snapshot にまとまる。変更したノートの `updated` は snapshot のときに入る
- 保存のたびの細かな版は、Obsidian のコアプラグイン「ファイル回復」が端末内に持つ
- clone は最新の版だけを取る。新しい端末の最初の clone は、履歴の長さによらず Vault の今の大きさだけを取る。その端末には clone より前の履歴がなく、古い版はほかの端末と GitHub にある（[ADR-0106](../../../../src/docs/adr/0106-git-shallow-clone.md)）
- 分岐していればファイルごとに 3-way マージ。両側の変更が重なったら、Markdown とテキストはマーカーを入れ、それ以外はリモートを採って手元の版を `(conflict <端末> <日時>)` の名前で残す。削除と編集なら編集を残し、その記録（`.pkm-git/conflicts/`）をマージコミットに入れる。止まらずにマージコミットする。共通祖先が複数あれば、祖先によって違うファイルは衝突として両方を残す（[ADR-0103](../../../../src/docs/adr/0103-git-conflict-records.md)）
- ステータスバー: Git: Synced（共有済み）、Not synced（共有待ち）、Syncing…、Offline、Check connection（認証・接続先）、Sync failed。未解決のコンフリクトがあれば ` · ⚠ N`。押すと一覧を開く。削除と編集の衝突の行には Keep（ファイルを残す）と Delete（ファイルを消す）があり、押すと記録を消して同期する。ファイルがもうない記録は自動で消える。マーカー入りのノートの行の Resolve は、衝突した箇所ごとに Use local / Use remote / Use both を選んで解く（開いた後に本文が変わっていたら書かない）。別名の版の行には Use this version（元のファイルをこの版にする）と Discard（別名の版を消す）がある（[ADR-0110](../../../../src/docs/adr/0110-git-resolve-and-history.md)）
- ファイルの履歴: そのファイルを変えたコミットを新しい順に、日時・端末・種類（Synced / Kept / Merged / Other）で出す。Preview で中身を見て、Restore で前の版に戻す。戻す前に今の内容を `keep before restore` としてコミットするので、戻したことも後から戻せる。最新の版だけを持つ端末では、Load older で 30 コミット分ずつ履歴を取り足す
- 自動の同期では、成功とオフラインでは通知しない。新しいコンフリクトと、接続の確認（起動から 1 回）は通知する
- 取り込みの途中でアプリが終わっても、次の同期の始めに続きから直す
- 失敗と自動の回復は、端末ごとに `.git/pkm-git/log.jsonl` に残る。「Show sync log」で見て、コピーできる
- スマホでも動く。トークンは SecretStorage に置く

## 使う概念

[同期と snapshot](../concepts/sync-snapshot.md)

## 根拠

[プラグインの設計と開発](../../plugin-development.md)、[ADR-0028](../../../../src/docs/adr/0028-auto-updated.md)、[ADR-0089](../../../../src/docs/adr/0089-git-auto-sync.md)
