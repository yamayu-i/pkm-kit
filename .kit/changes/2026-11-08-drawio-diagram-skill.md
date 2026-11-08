## 変更の要約

- 新しいスキル **drawio-diagram**（ADR-0085）。Claude Code が図（`asset/*.drawio.svg`）を作る・直す・読み取る。座標・大きさ・矢印の経路は CLI が計算し、LLM は何をどうつなぐかだけを短い JSON に書く
- CLI `node .kit/bin/drawio.mjs` にコマンドが増えた。どれもネットワークを使わず、同じ入力からは同じファイルを作る
  - `build <spec.json|->`: JSON（ノード・辺・グループ・向き・ページ）から、層に分ける配置（か格子・座標の指定）で、編集用 XML と描画を作る
  - `render <図|.drawio|.xml>`: 編集用 XML から描画を作り直す（XML は変えない）
  - `inspect <図>`: ページ・セル・辺・描けない書式を短く出す
  - `extract --plain`: Draw.io が圧縮したページを展開して出す
- 描画は自前で、Draw.io と細部が違うことがある。pkm-drawio で開いて保存すると Draw.io の描画になる
- 規約（`.claude/docs/vault-conventions.md`）: 図を変えるのは Draw.io か、Claude Code なら `build` / `render` を通す。進め方（`.claude/docs/workflow.md`）: wiki の操作の中で新しく作る図はそのコミットで main に、それ以外はブランチで PR（`docs(diagram):`）
- 子への影響: 移行はない。取り込んだ後、Claude Code に図を頼み（「〇〇のフロー図を描いて」）、ノートで図が見えること、pkm-drawio の「編集」で開いて保存すると Draw.io の描画に変わり、内容（ノード・辺・ラベル・グループ）が保たれていることを確かめる（モバイルでも図が見えること）
