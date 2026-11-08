## 変更の要約

- pkm-task の issue・routine・member の画面のヘッダーが、ページの一番上（ノートのヘッダーと同じ位置）に出るようになった。リーディングビューにも出て、そこでも status・日付・worklog などを編集できる（ADR-0077）
- ヘッダーを差し込む仕組みを pkm-task と pkm-template で共通にした。pkm-template のノートのヘッダーの見た目と振る舞いは変わらない
- 子への影響: 移行はない。各端末（スマホを含む）で Obsidian を開き直し、issue・routine・member を Live Preview とリーディングビューで開いて、ヘッダーが一番上に出ること、Properties 欄と生の frontmatter が出ないこと、ヘッダーの入力（日本語の入力を含む）がエディタに取られないことを確かめる
