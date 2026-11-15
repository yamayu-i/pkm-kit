## 変更の要約

- **移行 0135-sub-issues**: `parent` を持つ issue（子と孫）を、いちばん上の祖先の md の中のサブイシューにし、子のファイルを消す。写さない項目（`priority`・`label` など）は、サブの本文の先頭に 1 行で残す。ほかの issue の `related` にある子の ID は合成キーにする。worklog・statuslog・board の jsonl は書き換えず、pkm-task が `migrated_from` から旧 ID の行をそのサブの行として読む
- issue の md の中に、サブイシューを持てるようにした（ADR-0135）。本文の末尾に、サブ 1 件ごとに `<!-- sub-issue ... -->` のブロック（中は YAML）を置き、その後ろにサブの本文を書く。並びは md に書いた順。サブの外からは合成キー `i-12#k3f9a2` で指す
- `node .kit/bin/lint.mjs .` が、サブの書式・id の重なり・`depends_on` の誤り（ない依存先・自分自身・循環）をエラーにし、依存先の `end` より前の `start` を警告にする
- サブでタイマーを始めると、worklog の行に `sub`（サブの id）が付く。`sub` のない既存の行はそのまま。open のサブは in-progress になり、親の status は変わらない。親の再生ボタンは、親に直接付けた記録だけを見る
- 親の実績は、親に直接付けた分とサブの分の合計（重なりは 1 回だけ数える）。サブの status の変化は statuslog に `task` と `sub` で記録する
- MCP: `create_sub_issues`・`update_sub_issue`・`move_sub_issue`・`delete_sub_issue` を足した。`get_issue` はサブの一覧と、親に直接付けた実績（`directEffortMinutes`）を返す。`start_timer` / `stop_timer` はサブを合成キーで指す
- MCP の `create_issue`・`update_issue`・`list_issues` から `parent` を外した（渡すとエラー）。`get_issue` は `ancestors`・`children` を返さない。スキル `task-coach` は、大きい issue をサブイシューに分けるよう提案する
- issue の `parent`（親子関係）を廃止した。issue 画面の Parent / Children 欄と、Capture の「子として作る」をなくした。`parent` が残っている issue は lint が `legacy-parent` のエラーにする。`related` にサブの合成キーを書ける
- 子への影響: 移行 0135-sub-issues がある。子の issue のファイルを消すので、取り込む前にすべての端末で同期を済ませ、取り込みの前後はほかの端末で issue を編集しない。扱えない issue（ない親・循環・読めない frontmatter）があると移行が止まるので、README のとおりにユーザーに確かめて直す。モバイルで、親の issue を開いて表示が崩れないことを確かめる
