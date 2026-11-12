## 変更の要約

- **移行 0129-vault-theme-follow**: `.kit-local/theme.json` がある Vault だけ、`node .kit/bin/theme.mjs build` で `pkm-theme-local.css` と `appearance.json` を作り直す。`theme.json` がない Vault では何もしない
- 基本の色の primary を変えた Vault で、上流の紫が残らないようにした（ADR-0129）。primary を変えたモードでは、書いていない次の色を primary から作る。書いた値はこれまでどおり先に使う
  - `secondary-container`（pkm-task の選んだ行・on の絞り込みチップ・今の段階・落とせるグループ、pkm-template の選んだチップ・今週の曜日、スライドの閲覧画面の押したボタン）: 面に primary を 16% 混ぜた色。これまでは薄紫のままだった
  - `on-secondary-container`: その Vault の on-surface
  - `on-primary`（primary のボタン・リボンのバッジの文字、Obsidian の `--text-on-accent`）: 白と暗い文字のうち、比が高い方。これまでダークでは濃い紫のままだった
- ライトの primary だけを書いた Vault では、ダークの primary もライトから作る。これまでは Obsidian のダークの primary が紫のままだった
- Obsidian の中の HTML の閲覧画面（pkm-html）が、この Vault の色で表示される。スライドは primary の系統だけがこの Vault の色になる（面と文字は埋め込んだ上流の色）。書き出した html は上流の色のまま
- Mermaid の図の面・文字・枠が、この Vault の色になる（面などを変えた Vault だけ）
- スライドのビルドは、Vault の primary から作る色を `theme.mjs` と同じ関数で作る。閲覧画面の押したボタンも primary の系統になる
- `theme.mjs build` が規約に合わずに止まったときは、「primary から作った色」を出す。合わない色を `theme.json` に書けば、その値を使う
- 子への影響: 移行あり（上のとおり）。`theme.json` で primary を変えている Vault では、取り込みの `node .kit/bin/slide.mjs build --all`（vault-upgrade の手順）で既存のスライドの `index.html` も変わる（一緒にコミットする）。PC とスマホで確かめること: pkm-task の一覧の選んだ行と絞り込みチップ、pkm-template の選んだチップが薄紫ではなく primary の系統の色になっていること。ダークで primary のボタンの文字が読めること。Obsidian で開いた html と Mermaid の図が Vault の色になっていること
