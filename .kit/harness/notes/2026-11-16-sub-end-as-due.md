# 2026-11-16 サブの期限を end にまとめる

## つまずき

- 起きたこと: クラウドの環境で `pnpm --filter pkm-task preview:ui` が、Playwright の版に合う headless shell がないため起動しなかった。`preview.mjs` のコメントにある `CHROMIUM_PATH` に、手元にある Chromium（`/opt/pw-browsers/chromium-*/chrome-linux64/chrome`）を渡すと動いた
- 改善案: 上流のハーネスの「コマンド」か、プラグインの設計と開発の文書に、`CHROMIUM_PATH` の使い方を 1 行書く

## つまずき

- 起きたこと: preview の fixture で、Timeline を撮る i-2 に過去の期間のサブを足すと、`run/target-size` の検査が棒に掛かった。棒の位置を変えても別の棒に移り、原因（左に固定した題の列との重なりか、依存の矢印か）は確かめていない。fixture では、期限切れのサブを Timeline を撮らない別の issue に置いて避けた
- 改善案: 過去の日の棒が題の列の下に隠れて押せないことがないか、Timeline で確かめる（実機で問題があれば Issue にする）
