# ADR-0210: issue 画面に GTD の分類を読み取り専用で出し、Project のサブの期間と Tickler の規則を決める

- 状態: 提案
- 日付: 2026-11-20

## 背景

#210。

- issue 画面の status の横にある Clarified / Inbox のチップ（[ADR-0148](0148-inbox-clarified.md)）は、押すと `clarified` を切り替える。Clarified と出ていても、Calendar や Tickler があれば Next Actions には出ない。その issue が今どの一覧に出るのか（Inbox・Next Actions・Calendar・Tickler）は、画面から読み取れない
- サブを持つ issue（GTD の Project）の判定が、場所によって違う。DailyTaskView の Pick（[ADR-0150](0150-daily-engage-steps.md)・[ADR-0203](0203-pick-and-start-follow-next.md)）は active なサブだけで判定する。Calendar の排他（ADR-0203）は、閉じたサブも数える。サブがすべて閉じると、Pick では通常の issue の行に戻る
- Inbox（未整理）の Project のサブにも期間（`start`・`end`）を入れられる。整理の前に計画ができてしまう
- Tickler を持つ Project のサブの期間と、Tickler の日の関係が決まっていない。Tickler の日を過ぎた期間のサブは、親が Next でないので Pick に出ない（ADR-0203）。また、Tickler の日には Inbox に戻るので、計画済みの Project も整理し直しになる
- 期間がすべて未来の Next の Project も、DailyTaskView の「Projects without a next action」に出る。計画はあるのに、次の行動がないと言われる
- 親を someday にしても、サブの期間はそのまま残る。サブを someday にしたときは期間を消す（[ADR-0190](0190-sub-end-as-due.md)）ので、扱いがそろっていない

## 決定

### Project の判定

- サブを 1 つでも持つ issue を Project とする。サブの status（closed・canceled を含む）は見ない（ADR-0203 の Calendar の排他と同じ。サブを消すと通常の issue に戻る）
- `status` に `project` は足さない。Project はサブから毎回判定する分類で、保存しない（[ADR-0002](0002-frontmatter-as-source-of-truth.md)）
- 判定は `core/index.ts` の 1 か所に置く（`isProject`）。DailyTaskView の Pick・Calendar の排他・issue 画面・MCP が同じものを使う

### GTD の分類（読み取り専用のバッジ）

- issue がどの一覧に出るかを返す関数を `core/index.ts` に置く（`gtdList`）。判定は `isInbox`・`isNext` などと同じ規則で、画面ごとに書かない

| 分類 | 条件 | バッジ |
|---|---|---|
| Inbox | `isInbox`（Tickler の日を迎えたもの。下の例外を除く） | Inbox |
| Next Action | `isNext`（下の Tickler の例外を含む） | Next Action |
| Calendar | 有効で、`scheduled` がある | Calendar 11/22 |
| Tickler | `tickler` が今日より後 | Tickler 11/25 |
| なし | waiting・delegated・someday・closed・canceled | 出さない（status のバッジで分かる） |

- Project なら、上のバッジの隣に「Project」のバッジを出す（Calendar は Project に付かない。ADR-0203）
- issue 画面の status の行の Clarified / Inbox のチップを、このバッジに置き換える。押しても何もしない
- 整理（Inbox → Next）は Inbox・Organize の画面で行う。issue 画面から Inbox に戻す操作はなくなる。整理し直したいときは Tickler を付ける（その日に Inbox に戻る）。MCP の `update_issue` の `clarified` は今のまま残す
- `clarified` の項目は残す（日付のない open が Inbox か Next かは、これで決まる）

### Inbox の Project のサブの期間

- Inbox（`isInbox` が真）の Project のサブには、期間を新しく入れることも、今ある期間を変えることもできない。期間を消すのはよい
- Obsidian の書き込み（サブの Edit のダイアログ、Timeline の棒を作る・動かす、本文のカード）と MCP（`create_sub_issues`・`update_sub_issue` の `start`・`end`）の両方で止める。判定とエラーの文は `core/` の 1 か所に置く
- 画面では、入れる前に止める。Inbox の Project の Timeline は棒を作れず、動かせないようにする。Edit のダイアログの Start・End の欄は押せないようにし、「先に Inbox で整理してください」と理由を出す
- MCP は、理由（先に整理すること）をエラーで返す
- md を直接書き換えたものは止められない。lint が `period-in-inbox`（警告）で知らせる。自動では消さない
- 今ある期間は消さない（Tickler の日を迎えた Project などで、計画を失わないため）

### Tickler と Project のサブの期間

次の不変条件を 1 つ決め、両側から守る。

> Project の `tickler` は、閉じていないサブの期間の始まり（`start`。`end` だけならその日）のうち、いちばん早い日以前

- Tickler が今日より後の Project のサブには、Tickler の日以降に始まる期間だけを入れられる。Tickler の日より前に始まる期間は、入れる前に止める（Timeline ではその日より前に棒を置けない）
- Project に Tickler を付けるときは、上の日より後の日を選べない。日付の選択でその日より後を選べなくする。期間がすでに今日以前に始まっているサブがあれば、Tickler を付けられない。そのときは「サブの期間を後ろにずらしてください」と理由を出す
- Obsidian の書き込みと MCP（`update_issue` の `tickler`、`create_sub_issues`・`update_sub_issue`）の両方で止める。lint が `tickler-after-sub-period`（警告）で知らせる
- Tickler の日を迎えた Project は、閉じていないサブに期間を持つものが 1 つでもあれば、Inbox ではなく Next Action として扱う（`isInbox` が偽、`isNext` が真）。計画済みなので、整理し直さない。その日から、期間に入ったサブが Pick に出る。`tickler` の値は書き換えない（自動で書き換えない）
- 期間を持つサブがない Project は、これまでどおり Tickler の日に Inbox に戻る

### 次の行動のない Project

- DailyTaskView の「Projects without a next action」（ADR-0203）から、閉じていないサブに今日より後に始まる期間があるものを外す（次の行動が計画されている）
- サブがすべて閉じた Next の Project は、この欄に出る。行に Close のボタンを出す（押したときだけ閉じる）
- active なサブを持たない Project を、Pick の通常の行にしない（上の Project の判定）

### Project の status のボタン

- Project の親は Pick の行にならないので、open の Project の status のボタンに Start を出さない（status のメニューからは in-progress を選べる。遷移表は変えない）
- サブがすべて閉じた Project（closed・canceled でない）の status のボタンを Close にする。親を勝手には閉じない

### Project を someday にするとき

- Project を someday にすると、閉じていないサブの期間（`start`・`end`）と Calendar の日（`scheduled`）を消す。サブの status は変えない。閉じたサブの期間は記録として残す
- 消すサブがあるときは、status を変える前に確認のダイアログを出す。消すサブと期間を並べ、「Move to Someday」と「Cancel」を出す。Cancel なら何も変えない
- 経路: status のメニュー、Organize の Someday、一括の操作（Issues・Daily）。一括では、消すサブがある issue をまとめて 1 つのダイアログで確認する
- MCP の `update_issue` で status を someday にするときは、消すサブがあれば、`clear_sub_periods: true` がない限りエラーにして、消えるサブと期間を返す（確認のダイアログの代わり）

### MCP と task-coach

- `list_issues` などが返す issue に、分類（`inbox`・`next`・`calendar`・`tickler`・なし）と `project`（真偽）を足す
- task-coach の手順を、この分類の言葉で書く

## 理由

- 分類を読み取り専用で出すと、issue 画面で「今どの一覧に出るか」が分かる。Clarified のチップは、clarified と日付の組み合わせを人が頭の中で解かないと意味が分からなかった
- 整理を Inbox・Organize に寄せるのは、ADR-0203 の「着手までの順を画面に固定する」と同じ考え。issue 画面のチップは、整理を飛ばす近道になっていた
- Project を status にすると、サブの有無という同じ事実を 2 か所に書くことになり、食い違いの検査と自動の遷移が要る。status は進み具合の軸なので、「委任した Project」「someday の Project」も表せなくなる
- サブの status を見ずに Project とすると、サブを閉じ終えた Project が通常の issue に戻らず、閉じ忘れに気づける（次の行動のない Project の欄と Close のボタン）
- Inbox の Project で期間を止めると、計画（Timeline）は整理の後になる。GTD の Clarify → Organize の順と合う
- Tickler と期間の規則を 1 つの不変条件にすると、どちらから入力しても同じ理由で止まり、矛盾した状態ができない。計画済みの Project の Tickler は「この日から始める」という意味になり、その日に整理し直させない
- someday で期間を消すのは ADR-0190 のサブと同じ扱い。計画を失う操作なので、確認を挟む

## 却下した案

- **status に `project` を足し、サブの有無で自動で遷移させる**: 正本が 2 つになる（ADR-0002）。statuslog に自動の遷移が混ざる。waiting・delegated・someday と組み合わせられない。遷移表・MCP・lint・色・既存の issue の移行が要る
- **active なサブを持つ issue だけを Project とする（今の Pick のまま）**: サブを閉じ終えると通常の issue に戻り、親を閉じ忘れても気づきにくい。Calendar の排他（ADR-0203）と判定が食い違う
- **Clarified のチップを押せるまま残し、隣に分類のバッジを足す**: 同じことを 2 つの部品が表し、どちらを見ればよいか分からない。整理の近道も残る
- **Inbox の Project のサブの期間を、入れたら警告だけにする**: 整理の前の計画ができてしまう
- **Inbox に戻ったときに、サブの期間を消す**: 計画を失う
- **Tickler の日を迎えた計画済みの Project の `tickler` を、自動で消して `clarified` を付ける**: 書いていない変更を仕組みが書く。判定で Next にすれば足りる
- **Project を someday にしても、サブの期間を残す**: someday のサブだけ期間を消す ADR-0190 と扱いがそろわない。someday の Project の期間が Timeline と期限の表に残る
- **サブがすべて閉じたら、親を自動で閉じる**: 親にサブ以外の作業が残っていることがある。閉じるのは人が決める

## 影響

- 変更するもの: `core/index.ts`（`isProject`・`gtdList`、`isInbox`・`isNext` の Tickler の例外）、`core/daily.ts`（`pickCandidates` の Project と、次の行動のない Project）、`core/calendar-subs.ts`（`isProject` を使う）、`core/transition.ts`（`primaryStep` の Project、someday の付随の変更）、新規の `core/project-periods.ts`（Inbox と Tickler の期間の判定とエラーの文）、`core/lint.ts`、`obsidian/writer.ts`、`obsidian/status-change.tsx`・`issue-actions.tsx`、`obsidian/sub-editor.tsx`、`header/IssueHeader.tsx`・`SubTimeline.tsx`、`ui/badges.tsx`、`views/DailyView.tsx`・`OrganizeView.tsx`、`cli/vault-ops.ts`・`cli/mcp.ts`、プロダクトの文書、task-coach のスキル
- 状態を「一部置換: 0210」にする: ADR-0148（issue 画面の Clarified のチップ）、0152（Project の Tickler）、0190（親を someday にしたときのサブの期間）、0203（Project の判定、次の行動のない Project、Start のボタン）
- 子の Vault の frontmatter と md の形は変えない（移行はない）。規則に合わない既存のデータは lint が警告で知らせる。子から見える変更なので `.kit/changes/` に書く
