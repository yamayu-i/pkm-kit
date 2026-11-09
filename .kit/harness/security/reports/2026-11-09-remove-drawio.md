# セキュリティチェック 2026-11-09（Draw.io 関連の除去）

- 対象 commit: 3bba419
- 前回: 2026-11-09（64627e8）
- 結果: pass

Draw.io の編集画面（外部の origin の iframe）を除き、ビルド設定（`esbuild.config.mjs`）・`security-scan.mjs` の許可の一覧・PKM Git の 3-way マージ（`src/merge/`）を変えたので行った（ADR-0111）。

## 機械的チェック

- `pnpm security:scan`: 8/8 pass。`allow-scripts` の iframe を許すファイルを、なしにした（Draw.io の編集画面の `frame.ts` を消した）。`bins` は `diagram.mjs` だけ
- `pnpm typecheck`・`pnpm build`: 成功。テストは `pnpm -r --workspace-concurrency=1 test` で全パッケージ成功。`node --test .claude/scripts/test/*.test.mjs`: 125 件成功。`node .claude/scripts/verify.mjs`: すべて成功
- `pnpm --filter pkm-diagram preview:ui`: 問題なし
- `pnpm outdated`: 出力なし

## 目視レビュー

- **通信**: pkm-diagram は外部の origin（embed.diagrams.net）を読まなくなり、`postMessage` も使わない。bundle のテストで、`diagrams.net`・`allow-scripts`・iframe を作るコードがないことを確かめる: 問題なし（攻撃面が減った）
- **ファイル書き込み**: Draw.io の編集の保存（`vault.process` で図を書き換える経路）がなくなった。残る書き込みは前回の段階 2 と同じ（PNG の保存、tmp/ への書き出し）: 問題なし
- **データ消失（PKM Git）**: 行単位でマージしない扱いを `.drawio.svg` / `.drawio` から `.svg` 全体にした。両側が変えたらリモート版を採り、ローカル版を `<名前> (conflict …).svg` に別名で残す（どちらも捨てない）。片側だけの変更・同じ変更はそのまま採る。テストで確かめた。衝突の別名は最後の拡張子の前に付ける（以前の `.drawio.svg` は `<名前>.drawio (conflict …).svg` になる）: 問題なし
- **HTML の書き出し（pkm-html）**: `.svg` 全体に `toSharingSvg` をかける（普通の SVG は変わらない）。ルートを読めない SVG は、編集用 XML を持つものは埋め込まず、それ以外はそのまま埋め込む（その後の既存の検査は同じ）: 問題なし
- **UI**: 操作バーから Edit を除いただけ: 問題なし
- **サプライチェーン**: 依存の追加・変更なし（lockfile は変わらない）。バンドル: pkm-diagram 62,951 バイト（前回 88,905 バイト。編集画面と通信を除いた分）、pkm-git 733,975 バイト、pkm-html 33,801 バイト（どちらもわずかに減った）

## 依存

- 追加なし

## 対応したこと / 残課題

- 残課題: 実機で、以前の .drawio.svg が表示・コピー・拡大できること、同期で SVG の図の衝突が別名で残ることを確かめる
