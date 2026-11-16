# 2026-11-16 issue のプリセット

## 訂正

- 起きたこと: プリセットの保存先を `issue/labels.json` にならって `issue/presets.json` にし、Labels のような下書き・Save の編集画面で本文を textarea で書く案を出し、承認を得て実装した。実装の途中で、ユーザーから「プリセットは md ファイルで管理し、issue と同じく独自の UI を埋め込む。プリセットの ListView を作り、そこから作成できるように」と直された
- 改善案: Markdown の本文を持つデータは、JSON + 入力欄ではなく「md + 埋め込みのヘッダー」（issue・routine・member と同じ形）を既定の候補にする、と `plugin-development.md` か ADR の書き方に書く。計画の確認の質問では、保存の形（md か JSON か）を選択肢として明示して聞く

## つまずき

- 起きたこと: 新しい View を足すと、体験定義書の検査（`登録された View の説明がない`）で止まった。面の文書・`catalog.json`・画面例の画像（`pnpm --filter product-guide capture`）が要る。capture はすべての画面を撮り直すので、別の環境（macOS で撮った既存の画像）では全画像が変わる。新しい画面の画像だけを残し、manifest に追記した
- 改善案: capture に、指定した画面だけを撮って manifest に追記するオプション（`--only=` の拡張）を足す。新しい View を足すときに要るものを `plugin-development.md` に書く
