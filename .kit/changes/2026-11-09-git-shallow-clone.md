## 変更の要約

- PKM Git の「Clone the remote into this vault (first time only)」が、最新の版だけを取るようになった（shallow clone。ADR-0106）。新しい端末の最初の clone が、履歴の長さ（アセットの古い版の数）によらず、Vault の今の大きさだけを取る
- その端末には clone より前の履歴がない（PC の Git CLI の `git log` にも出ない）。古い版は、全履歴を持つほかの端末と GitHub に残る。全履歴が要るときは、Git CLI で `git fetch --unshallow` を使う
- 子への影響: 移行はない。既に clone してある端末は変わらない。新しい端末で clone するときに、すぐ終わること、その後の同期（送る・受け取る・マージ）が今と同じく動くことを確かめる
