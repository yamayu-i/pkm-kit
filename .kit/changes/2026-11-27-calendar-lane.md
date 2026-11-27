## 変更の要約

- **移行 0255-sub-calendar-or-period**: サブは Calendar の日（`scheduled`）か期間（`start`・`end`）のどちらか一方だけを持つ（ADR-0255）。移行はファイルを変えず、両方を持つサブを `check` で報告する。どちらを残すかをユーザーに確かめて外す（移行の README）
- task board のいちばん上に Calendar の欄を足した。今日が Calendar の日の issue とサブを出し、★ と並べ替えはしない。タイマーを動かすと Working、片付けると Done に移る
- ガント（issue 画面の Timeline と Projects）で、サブの Calendar の日を菱形の印で出す。ドラッグか ← → で日を動かし、右クリック（モバイルは長押し）のメニューか `C` キーで 1 日の棒と切り替える。Calendar のサブには依存の矢印を引かない
- サブの Edit と本文のカードでは、Calendar と Period の片方があると、もう片方の欄を押せない。両方にする書き込みは、Obsidian でも MCP（`create_sub_issues`・`update_sub_issue`）でもエラーになる。lint は両方を持つサブを `sub-calendar-and-period` で警告する
- Projects の Load・「Estimate」の印・Project の並びとまとめの棒は、Calendar のサブをその 1 日として数える
- MCP の `star_card`・`order_card` は、今日の Calendar のカードを止める。`get_board` の `lanes` に `calendar` が増えた
- 子への影響: 移行 0255（両方を持つサブがあれば、直すまで止まる）。モバイルでは、ガントの印の長押しでメニューが出るか、印をドラッグで動かせるかを確かめる
