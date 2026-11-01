# ADR-0027: 専用ヘッダーのある type は Properties 欄を隠し、ラベルを英語にする

- 状態: 承認
- 日付: 2026-11-01

## 背景

[ADR-0026](0026-note-views.md) で、ノートのヘッダーは表示のみにし、Properties 欄は隠さず、編集は Properties で行うと決めた。実際に使うと、ヘッダーと Properties 欄に同じ項目(created、tags、sources など)が二重に出て、ページの先頭が散らかる。

## 決定

- 専用のヘッダーが frontmatter の主な項目を表示する type(daily、note、source、concept、entity、topic、answer)では、Obsidian の Properties 欄を隠す。それ以外の type と、型のないノートでは隠さない
- ヘッダーと一覧 View のラベルは英語にする(Created、Tags、Origin、Retrieved、Cited by、Sources、Backlinks、Title、Date、Imported)。タイトルと値は日本語のままでよい
- 隠した type の frontmatter は、ソースモードで YAML のまま編集する。隠すのは `.metadata-container`(壊れた YAML のエラー表示 `.mod-error` は隠さない)

## 理由

- ヘッダーが同じ情報を見やすく出すので、Properties 欄は重複になる
- ラベルは短い英語の方が、ヘッダーの見た目に合う

## 却下した案

- **全ノートで Properties 欄を隠す**: 専用のヘッダーがないノートでは、frontmatter を見る手段がなくなる
- **ヘッダーから frontmatter を編集する**: ADR-0026 で却下した理由(daily の `board` など vault-task 管理の項目との衝突)が変わらない

## 影響

- ADR-0026 の「Properties 欄は隠さない」「編集は Properties で行う」を置き換える(一部置換)
- 隠した type の frontmatter を直すには、ソースモードに切り替える必要がある
- Obsidian の内部の CSS クラス(`.metadata-container`)に依存する。Obsidian の更新時に見た目を確かめる
