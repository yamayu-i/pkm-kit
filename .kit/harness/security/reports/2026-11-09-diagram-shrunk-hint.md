# セキュリティチェック 2026-11-09（縮めすぎて読めない図の印）

- 対象 commit: 1eed41b
- 前回: 2026-11-09（64627e8）
- 結果: pass

pkm-diagram の `src/obsidian/` に、ノートの図を見張って印のクラスを付け外しする処理を足したので行った（ADR-0102 の段階 3）。

## 機械的チェック

- `pnpm security:scan`: 8/8 pass
- `pnpm typecheck`・`pnpm build`: 成功。テストは `pnpm -r --workspace-concurrency=1 test` で全パッケージ成功（pkm-diagram は 113 件。d2 の実描画の 1 件は `D2_BIN` がないので動かない）。`node .claude/scripts/verify.mjs`: すべて成功
- `pnpm --filter pkm-diagram preview:ui`: 問題なし（印が横に長い図だけに出て、読める幅で消える）
- `pnpm outdated`: 出力なし

## 目視レビュー

- **認証情報・通信**: 触れていない: 問題なし
- **ファイル書き込み**: ない。SVG の図は `vault.cachedRead` で読むだけ: 問題なし
- **DOM**: Obsidian の描いた DOM には、図を囲む要素の `vt-diagram-shrunk` のクラスの付け外しだけを行う。要素を足さず、HTML を入れない。印の文言は CSS の `content` の固定の文字列。プラグインを止めると、見張りをやめてクラスを外す: 問題なし
- **負荷**: DOM の変化は 300ms おきにまとめて探し、見張りは表示の幅が変わったときだけ計算する。消えた図は見張りをやめる: 問題なし
- **サプライチェーン**: 依存の追加・変更なし。バンドル: pkm-diagram 88905 バイト（前回 82732 バイト。印の処理の分）

## 依存

- 追加なし

## 対応したこと / 残課題

- 残課題: 実機（PC の狭いペイン・広いペイン、モバイル）で、横に長い図に印が出て、読める図には出ないことを確かめる
