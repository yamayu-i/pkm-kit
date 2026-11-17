# ADR-0206: ボードの締めを Closing の画面にし、routine に category・並び・積み残しを足す

- 状態: 承認
- 日付: 2026-11-17

## 背景

[ADR-0189](0189-gtd-inbox-and-optional-close.md) で、ボードの締めを記録を書くだけの操作にした。ただ、締めの体験にはまだ次の問題がある。

- ボードの「Not done」の欄は、★・Next・Working のレーンに出ているカードを、もう一度並べているだけである。ADR-0189 で、片付けなくても締められるようになり、持ち越しの回数も自動で数えるようになった。そのため、欄の操作（Back to Next など）はほとんど意味を持たない。Tickler・Move date・Close・Cancel は、翌日以降に Pick・Calendar の Missed・Issues から行える。一日の終わりに「やり残し N 件」を一覧で見せるのは、戦略の「作業を見張る」に近い
- 一日の作業（片付けたもの、残ったもの、作った・変えたノート）を一度に見て振り返る場所がない。ボードはレーンごとに分かれ、ノートは出ない
- 締めのときに行う routine（振り返り、翌日の準備など）を、日中の routine と分けられない。routine の並びは ID の順で、変えられない
- routine は、実行予定日に結果（closed / canceled）を付けないと、翌日には出なくなる（[ADR-0010](0010-routine.md) は「その日のうちに closed か canceled にする」としている）。実行し忘れに気づけない
- 振り返りを書く型がなく、デイリーノートに毎回見出しを手で書いている

## 決定

### ボード

- 「Not done」の欄（未完了の一覧と持ち越しの操作）をやめる。ADR-0189 の「今日のボードの Not done の欄は残す」を置き換える
- ボードの末尾に「Close board」のボタンを置く（レーンの下）。押すと、次の 3 つを行う
  1. 同じ Today の画面の中で、Closing の画面に移る
  2. 今日のデイリーノートを右のペインで開く（なければ作る。すでに開いているタブがあれば、それを出す）
  3. デイリーノートの本文の冒頭に、振り返りの型を入れる（下の「振り返りの型」）
- 記録（`## Task board`）は、Closing の画面の末尾の「Finish closing」で書く（今の Close board と同じ処理）。closing の routine を片付けてから書けるように、Close board のボタンでは書かない。書いた後は「Closed」と「Reopen」を出す（今と同じ）

### Closing の画面

- Today の画面の中の 1 つの画面にする。Calendar → Pick → Board の段階表示には入れず、出している間は段階表示を隠す。上の「← Board」でボードに戻る
- どれも 1 行の一覧にする（カードにしない。行の高さを詰める）。各行は、status のボタン・題・小さい付記（親の ID、その日の作業時間など）だけ。題を押すとノートを開く
- 上から次の順に出す

  | 節 | 中身 |
  |---|---|
  | 見出し | `Closing · 11/17 TUE`、← Board、その日の作業時間の合計（worklog） |
  | Closing routines | その日に出てくる、category が `closing` の routine（並び順）。status のボタンで closed にする。すべて片付いたら、節の見出しにチェックを出す |
  | Tasks | その日のボードのもの、その日に closed / canceled にしたもの（statuslog。ボードに載せていないものも含む）、その日の routine（closing 以外）を、群に分けて出す。群の見出しだけに、アイコンと色を付ける（行には付けない） |
  | Notes | その日に作った・変えたノート（下の「ノート」）。作ったものには `new` を付ける |
  | 末尾 | 「Finish closing」（記録を書く）。書いた後は「Closed」「Reopen」 |

- Tasks の群（上から。件数が 0 の群は出さない）

  | 群 | 入るもの | アイコン・色 |
  |---|---|---|
  | Closed | status が closed のもの、結果が closed の routine | `check-circle-2`・成功の色 |
  | Not done | open / in-progress のもの（記録では「持ち越し」と書く）、結果のない routine | `circle-dashed`・注意の色 |
  | Waiting | waiting / delegated のもの | `hourglass`・情報の色 |
  | Canceled | canceled / someday のもの、結果が canceled の routine | `x-circle`・弱い色 |

  行の付記は、サブなら親の ID、その日の作業時間があればその時間。Not done の行にも status のボタンを出す（その場で閉じられる）。持ち越しの操作は出さない
- ノートは、その日に変えた md のうち、タスク管理のデータ（`daily/`・`issue/`・`routine/`・`member/`・`preset/`）、`tmp/`、`template/`、隠しパスを除いたもの。変えた日はファイルの更新時刻で決める（frontmatter の `updated` はコミットのときに付くので、その日のうちには当てにならない）。作ったかは frontmatter の `created` の日付で決める。新しい順に出す

### 振り返りの型

- 型は md のスニペットに書く。上流の既定は `.kit/templates/snippet/daily-review.md`、子は `template/snippet/daily-review.md` を同じ名前で置くと、そちらが優先する（[ADR-0060](0060-snippet-slash-insert.md) の重ね方と同じ）。`/` でも挿入できる
- 最初の型は次のとおり

  ```md
  ## 日次振り返り

  ### 何をしたか
  - 

  ### Keep
  - 

  ### Problem → Try
  - 

  ---
  ```

- 入れる場所は frontmatter の直後（本文の先頭）。本文の既にある内容は変えない。型の最初の見出し（`## 日次振り返り`）がすでに本文にあれば入れない（何度押しても 1 回だけ）
- テンプレート変数（`{{...}}`）は展開しない。スニペットの frontmatter は入れない

### routine

- frontmatter に `category`（単一の文字列）を足す。値は `closing` だけ。書かないもの（null）を default と呼ぶ。`default` は予約語で、frontmatter には書かない（書くと検査が問題を出し、default として扱う）。知らない値も、問題を出して default として扱う
- frontmatter に `order`（数）を足す。カテゴリーの中で小さい順に並べ、ないものは後ろに ID の順で並べる
- routine の画面（ヘッダー）で category を選べる（default / closing）
- Routines の一覧を category ごとの群（default → closing）にする。行をドラッグすると、群の中で順番を変え、別の群に落とすと category を変える。落とした群の routine の `order` を 1 から振り直して書く
- ボードの routine の欄には、default の routine だけを、この順で出す。closing の routine は Closing の画面に出す
- ボードの routine のカードに、issue と同じ status のボタンを出す。open なら closed にする（チェックのアイコン）、closed / canceled なら open に戻す（↩）

### routine の積み残し

- 実行予定日（`routineOccursOn` が真の日）を過ぎて、その日のボードに結果のない routine を「積み残し」とする。結果（closed / canceled）を付けるまで出し続ける。ADR-0010 の「その日のうちに closed か canceled にする」を置き換える
- 積み残しは、Today の Calendar の段階の Missed に出す。Calendar の日（scheduled）の Missed とは節を分け、「Routines」の節にする（件数は段階の件数に入れるので、残っている間は段階を飛ばさない）。行は予定日ごとに 1 行にし（同じ routine が 2 日残っていれば 2 行）、どの日の分かを行の先頭の日付で示す。並びは日付の古い順、同じ日は routine の並び順。行ごとに Close と Cancel を出す
- 結果は、もとの日のボードに書く（ボードの操作ログ。デイリーノートの本文は変えない）。締めた後の過去のボードの記録は書き直さない
- 数え始めは、routine の `start`（なければ作った日）と、この変更を出した日（定数）の遅いほう。それより前の結果のない日は、積み残しにしない（今までの routine が一度に大量に出ないように）
- 一時停止した routine と、`end` を過ぎた日は数えない

## 理由

- Not done の欄は、レーンの繰り返しで、ADR-0189 の後はほとんど操作の意味がない。締めのボタンだけを末尾に残せば、一日の流れの最後に置ける
- 振り返りは、一日に何をしたかが見えてから書くものなので、作業の一覧とデイリーノートを並べて出す。一覧は全体を一目で見るためのもので、行を詰め、色とアイコンは群の見出しだけに付けて、読む負担を減らす
- 記録を末尾のボタンで書くのは、closing の routine の結果を記録に含めるため。押し忘れても ADR-0189 のとおり困らない
- 型をスニペットにすると、既存の上流と子の重ね方で、子が自分の型に変えられる。新しい置き場所を作らずに済む
- routine の category と順番は、ボードと Closing の画面に出す場所と順番を決めるためのもの。カテゴリーを固定の値にするのは、値によって出す場所が決まるため（自由な値では出す場所が決まらない）
- 積み残しは、定期の実行漏れに気づくための仕組み。Calendar の Missed は「その日にやるはずだったもの」の置き場所なので、routine もそこに置く

## 却下した案

- **Close board を押したときに記録も書く**: closing の routine を片付ける前に記録が書かれる。書き直すと、デイリーノートの本文を何度も変えることになる
- **振り返りの型を pkm-task の設定（文字列）に持つ**: md で編集できず、子と上流の重ね方からも外れる
- **型をデイリーノートの末尾に入れる**: 依頼が冒頭。振り返りを一日の要約として先頭で読めるようにする
- **category を自由な値にする**: 値ごとの出し場所が決まらない。必要になったら値を足す
- **積み残しを routine ごとに 1 行にまとめる**: どの日の分を片付けたかが分からない。日ごとに結果を付けられない
- **積み残しを Calendar の Missed と同じ表に混ぜる**: issue とサブは Calendar の日を選び直せるが、routine は結果を付けるだけで、操作が違う
- **積み残しをボードの routine の欄に出す**: 同じ routine が今日の分と過去の分で 2 枚になり、カードの鍵（routine の ID）がぶつかる。過ぎた予定は Calendar の Missed で扱うという今の考えにも合わない
- **積み残しを過去の全期間で数える**: 導入した日に、今までの結果のない日がすべて出る
- **積み残しを直近 N 日だけで数える**: N 日を過ぎると黙って消え、実行漏れを避けるという目的に合わない

## 影響

- ADR-0189 の「今日のボードの Not done の欄は残す」、ADR-0010 の「その日のうちに closed か canceled にする」を、この ADR で置き換える
- routine の frontmatter に `category` と `order` を足す（どちらも任意。既存の routine はそのまま default・ID 順で動くので、子への移行はない）。テンプレートの `routine.md` は変えない
- 検査（`lint`・MCP の読み取り）が `category` と `order` を読む
- MCP: `get_overview` に積み残しの routine の件数を足す。過去の日の routine の結果を付ける既存の操作で片付けられるかを確かめ、足りなければ足す
- プロダクトの文書（Today、ボード、締めの場面、routine）と task-coach の夕の手順を直す
- `.kit/changes/` に子から見える変更を書く
