## 変更の要約

- **移行 0137-board-lanes**: `issue/board-groups.json` を消し、`routine/*.md` と子の `template/file/routine.md` の frontmatter から `group` の行だけを消す。board の jsonl（以前の `place` と `group` 付きの `order`）は書き換えず、pkm-task が読んで捨てる
- task board のグループ・サブグループを廃止した（ADR-0137）。Board groups の View・コマンド・左サイドバーの項目、ボードの「Edit groups」、グループごとのまとめて再生 / 停止、routine の `group`（routine 画面・作成のフォーム）をなくした。`group` が残っている routine は lint が `legacy-routine-group` の警告にする
- ボードを 1 列にし、status とタイマーから自動で欄に分けるようにした: Working（タイマーが動いているもの）・Top 3（★ 今日の最重要。3 件まで）・Up next（残り）・Waiting（waiting / delegated。件数を出して開いたまま）・Done（片付いたもの。たたむ）
- ★ はカードの `···` の「Add to Top 3」か、Top 3 へのドラッグで付ける。その日だけで、翌日には引き継がない。並べ替え（ドラッグ、Move up / Move down）はボード全体で 1 つの並びで、翌日以降にも引き継ぐ。グループの中で並べた順は引き継がない
- カードを 1 行（status のバッジ・題・再生 / 停止・`···`）にした。priority のバッジと「次の status」のボタン、委任先のチップをなくした（status はバッジのメニューで変える）
- サブイシューがボードのカードになった。今日が Do Date のサブは自動で載り、同じ欄で隣り合った同じ issue のサブは親の見出しの下にまとまる。「Add issue」の候補にサブが `i-12 › 題` で出て、選ぶと Do Date に今日を足して載せる。未完了の一覧のサブは Do Tomorrow・Close・Move Do Date・Cancel で片付ける。締めたときの要約にサブを `i-12 › 題` で書く
- 移行 0135 でサブにした子の以前の ID を指すボードの記録は、そのサブのカードとして読む
- MCP: `get_board` は欄ごとのカード（`lanes`）を返す。`move_card` をなくし、並べ替えの `order_card` と ★ の `star_card` を足した。`add_to_board`・`remove_from_board`・`carry_issues` はサブの合成キーを受け付ける（サブは Inbox に戻せない）。`get_overview` の `board` は `subs` と `stars` を返し、`groups` を返さない。`scheduledNotOnBoard` は ID と合成キーの一覧になった
- 子への影響: 移行 0137-board-lanes がある。`issue/board-groups.json` を消すので、取り込む前にすべての端末で同期を済ませる。グループでカードを分けていたなら、その分けは失われるので、朝に Top 3 と Up next を並べ直す。子だけのスキルや `local/CLAUDE.md` でグループや `move_card` に触れていれば直す。モバイルで、カードの `···` だけで ★ と並べ替えができることを確かめる
