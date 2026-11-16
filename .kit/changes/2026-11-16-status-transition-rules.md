## 変更の要約

- status は遷移表にある遷移でしか変えられなくなった（ADR-0183）。open → in-progress・waiting・delegated・someday・closed・canceled、in-progress → waiting・delegated・someday・closed・canceled、waiting・delegated → in-progress・someday・closed・canceled、someday → open・closed・canceled、closed ⇄ canceled。closed / canceled からは Reopen で閉じる前の status に戻す
- status のメニュー（issue のヘッダー・リスト・ボード・Watch・サブ）は、今の status と移れる先だけを出す
- status のバッジの隣に、いちばんよく使う遷移のボタンを 1 つ置いた（open は Start、in-progress は Close、waiting / delegated は Resume、someday は Reopen、closed / canceled は ↩）。issue 画面とサブではいつも、ボードではカードにマウスを乗せたときだけ出る。モバイルのボードでは出ない
- 付随の変更をどの経路でも同じにした。issue のヘッダーから canceled にしても期限と Tickler が消え、closed にすると Tickler が消える。waiting / delegated にすると Tickler が消える。サブを canceled にすると期限が消える
- waiting・delegated・someday にすると、記録中のタイマーが止まる。someday にすると今日のボードの ★ も外れる。waiting / delegated でタイマーを始めると in-progress になる
- issue 画面の Pick・再生は、waiting / delegated に出さない（status のボタンの Resume で戻す）
- Inbox に戻すは open のものだけ。一括の操作（Close・Cancel・Someday・Inbox）は、選んだものに 1 つでも移れないものがあれば押せない
- MCP の `update_issue`・`update_sub_issue` は、表にない遷移をエラーにして移れる先を返す。`carry_issues` の `inbox` は open の issue だけ
- 子への影響: 移行は要らない。issue 画面のヘッダーと本文のサブのカードに status のボタンが出ること、ボードのカードにマウスを乗せるとボタンが出ること、メニューに移れる先だけが出ること、closed の issue の ↩ で閉じる前の status に戻ることを、PC とモバイルで確かめる
