# 2026-11-16 status の遷移表とボタン

## 訂正

- 起きたこと: ユーザーが示した遷移の図に「in-progress ⇄ waiting / delegated」がはっきり書かれていたのに、計画の確認事項で「in-progress の基本のルートに waiting を入れるか」を質問した。ユーザーに「当然行き来できる。なぜこの質問が来るのか分からない」と言われた
- 改善案: 確認事項を出す前に、ユーザーが示した図や表から答えが読めないかを確かめる（dev-plan の「確認したいこと」に、示された資料で答えが出るものは聞かないと足す）

## つまずき

- 起きたこと: 「status は遷移表の先だけ」と規則を決めた後に、status を変える操作（一括の Close・Inbox に戻す・持ち越しの Inbox）を洗い出し、表と食い違うことが分かって、もう一度ユーザーに確かめた。最初の計画で、画面の status のメニューだけでなく、status を書く操作の呼び出し元（`closeIssues` など）を全部挙げていれば、1 回の確認で済んだ
- 改善案: status のような横断的な規則を決める計画では、値を書く関数の呼び出し元をすべて検索して、計画の表に入れる（2026-11-16-pick-in-progress-and-watch の訂正と同じ型）

## 食い違い

- 起きたこと: ADR-0031 の「次の status」（`nextStatuses`）は ADR-0137 でボードから外れ、どの画面からも使われていないのに、ADR-0184 が「カードの次の status と同じ」と参照していた
- 改善案: 関数を使わなくしたら、関数と、それを参照する ADR の記述も同じ変更で消す（ADR-0183 で消した）

## 食い違い（2）

- 起きたこと: 概念の文書（task-tickler）は「日付が来ると Inbox に戻る」としていたが、`isInbox` は open だけを見るので、in-progress・待ちに付けた Tickler は日付が来ても戻らず、`isNext` も Tickler のあるものを外すため、どこにも出なくなっていた。#184 で Pick に in-progress が入り、Pick の一括の Tickler から起きやすくなっていた。ユーザーとの見直しで見つけた
- 改善案: 日付や状態で一覧の出し入れを決める述語（`isInbox`・`isNext` など）を変えたら、すべての status と日付の項目の組み合わせで「どこかの一覧に出るか」を確かめるテストを持つ（ADR-0183 で Tickler は open だけにし、lint で残りを知らせるようにした）

## つまずき（2）

- 起きたこと: Today の段階（Previous boards）をなくしたときに、体験定義書の画面例を撮る product-guide（`catalog.json`・`preview/fixture.tsx`・`preview/capture.mjs`）にその段階が残っていて、CI の preview-ui が落ちた。手元の検査（`pnpm check`・`verify.mjs`・pkm-task の `preview:ui`）は通っていた。また、撮り直した直後の `capture --check` で、同じ環境でも `task--header--unpicked` の見積もりの欄の枠線の数ピクセルが撮るたびに揺れ、固定環境の画像の比較が落ちることがあった（今回の変更とは関係しない。CI はブラウザの版が違うので画像を比べない）
- 改善案: dev-implement の検査に「画面・段階・View を足す・消すときは `pnpm --filter product-guide capture --check` も通す」と書く。枠線の揺れは、画像の比較に小さな許容差を持たせるか、その欄の撮り方を固定する
