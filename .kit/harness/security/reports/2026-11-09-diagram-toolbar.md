# セキュリティチェック 2026-11-09（図の操作バー・PNG の保存・拡大表示）

- 対象 commit: cae734e
- 前回: 2026-11-09（da601b6）
- 結果: pass

pkm-diagram に、PNG をファイルに書く処理（保存のダイアログ・共有シート・`tmp/`）と、ノートの Mermaid の図の DOM を写す処理を足したので行った（`src/obsidian/` のファイル書き込みの変更。ADR-0102 の段階 2）。

## 機械的チェック

- `pnpm security:scan`: 8/8 pass
- `pnpm typecheck`・`pnpm build`: 成功。テストは `pnpm -r --workspace-concurrency=1 test` で全パッケージ成功（pkm-diagram は 111 件。d2 の実描画の 1 件は `D2_BIN` がないので動かない）。`node .claude/scripts/verify.mjs`: すべて成功
- `pnpm --filter pkm-diagram preview:ui`: 問題なし（操作バー 3 種類、拡大表示、Mermaid の PNG を含む）
- `pnpm outdated`: 出力なし

## 目視レビュー

- **認証情報・通信**: 触れていない。新しい通信はない（拡大表示は Vault のファイルの URL か SVG の data URI を `<img>` に出すだけ）: 問題なし
- **ファイル書き込み**:
  - 保存のダイアログ（`showSaveFilePicker`）は、ユーザーが場所を選んだファイルにだけ書く。取り消し（AbortError）なら何もしない
  - 共有シート（`navigator.share`）は、OS に PNG を渡すだけで、プラグインは書かない
  - `tmp/` は `vault.adapter` で、`normalizePath` した `tmp/<名前>.png` に書く。名前は `pngFileName` で、パスの区切り（`/`・`\`）と使えない文字を `-` にするので、`tmp/` の外に出ない。既存のファイルは上書きせず、番号を付けた別名にする
  - 問題なし
- **データ消失**: 既存のファイルを上書きする経路はない（上の通り）: 問題なし
- **DOM**: Mermaid の図は `cloneNode` で写したものだけを変え、ノートの DOM は変えない。写した SVG は `<img>` の data URI か Canvas でだけ使い、DOM に HTML として入れない。ラベルは `textContent` で `<tspan>` に入れる。拡大表示・操作バーのボタンは `createEl` と `setIcon` で作る: 問題なし
- **SVG の読み込み**: PNG を作るときは、`<img>` に data URI で読む（スクリプトは動かない）。ダークの `@media` を除く処理は `<style>` の中身の文字列だけを扱う: 問題なし
- **サプライチェーン**: 依存の追加・変更なし（lockfile は変わらない）。バンドル: pkm-diagram 82,732 バイト（前回 61,142 バイト。拡大表示・保存・Mermaid の写し・計算の 5 つのモジュールを足した分）

## 依存

- 追加なし

## 対応したこと / 残課題

- 残課題: 実機で、保存のダイアログ（PC）と共有シート（モバイル）が開くこと、本物の Mermaid の図の写しの見た目を確かめる
