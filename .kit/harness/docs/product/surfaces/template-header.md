# ノートのヘッダー

- 種類: 画面（ノートの一番上）
- 開き方: daily、note、source、concept、entity、topic、answer のノートを開く。それ以外はタイトルだけ
- 場面: [ノートを書き始める](../jobs/note-write.md)、[前に書いたノートを探す](../jobs/note-find.md)

## 今の振る舞い

| type | 出すもの |
|---|---|
| daily | `2026-11-01 SUN` の形の日付と、日曜始まりの 7 枠（その日を強調。表示だけ） |
| note | タイトル、Tags、Created |
| source | タイトル、Origin（リンク）、Retrieved、取り込み先の wiki のページ |
| concept / entity / topic / answer | タイトル、Sources、このページを指すリンクの数 |

- 表示だけ。ヘッダーのある type では Properties 欄を隠し、frontmatter はソースモードで編集する
- Obsidian 標準のタイトルは隠している

## 使う概念

[ノートの type](../concepts/note-type.md)

## 根拠

[ADR-0026](../../../../src/docs/adr/0026-note-views.md)、[ADR-0027](../../../../src/docs/adr/0027-hide-properties-english-labels.md)

## 入力と制約

frontmatter の type に応じた表示です。値のない項目は出しません。daily の日付はファイル名から決めます。

## 操作と保存

表示だけのヘッダーです。リンクを押すと出典や引用先のノートへ移動します。daily・note・source・wiki では代わりに Properties 欄を隠します。

## 失敗時と戻し方

タイトルが想定と違うときは type・title とファイル名を確認します。存在しない出典は文字として残る場合があり、正本の sources を修正します。

## 端末の違い

PC とスマホ、Reading View と Live Preview で同じ情報を読みます。ソースモードでは frontmatter をそのまま確認できます。
