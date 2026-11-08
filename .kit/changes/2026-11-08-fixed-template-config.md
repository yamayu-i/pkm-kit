## テンプレートの設定を上流で固定する（設定タブと template/config.json をなくす）

- **移行 0061-fixed-template-config**: 子の `template/config.json` を消す。テンプレートの表示順・モーダルに出すか・生成先フォルダ・初期ファイル名パターンは、上流の `.kit/templates/config.json` だけで決める。生成先は規約・pkm-task・検査が前提にしているため、Vault ごとに変えない（ADR-0061）。書かれていた値は、移行の出力に「捨てる値」として出る。読めない `template/config.json` は消さずに止まる
- pkm-template の設定タブをなくした
- テンプレートの中身（`template/file/<type>.md`）は今までどおり使える。その Vault だけのテンプレートは一覧の末尾に出て、Vault ルートにタイトルのファイル名で作られる
- 子への影響: 移行 0061 を実行する。捨てる値があれば、生成先や表示順が上流の既定に戻る。その Vault だけの type に生成先が要るなら、escalate で上流に足すよう伝える。pkm-template の `main.js` が変わった。モバイルで、新規作成モーダルと「今日のデイリーノートを開く」が今までどおり動くことを確かめる
