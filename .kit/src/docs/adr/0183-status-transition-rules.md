# ADR-0183: status の遷移表を規則として固定し、遷移に沿ったボタンを 1 つ置く

- 状態: 承認（一部置換: 0189, 0190, 0203）
- 日付: 2026-11-16

## 背景

status（open / in-progress / waiting / delegated / someday / closed / canceled）の移り変わりと、それにともなう付随の変更（★、タイマー、`delegated_to`・`revisit`・`tickler`・期限・`scheduled` の消去）が、画面と経路ごとに別々に書かれていた。

- issue の status は、リストとボード（`statusPatch`）、issue のヘッダー（`StatusField` が自前で組み立てる）、MCP（`updateIssueOnDisk`）が、それぞれ別の規則で書く。ヘッダーから canceled にすると期限と Tickler が残り、closed にすると Tickler が残る
- サブの status は、ボード・本文のカード・ヘッダーのサブ一覧の 3 か所に同じ処理がある
- どの status からどの status へも移れる。メニュー（`STATUSES`、`boardMenuStatuses`）は全部を出す
- ADR-0031 の「次の status」（`nextStatuses`）は、ADR-0137 でボードから外した後、どの画面からも使われていない。ADR-0184 の文中にだけ残っている
- タイマーは closed / canceled にしたときだけ止まる。待ち（waiting / delegated）や someday にしても動き続ける

[ADR-0184](0184-pick-in-progress-and-watch-lane.md) で、Pick に in-progress を含め、waiting / delegated で ★ を外すことを先に決めた。この ADR は、遷移の全体を規則として決める。

## 決定

### 遷移表

status は、次の表にある遷移でしか変えない。表は `core/transition.ts` の 1 か所に置き、画面・MCP のどの経路もこれを通す。

| 今 | 移れる先 |
|---|---|
| open | in-progress、waiting、delegated、someday、closed、canceled |
| in-progress | waiting、delegated、someday、closed、canceled |
| waiting | in-progress、someday、closed、canceled |
| delegated | in-progress、someday、closed、canceled |
| someday | open、closed、canceled |
| closed | canceled、↩ |
| canceled | closed、↩ |

- 基本のルートは open → in-progress → closed。in-progress と waiting / delegated は行き来でき、待ちから戻す先は in-progress（ADR-0184）。in-progress から open には戻さない
- waiting と delegated の間は直接移らない（in-progress を経由する）
- ↩（Reopen）: closed / canceled から、閉じる前の status に戻す。閉じる前の status は、statuslog の、その issue（サブ）の最後の「終わっていない → closed / canceled」の行の `from`。分からなければ open。戻す先は 1 つに決まり、選べない
- 表にない遷移は書かない。画面ではメニューに出さず、MCP（`update_issue`・`update_sub_issue`）ではエラーにして、移れる先を返す
- 取り消しのトースト（`via: undo`。ADR-0031）は、変える前の値を書き戻すだけなので、表の対象外
- ファイルを手で書き換えたもの・本文のエディタで書き換えたサブ（ADR-0161）は止められない。記録（statuslog）と付随の処理はこれまでどおり行う
- routine はその日の結果（open / closed / canceled）だけを持つので、対象外

### status のメニュー

issue のヘッダー、リスト、ボード・Watch のカード、サブのカードとサブ一覧のメニューは、今の status（チェック付き）と、表の移れる先だけを出す。closed / canceled では、移れる先に加えて「Reopen（→ in-progress）」のように戻る先を書いた項目を出す。

### ボタン（1 つ）

status のバッジの隣に、いちばんよく使う遷移のボタンを 1 つだけ置く（`primaryStep`）。

| 今 | ボタン | ツールチップ |
|---|---|---|
| open | in-progress のアイコン | Start |
| in-progress | closed のアイコン | Close |
| waiting / delegated | in-progress のアイコン | Resume |
| someday | open のアイコン | Reopen |
| closed / canceled | ↩（Lucide の `undo-2`） | Reopen（→ 戻る先） |

- アイコンは押した後の status の形（`StatusIcon`。ADR-0031 と同じ）を、モノクロ（弱い文字の色）で出す。今の status は色付きなので、どちらが今の status か見分けられる。サブの行の今の status のアイコンも、status の印の色で出す
- 置く場所: issue 画面のヘッダー、本文のサブのカード、ヘッダーのサブ一覧（いつも出す）と、ボードのカード（Working・Top 4・Up next・Done）。ボードでは、カードにホバーしたとき・キーボードのフォーカスが入ったときだけ出し、場所はあらかじめ取っておく（カードの幅を変えない。ADR-0137）。ホバーのない端末（モバイル）と、狭いボード（幅 480px 以下。題を残すため。ADR-0184 の Watch と同じ）では出さず、status のメニューだけにする
- Watch のカードの Resume（ADR-0184）は、文字付きのまま残す。in-progress にする処理は、このボタンと同じ関数を使い、今日のボードになければ載せる
- routine のカードには出さない

### 付随の変更

遷移ごとの付随の変更を表で決める。frontmatter の変更（patch）は `core/transition.ts` が返し、★・タイマー・statuslog は status を書く処理（Obsidian の `TaskWriter`、MCP の `updateIssueOnDisk` / `updateSubIssueOnDisk`）が、status が変わったときに行う。

| 移る先 | `delegated_to` | `revisit` | `tickler` | 期限 | `scheduled` | ★ | タイマー |
|---|---|---|---|---|---|---|---|
| open | 消す | 消す | 残す | 残す | 残す | 残す | 残す |
| in-progress | 消す | 消す | 消す | 残す | 残す | 残す | 残す |
| waiting | 消す | 消す | 消す | 残す | 残す | 外す | 止める |
| delegated | 必須（その場で選ぶ） | 消す | 消す | 残す | 残す | 外す | 止める |
| someday | 消す | 任意 | 消す | 消す | 消す | 外す | 止める |
| closed | 消す | 消す | 消す | 残す | 残す | 残す | 止める |
| canceled | 消す | 消す | 消す | 消す | 残す | 残す | 止める |

- サブには `tickler`・`revisit` がない。ほかの列は issue と同じ（サブを canceled にすると期限も消す）
- `tickler` は open だけが持つ。Tickler は整理の先送りで、日付が来たら Inbox（open で判定する）に戻すので、in-progress・待ちに付けると Inbox にも Next にも出なくなる（Next は Tickler のあるものを外す）。open 以外にしたら消し、open 以外には付けない（someday に付けると open に戻る。ADR-0152）。画面の Tickler の操作は open・someday にだけ出し、MCP は付けようとするとエラーにする。open 以外に残っている `tickler` は lint が `stale-tickler` で知らせ、issue 画面では消すだけの欄にする
- ★ は in-progress に戻しても戻らない（ADR-0184）
- タイマーを始めたら、open・waiting・delegated のものを in-progress にする（サブは親を変えない。MCP の `start_timer` も同じ）
- issue 画面の Pick・再生のボタン（ADR-0165）は、open・in-progress・someday に出す（someday は Pick で open になる）。waiting / delegated と closed / canceled には出さない（記録中なら停止だけ出す）。待ちから戻すのは status のボタン（Resume）
- ↩ で delegated に戻るときは、委任先をその場で選ぶ（閉じたときに消したので）

### 操作

status を変える操作は、遷移表の上の操作として定義する。

| 操作 | 対象（表で移れるもの） | status | ほかの変更 |
|---|---|---|---|
| Pick（ADR-0165, 0184） | open・in-progress・someday | someday は open、ほかは変えない | Calendar・Tickler・未来の開始日を消し、今日のボードに載せる |
| Resume（Watch） | waiting・delegated | in-progress | 今日のボードになければ載せる |
| Inbox に戻す | open だけ | open のまま | `clarified` を外す |
| Tickler | open・someday | someday は open、open は変えない | ADR-0152 のとおり |
| Next・Back to Next・Calendar | 終わっていないもの | someday は open、ほかは変えない | ADR-0148, 0152 のとおり |
| Someday へ | open・in-progress・waiting・delegated | someday | 上の表 |
| Close | closed 以外の、終わっていないもの と canceled | closed | 上の表 |
| Cancel | canceled 以外 | canceled | 上の表 |

- 一括の操作（Inbox・一覧・Daily・ボードの操作の欄。Tickler を含む）は、選んだものに 1 つでも移れないものがあれば、ボタンを押せなくする。一部だけを変えることはしない
- ボードの持ち越しの Inbox も、open のものにだけ出す。MCP の `carry_over` の `inbox` は、open でなければエラーにする

### 消すもの

- `nextStatuses`（ADR-0031）と `boardMenuStatuses`（ADR-0032）を消し、`transitionTargets`（移れる先）と `primaryStep`（ボタン）に置き換える
- `statusPatch` は `core/transition.ts` の `issueStatusPatch` に置き換える。`closePatch`・`cancelPatch`・`somedayPatch` は、その中で使う

## 理由

- 経路ごとに規則を書くと、今回のヘッダーの canceled のように、同じ操作で結果が変わる。表を 1 か所に置き、画面は表から作り、書き込みも表を通すと、どの経路からでも同じ結果になる
- メニューに表の先だけを出すと、取りうる状態の移り変わりが決まり、記録（statuslog）の分析もしやすくなる
- いちばん多い操作（着手・完了・再開）を 1 回で行えるように、ボタンは 1 つに絞る。2 つ以上置くと、ボードのカードが大きくなる（ADR-0137）。ホバーのときだけ出すと、一覧性を保てる
- 待ち・someday は、今の自分の作業ではないので、タイマーを止める。止め忘れの記録（worklog の見直し）を減らせる
- ↩ の戻る先を 1 つに決めると、戻すたびに選ぶ手間がなく、閉じる前の状態に確実に戻る

## 却下した案

- **メニューでは全部を選べるようにし、ボタンだけルートに沿わせる**: 規則が原則になり、経路によって移り変わりが変わる
- **Close を in-progress を経由して書く**（open → in-progress → closed を続けて記録する）: 実際には着手していない in-progress の記録が残る。「もう終わっていた」を open → closed として表に入れた
- **Inbox に戻すを、in-progress・waiting・delegated からも許す**: 着手したもの・待っているものを未整理に戻すことになる。Inbox は open のものの整理の状態（`clarified`）だけを変える
- **一括の操作で、移れるものだけを変え、残りを知らせる**: 押した結果が選んだものと食い違う。押せなくすると、押す前に分かる
- **ボタンを 2 つ以上置く（in-progress から closed と waiting など）**: ボードのカードが大きくなる。waiting はメニューで選ぶ
- **↩ で戻る先を選ばせる**: 戻す操作は「閉じたのを取り消す」なので、先は 1 つでよい

## 影響

- ADR-0031 の「次の status」のボタンと、ADR-0032 のボードのカードの status メニュー、ADR-0018 のリストからの status の変更、ADR-0184 の `nextStatuses` への言及を、この ADR で置き換える
- プロダクトの文書（ボードの画面）と、デザインルールの部品の表に、status のボタンを足す
- MCP の `update_issue`・`update_sub_issue` は、表にない遷移をエラーにする。task-coach の手順に、移れる先を書く
- 子への移行はない（frontmatter・ログの形を変えない）
