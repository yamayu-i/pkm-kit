# ADR-0008: UI は Preact。issue 画面は CodeMirror の widget

- 状態: 承認
- 日付: 2026-10-31

## 決定

- 宣言的 UI として `preact` を依存に追加する（バージョン固定）。JSX は esbuild で変換する。htm や signals は入れない（状態は `preact/hooks`）
- View は `onOpen` で描画し、`onClose` で後片付けする
- Modal・Menu・Notice・`setIcon` は Obsidian のものを使う
- issue 画面のヘッダー（ID、summary、status など本文より上の部分）は、CodeMirror の block widget として文書の先頭に差し込む。本文はふつうのエディタで編集する
- `type: issue` のノートでは、Properties 欄を `cssclasses` と CSS で隠す

## 理由

- View が 7 つ以上あり、どれもフィルターや選択などの状態を持つ。`createEl` で手続き的に組むと保守がつらい
- Preact は小さい（gzip で約 4KB）
- Obsidian には「md を開いたまま上に独自 UI を載せる」公式 API がない。block widget なら Live Preview とモバイルでも動き、本文の編集はそのままできる

## 却下した案

- **サイドパネルに表示する**：一番堅く作れるが、モバイルではドロワーになって使いにくい
- **独自の View の中にエディタを埋め込む**：エディタを埋め込む公開 API がない
- **React**：大きい

## 影響

- 依存の追加なので、コミット前にセキュリティチェックを行う
