## 変更の要約

- issue 画面の Pick は、Next のもの（issue は整理済みか着手済みで Calendar も Tickler もないもの、サブは下のとおり）にだけ出す。Next でないものを確認のダイアログで Next に書き換えて Pick する動きはなくした（ADR-0203）
- サブの Next を「open か in-progress で、Calendar の日がなく、親が Next で、今日が期間（start〜end。片方だけならその 1 日）に入るもの」にした。期間がないか今日が期間の外のサブには、Pick の代わりに Timeline のボタンを出す。押しても何も書き換えず、Sub-issues のカードを Timeline に切り替えてそのサブの行を目立たせる。Today の Pick の候補も同じ規則で選ぶ
- status のボタンの Start（open → in-progress）は、今日のボードに載せたものにだけ出す。status のメニューからは、これまでどおり in-progress にできる
- Calendar の日（scheduled）を持つ issue にはサブを作れず、issue 画面の Sub-issues のカードを出さない。サブを持つ issue には Calendar の日を付けられず、Calendar の欄を出さない（Organize の Calendar も押せない。MCP もエラーにする）
- Today の Pick に「Projects without a next action」を足した。Next のサブが 1 つもない Next の Project を出し、Open で issue 画面を開く

## 子への影響

- 移行はない。すでに Calendar の日とサブの両方を持つ issue は、`node .kit/bin/lint.mjs .` が `calendar-with-subs`（警告）で知らせる。どちらかを外す
- 期間のないサブは Pick できなくなる。issue 画面の Timeline で期間を入れる
- モバイルで確かめること: issue 画面の Timeline のボタンを押すと、Timeline に切り替わって行が目立つ
