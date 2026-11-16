# status

## 目的

やることが今どこにあるかを、1 つの値で表す。

## 状態

`status`: open / in-progress / waiting / delegated / someday / closed / canceled。それぞれに色と ○ を土台にしたアイコンがある。補足は `status-detail`（20 文字以内）。変化は `statuslog/` に追記される（分析用。正本は frontmatter）。

## 操作

バッジのメニューで選ぶ。メニューに出るのは、遷移表で今の status から移れる先だけ（open → in-progress・waiting・delegated・someday・closed・canceled、in-progress → waiting・delegated・someday・closed・canceled、waiting・delegated → in-progress・someday・closed・canceled、someday → open・closed・canceled、closed ⇄ canceled）。closed / canceled からは Reopen で閉じる前の status に戻せる。バッジの隣の丸いボタンで、いちばんよく使う遷移（open は Start、in-progress は Close、待ちは Resume、someday は Reopen、終わったものは ↩）を 1 クリックで行う。ボードではカードにマウスを乗せたときだけ出る。一括の操作は、選んだものに移れないものがあれば押せない。変えた直後は右下のトーストでまとめて取り消せる。

## 使い方の筋道

タイマーを始めると open・waiting・delegated は in-progress になる。open / in-progress 以外にすると、記録中のタイマーが止まる。waiting・delegated・someday にすると今日のボードの ★ が外れる。someday にすると Calendar の日・期限・Tickler が消える（[Someday](task-someday.md)）。canceled にすると期限が消える。どの画面・MCP から変えても同じ結果になる。

## 根拠

[ADR-0006](../../../../src/docs/adr/0006-status-inbox-someday.md)、[ADR-0031](../../../../src/docs/adr/0031-status-quick-change.md)、[ADR-0032](../../../../src/docs/adr/0032-action-names-soft-deadline-board-delegate.md)、[ADR-0183](../../../../src/docs/adr/0183-status-transition-rules.md)
