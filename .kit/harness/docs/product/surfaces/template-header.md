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
