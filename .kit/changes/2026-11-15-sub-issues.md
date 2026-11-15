## 変更の要約

- issue の md の中に、サブイシューを持てるようにした（ADR-0135）。本文の末尾に、サブ 1 件ごとに `<!-- sub-issue ... -->` のブロック（中は YAML）を置き、その後ろにサブの本文を書く。並びは md に書いた順。サブの外からは合成キー `i-12#k3f9a2` で指す
- `node .kit/bin/lint.mjs .` が、サブの書式・id の重なり・`depends_on` の誤り（ない依存先・自分自身・循環）をエラーにし、依存先の `end` より前の `start` を警告にする
- サブでタイマーを始めると、worklog の行に `sub`（サブの id）が付く。`sub` のない既存の行はそのまま。open のサブは in-progress になり、親の status は変わらない。親の再生ボタンは、親に直接付けた記録だけを見る
- 親の実績は、親に直接付けた分とサブの分の合計（重なりは 1 回だけ数える）。サブの status の変化は statuslog に `task` と `sub` で記録する
- MCP: `create_sub_issues`・`update_sub_issue`・`move_sub_issue`・`delete_sub_issue` を足した。`get_issue` はサブの一覧と、親に直接付けた実績（`directEffortMinutes`）を返す。`start_timer` / `stop_timer` はサブを合成キーで指す
- MCP の `create_issue`・`update_issue`・`list_issues` から `parent` を外した（渡すとエラー）。`get_issue` は `ancestors`・`children` を返さない。スキル `task-coach` は、大きい issue をサブイシューに分けるよう提案する
- 子への影響: この時点では移行はない。既存の `parent` を持つ issue は、親子関係の削除と移行（#139）で親のサブに変える
