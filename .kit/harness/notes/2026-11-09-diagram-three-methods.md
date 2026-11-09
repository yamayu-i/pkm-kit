# 2026-11-09 図の 3 方式と pkm-diagram への改名

## つまずき

- 起きたこと: クラウドのセッションで `pnpm check` を実行すると、テストの段階で pkm-diagram と design の vitest が `ENOTEMPTY: rmdir node_modules/.vitest-cache` で始まらず、ほかのパッケージは SIGKILL で止まった。`pnpm -r --workspace-concurrency=1 test` にすると全パッケージが通った。並列に動く vitest が同じキャッシュのフォルダを消し合うことと、メモリ不足が重なったと見られる
- 改善案: プラグインの設計と開発の文書の「クラウドのセッションでの準備」に、テストは `--workspace-concurrency=1` で実行すると書く。または vitest のキャッシュのフォルダをパッケージごとに分ける

## 移行

- 起きたこと: プラグインの ID を改名すると、前の移行（0064）が旧 ID を足す移行だったため、新しい Vault（fresh の fixture）で 0064 が旧 ID を足し直し、「新しい Vault では何も変えない」に反しそうになった。0064 の判定に「後継の ID があれば終わったものとする」を足して避けた
- 改善案: 移行の書き方に「プラグインの ID を足す移行は、後で改名されることがある。改名する移行を書くときは、前の移行の判定に後継の ID を足す」と書く

## 食い違い

- 起きたこと: ADR-0102 では、Mermaid の PNG を Obsidian の `loadMermaid` で描き直して作るとした。実装の段階で、描き直すにはノートの中の元のコードを特定する必要があり、Reading view（後処理の `getSectionInfo`）と Live Preview（エディタの位置）で手段が違い、どちらも Obsidian の内部に依存すると分かった。表示中の SVG を写し、計算済みの色を書き込み、`foreignObject` を `<text>` に置き換える方法にした（結果は同じで、ダークでもライトの色になることを preview で確かめた）
- 改善案: ADR で実装の手段まで決めるときは、Obsidian の API で元のデータに届くかを先に確かめる。今回の判断は plugin-development.md の pkm-diagram の節に書いた

## つまずき

- 起きたこと: preview の fixture で、Mermaid の SVG を `innerHTML` で入れたら、`foreignObject` の中の `<div>`・`<p>` が HTML の構文解析で SVG の外に出て、操作バーの検査が通らなかった。`DOMParser`（`image/svg+xml`）で読んで `importNode` すると、Obsidian と同じ形になった
- 改善案: なし（fixture にコメントを書いた）
