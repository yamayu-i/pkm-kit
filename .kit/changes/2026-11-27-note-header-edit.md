## 変更の要約

- note・source・wiki のページ（concept・entity・topic・answer）のヘッダーで、表示している項目をその場で直せるようにした（ADR-0238）。値のすぐ右の鉛筆のボタンを押すと、その項目だけが入力欄になる。Enter（Sources は Ctrl/Cmd+Enter）か欄を離れると保存、Escape で取り消し
- 直せる項目: タイトル（`title`）、note の Tags、source の Origin・Retrieved、wiki のページの Sources。Created・Cited by・Backlinks と daily は今までどおり表示だけ
- 直せる項目は、値が空でも「Not set」で行を出す（テンプレートで空の `origin` を入れられるように）
- 書き込みは Obsidian の `processFrontMatter` で、その項目だけを変える。frontmatter のほかの項目の引用符の付け方が変わることがある（値は変わらない）
- 子への影響: 移行なし
