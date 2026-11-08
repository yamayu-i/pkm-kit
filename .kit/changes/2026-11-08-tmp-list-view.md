## 変更の要約

- pkm-template に一覧 View「Temporary files」を足した（ADR-0045）。コマンド「Open Temporary files」か Cmd+K のダイアログ（pkm-view-selector）から、一覧ペインに開く。`tmp/` の下のすべてのファイル（サブフォルダ・Markdown 以外も）を、名前・種類・更新日時・大きさで出し、既定は更新日時の新しい順
- 名前を押すと開く。HTML は pkm-html で開く。Obsidian が開けない拡張子は、PC では OS の既定のアプリで開く
- 各行の Delete で、確認の後に消す（Obsidian の「削除したファイル」の設定に従う）
- Notes などのほかの一覧は、`tmp/` の下のノートを出さなくなった
- 子への影響: 移行なし。Obsidian で「Open Temporary files」を開き、`tmp/` のファイルが出ること、開けること、Delete で消せること（スマホでも）を確かめる
