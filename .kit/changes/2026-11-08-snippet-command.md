## 変更の要約

- pkm-template: スニペットの frontmatter に任意の `command`（Obsidian のコマンドの ID。例: `pkm-drawio:create-diagram`）を書けるようにした（ADR-0094）。`command` のあるスニペットを選ぶと、本文は挿入せず、打った `/…` を消してそのコマンドを実行する。実行できない（プラグインが無効など）ときは、打った文字を戻して通知する。インラインテンプレート（`@`）では使わない
- 上流の既定のスニペット `drawio`（`new-drawio`）を足した。行頭で `/drawio` を打って選ぶと、pkm-drawio の「New diagram」で図の名前を尋ねて Draw.io の編集画面を開き、保存すると打った位置に `![名前](asset/<名前>.drawio.svg)` が入る
- 子への影響: 移行はない。各端末で Obsidian を開き直し、行頭の `/drawio` で図を作れること・参照が打った位置に入ることを確かめる（モバイルでも）
