# 2026-11-08 issue / routine / member のヘッダーの方式（Issue #16）

## 食い違い

- 起きたこと: Issue #16 は ADR を書く想定だが、ADR-0056 の「ADR の番号は Issue の番号」に従うと `0016` になり、既存のプラグインの ADR-0016（デザインの統制）と重なる。ADR-0056 は既存の 0001〜0038 を変えないとだけ書いていて、番号が 38 以下の Issue で ADR を書くときの扱いがない
- 改善案: ADR-0056 か dev-plan に「Issue の番号が既存の ADR と重なるときは、ADR 用に新しい Issue を作り、元の Issue から参照する」と書く

## 食い違い

- 起きたこと: Issue #16 の本文は vault-task / vault-template と ADR-0008・0012・0018 だけを挙げていた。実際は名前が pkm-task / pkm-template に変わり（ADR-0058）、member のヘッダー（ADR-0035）も同じ widget の方式になっていたので、置換の範囲は 0035 も含む
- 改善案: なし（Issue を検討するときに、関連する ADR を `grep` で洗い直す）
