# 2026-11-17 Closing の画面と routine の category

## つまずき

- 起きたこと: クラウドのセッションで `pnpm --filter pkm-task preview:ui` が、Playwright の版に合う Chromium がないと言って止まった。入っている Chromium（`/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`）を `CHROMIUM_PATH` で渡すと通った。product-guide の capture と `verify.mjs --plugin` も同じ
- 改善案: プラグインの設計と開発の「クラウドのセッションでの準備」に、`CHROMIUM_PATH` の渡し方を書く

## つまずき

- 起きたこと: プロダクトの文書に面（`surfaces/task-closing.md`）を足したら、体験定義書の検査が「画面対応がない」「端末の違い がない」で止まった。catalog.json への追加、capture、`product-guide.mjs build` が要った。さらに、build の後に文書を直したため「原本と一致しません」で 2 回目も止まった
- 改善案: dev-implement か、プロダクトの文書の README に「面を足すときは product-guide の README の手順（catalog.json・capture・build）。文書を直したら最後に build」と書く

## つまずき

- 起きたこと: CSS を書いた後で、デザインの検査（大きさは 4 の倍数、余白は space の値）に 8 件当たり、値を直した
- 改善案: デザインルールの部品を足すときの手順（dev-implement の 2）に、`pnpm --filter design test` で CSS を先に確かめると書く
