# Closing

- 種類: View（[Today](task-today.md) の中の 1 画面。段階表示には入らない）
- 開き方: [task board](task-board.md) の末尾の「Close board」
- 場面: [一日の締め](../jobs/task-close-day.md)

## 今の振る舞い

- Close board を押すと、この画面に移り、今日のデイリーノートを右のペインに開く（なければ作る。開いているタブがあればそれを出す）。デイリーノートの本文の冒頭（frontmatter の直後）に振り返りの型を入れる。型の最初の見出しがすでにあれば入れない（何度押しても 1 回だけ）
- 締める日（締めの日）は Close board を押したときに決まり、← Board で戻るまで変わらない。締めている途中で 0 時を過ぎても、画面は同じ日のまま。0 時から締めの猶予の時刻（設定。既定は 4 時、端末ごと）までに押し、前日のボードを締めていなければ前日を締める。そのときは前日のデイリーノートを開いて型を入れ、見出しに `yesterday` を出す
- 上の「← Board」と下の「← Board」でボードに戻る。見出しの右にその日の作業時間の合計
- Closing routines: 今日に出てくる、category が closing の routine を並び順に出す。status のボタンで closed にする（↩ で戻す）。すべて片付くと見出しに「All done」
- Tasks: 今日のボードのもの、今日 closed / canceled にしたもの（ボードの外も）、今日の default の routine を、Closed・Not done（open / in-progress。記録では持ち越し）・Waiting（waiting / delegated）・Canceled（canceled / someday）の群に分ける。件数のない群は出さない。アイコンと色は群の見出しだけに付ける。行は 1 行で、status のボタン・題（押すと開く）・付記（サブは親の ID、routine、その日の作業時間）だけ
- Tasks の「closed / canceled にしたもの」と Notes は、締めの日の 0 時から翌日の猶予の時刻までを数える（0:20 に閉じたものや書いたノートも前日の締めに出る）。作業時間は記録を始めた日で数える
- Notes: 今日に変えたノート（タスク管理のデータ・`tmp/`・`template/`・隠しパスを除く）を新しい順に出す。作ったもの（created が今日）には `new`。押すと開く
- 「Finish closing」でデイリーノートの `## Task board` 節に要約を書く。未完了が残っていても書け、未完了は持ち越しと書く。書いた後は Closed と Reopen を出す。押さなくても催促しない

## 使う概念

[task board](../concepts/task-board.md)、[routine](../concepts/task-routine.md)、[status](../concepts/task-status.md)、[worklog とタイマー](../concepts/task-worklog.md)、[デイリーノート](../concepts/note-daily.md)

## 根拠

[ADR-0189](../../../../src/docs/adr/0189-gtd-inbox-and-optional-close.md)、[ADR-0206](../../../../src/docs/adr/0206-closing-view-and-routine-category.md)、[ADR-0226](../../../../src/docs/adr/0226-closing-date-across-midnight.md)

## 入力と制約

振り返りの型はスニペット `daily-review.md` です。上流の既定は `.kit/templates/snippet/daily-review.md` で、その Vault の `template/snippet/daily-review.md` を置くとそちらを使います。テンプレート変数（`{{...}}`）は展開しません。

## 操作と保存

振り返りの型はデイリーノートの本文に入れます（既にある本文は変えません）。routine の結果は board の操作ログ、issue の status は frontmatter に保存します。Finish closing は daily の Task board 節へ要約を書きます。

## 失敗時と戻し方

型を入れられなかったときは通知が出ます。入った型が不要なら、デイリーノートから消します（消した後にもう一度押すと、また入ります）。記録を書き直したいときは Reopen してから Finish closing を押します。

## 端末の違い

PC では Today の右のペインにデイリーノートが開き、一覧を見ながら書けます。スマホでは画面を分けられないので、デイリーノートは Today と同じ場所に開きます。Today に戻るとボードの段階が出るので、もう一度 Close board を押すと Closing の画面に戻ります（型は 2 回は入りません）。
