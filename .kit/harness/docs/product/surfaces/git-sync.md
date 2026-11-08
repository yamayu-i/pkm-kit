# PKM Git

- 種類: コマンド・リボン
- 開き方: コマンド・リボンの pull / push、コマンド「List unresolved conflicts」「Clone the remote into this vault (first time only)」
- 場面: [端末間の同期](../jobs/sync-devices.md)

## 今の振る舞い

- pull も push も、まず未コミットの変更を snapshot としてコミットする。変更したノートの `updated` はこのとき入る
- pull: 分岐していればファイルごとに 3-way マージ。両側の変更が重なったら、Markdown とテキストはマーカーを入れ、それ以外はリモートを採って手元の版を `(conflict <端末> <日時>)` の名前で残す。削除と編集なら編集を残す。止まらずにマージコミットする
- push: リモートが先に進んでいたらモーダルで知らせて止める（コミットもしない）
- スマホでも動く。トークンは SecretStorage に置く

## 使う概念

[同期と snapshot](../concepts/sync-snapshot.md)

## 根拠

[プラグインの設計と開発](../../plugin-development.md)、[ADR-0028](../../../../src/docs/adr/0028-auto-updated.md)
