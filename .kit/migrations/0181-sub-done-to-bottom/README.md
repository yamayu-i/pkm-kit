# 0181: 終わったサブを md の末尾へ集める

## 何が変わったか

`.kit/src/docs/adr/0181-sub-done-to-bottom-and-hidden.md`。

- サブの status を closed / canceled にすると、そのサブのブロック（項目と本文）を、md の末尾へ送る。open などに戻しても位置は動かさない
- issue の本文（Live Preview / Reading）では、終わったサブのカードと本文を隠し、最後のサブの下の「Show N closed」を押すと出る（ヘッダーの Sub-issues と同じ。状態は保存しない）
- すでに終わっているサブも同じ並びにするため、この移行で末尾へ集める

## スクリプトが行うこと（migrate.mjs）

- `issue/i-N.md` のサブのブロックのうち、`status` が closed / canceled のものを、元の順のまま末尾に移す。終わっていないサブも元の順を保つ
- 本文、ブロックの中身、改行コード（CRLF も）は変えない。DailyNote には触れない
- 閉じの `-->` がない・`status` が読めないブロックは、終わっていないものとして、その場に残す
- `node .kit/migrate.mjs --dry-run` で、移す issue を一覧にする

## スクリプトで扱えない場合（AI が行うこと）

なし。

## 確かめ方（check.mjs）

- `issue/i-N.md` に、終わったサブが終わっていないサブより前にあるものが残っていない
