# 2026-11-08 PKM Updates とリボンのまとめ

## 訂正

- 起きたこと: 最初の ADR では、PKM Updates のリボンのボタンを pkm-updates が自分で登録し、並びは読み込み順に任せるとした。ユーザーから「デイリーノートのボタンのとき（ADR-0029）はどう解決したか。抽象化して汎用的な解決策にできないか」と言われ、全ボタンを pkm-ribbon の並びの表で登録し、バッジの取り決めを足す形に直した
- 改善案: 計画で、既存の ADR が同じ種類の問題をどう解いたかを先に探す。リボンについては、`addRibbonIcon` を pkm-ribbon だけに許す検査（`pkm-ribbon/test/ribbon-owner.test.ts`）を足した

## 食い違い

- 起きたこと: pkm-task の `loadSettings` は pkm-git の端末名を `plugins["pkm-git"].data.deviceName` から読むが、pkm-git は設定を `settings` に持っている（`data` というフィールドはない）。pkm-updates では `settings.deviceName` を読むようにした
- 改善案: 実機で、pkm-task の端末名の初期値が pkm-git から入っているかを確かめる。入っていなければ不具合として Issue にする

## つまずき

- 起きたこと: 開発環境の Node が 22 で、`mise.toml` の 26 と違った（mise もない）。`pnpm check` は通った
- 改善案: 既存の Issue #4・#49 と同じ

- 起きたこと: 新しいプラグインの UI を確かめるとき、Playwright が探す Chromium の版（headless shell 1248）が環境に入っておらず（1243 のみ）、`executablePath` を渡して動かした。pkm-updates には `preview:ui` を作らず、作業用のスクリプトで見た目と画面の検査を確かめた
- 改善案: 新しいプラグインでも使える共通の preview（モックと検査）を design か shared に置くと、プラグインごとに作らずに済む
