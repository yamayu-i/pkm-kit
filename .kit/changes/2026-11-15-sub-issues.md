## 変更の要約

- **移行 0135-sub-issues**: `parent` を持つ issue（子と孫）を、いちばん上の祖先の md の中のサブイシューにし、子のファイルを消す。写さない項目（`priority`・`label` など）は、サブの本文の先頭に 1 行で残す。ほかの issue の `related` にある子の ID は合成キーにする。worklog・statuslog・board の jsonl は書き換えず、pkm-task が `migrated_from` から旧 ID の行をそのサブの行として読む
- issue の md の中に、サブイシューを持てるようにした（ADR-0135）。本文の末尾に、サブ 1 件ごとに `<!-- sub-issue ... -->` のブロック（中は YAML）を置き、その後ろにサブの本文を書く。並びは md に書いた順。サブの外からは合成キー `i-12#k3f9a2` で指す
- `node .kit/bin/lint.mjs .` が、サブの書式・id の重なり・`depends_on` の誤り（ない依存先・自分自身・循環）をエラーにし、依存先の `end` より前の `start` を警告にする
- サブでタイマーを始めると、worklog の行に `sub`（サブの id）が付く。`sub` のない既存の行はそのまま。open のサブは in-progress になり、親の status は変わらない。親の再生ボタンは、親に直接付けた記録だけを見る
- 親の実績は、親に直接付けた分とサブの分の合計（重なりは 1 回だけ数える）。サブの status の変化は statuslog に `task` と `sub` で記録する
- MCP: `create_sub_issues`・`update_sub_issue`・`move_sub_issue`・`delete_sub_issue` を足した。`get_issue` はサブの一覧と、親に直接付けた実績（`directEffortMinutes`）を返す。`start_timer` / `stop_timer` はサブを合成キーで指す
- MCP の `create_issue`・`update_issue`・`list_issues` から `parent` を外した（渡すとエラー）。`get_issue` は `ancestors`・`children` を返さない。スキル `task-coach` は、大きい issue をサブイシューに分けるよう提案する
- issue の `parent`（親子関係）を廃止した。issue 画面の Parent / Children 欄と、Capture の「子として作る」をなくした。`parent` が残っている issue は lint が `legacy-parent` のエラーにする。`related` にサブの合成キーを書ける
- issue 画面のヘッダーに「Sub-issues」のカードを足した（ADR-0142）。1 行の一覧（status・題・期間など・実績・再生）で、題を押すと本文と項目が開く。closed / canceled は「Show N closed」で出す。「Add a sub-issue」の入力欄は Enter で 1 件作ってフォーカスを残し、複数行の貼り付けは行ごとに作る。ドラッグ（モバイルはメニューの Move up / Move down）で並べ、Edit のダイアログで全部の項目と本文を直す。リーディング表示では、md の中のサブの部分を隠す（編集表示では見える）。worklog の一覧に、サブで記録した行のサブの題を出す
- カード「Sub-issues」に、ガントチャート（Timeline）を足した（ADR-0143）。見出しの右の `List` / `Timeline` で切り替え、目盛りは `Day` と `Week`（日曜始まり。全期間を見渡す）。棒のドラッグで期間をずらし、両端で伸ばす（指を離したときに保存）。期間のない行は日を押すとその日の棒を作る。依存は矢印で、依存先が終わる前に始まるものは赤
- 子への影響: 移行 0135-sub-issues がある。子の issue のファイルを消すので、取り込む前にすべての端末で同期を済ませ、取り込みの前後はほかの端末で issue を編集しない。扱えない issue（ない親・循環・読めない frontmatter）があると移行が止まるので、README のとおりにユーザーに確かめて直す。モバイルで、親の issue を開いて表示が崩れないことを確かめる
