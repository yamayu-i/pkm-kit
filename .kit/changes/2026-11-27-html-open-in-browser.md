## 変更の要約

- pkm-html: スライド以外の HTML にも「Open in browser」（タブの右上のボタン、ファイルのメニュー、コマンド）を出すようにした（ADR-0253）。Obsidian の中ではスクリプトや外部の資源が欠けるので、元の見た目は OS のブラウザで確かめる
- コマンドの名前を「Open slide in browser」から「Open in browser」にした。ID（`open-slide-in-browser`）は変えていないので、ホットキーはそのまま使える
- 子への影響: 移行なし。スマホでは、これまでどおり開けない旨の通知が出る
