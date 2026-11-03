# ADR-0031: ボードからの status の 1 クリック変更、status のアイコン、取り消し、status の記録

- 状態: 承認（ADR-0009 のカードの status の変え方と、ADR-0014 の task board のカードの並べ方を一部置換）
- 日付: 2026-11-03

## 背景

task board のカードで status を変えるには、バッジを押してメニューを開き、選ぶ、の 2 回の操作が要る。いちばん多いのは open → in-progress と in-progress → closed で、1 日に何度も行う。

あわせて、次の不満と不足があった。

- closed / canceled のカードは打ち消し線で同じ場所に残るので、終わったものが視界に残り続ける
- status の変更は押した瞬間に書き込まれ、誤って押したときに戻す手段がメニューしかない
- status をいつ変えたかの記録がない。worklog の見直し（`reviewWorklogs`）は issue を閉じた日時を受け取れる形になっているが、渡す値がない
- 閉じても記録中のタイマーは止まらない（止め忘れになる）
- status の見分けは色の点だけで、色に頼っている

## 決定

### status のアイコン

- status ごとに、○ を土台にした自作のアイコンを持つ。中の塗りで進み具合を表す

  | status | 形 | 動き |
  |---|---|---|
  | open | 空の ○ | なし |
  | in-progress | ○ の中に右半分の塗り | 中の半円がゆっくり回る（`--vt-duration-spin` で 1 周） |
  | waiting | ○ の中に一時停止の 2 本線 | なし |
  | delegated | 右側が開いた ○ から、中心から外へ矢印が出る | なし |
  | someday | 点線の ○ | なし |
  | closed | 塗った ○ に白抜きのチェック | 閉じた直後だけ、塗りが小さく弾み、チェックを描く |
  | canceled | ○ に斜線 | なし |

- 色は status の印の色（ADR-0006 の緑・青・ピンク・水色・紫・グレー）
- インラインの SVG の部品（`StatusIcon`）にする。Lucide にない形なので、design.md の「アイコンは Lucide」の例外とする
- status のバッジの色の点をこのアイコンに置き換える（すべての画面）
- 動きを減らす設定（`prefers-reduced-motion: reduce`）では動かさない

### カードの「次の status」ボタン

- task board のカードの status バッジ（今の状態。押すとメニュー）の右に、押すとすぐ変わる丸いボタンを置く。ボタンのアイコンは**押した後の** status のアイコンで、ツールチップは「in-progress にする」など
- 次の status（`nextStatuses`）

  | 今 | ボタン |
  |---|---|
  | open | in-progress |
  | in-progress | closed |
  | waiting | in-progress |
  | delegated | in-progress と closed の 2 つ |
  | someday | 出さない |
  | closed / canceled | ↩（戻す）。閉じる前の status に戻す。分からなければ open |
  | routine（結果なし） | closed |
  | routine（closed / canceled） | ↩（結果を外す） |

- 閉じる前の status は、status の記録（下）の、その issue が今の status になった最後の行の `from` で決める

### 完了したカードはボードの下に移す

- 今日のボードのうち、closed / canceled の issue と、結果（closed / canceled）を記録した routine は、グループから外してボードの下の「完了」の欄に出す。グループの置き場所（`groups`）は消さないので、戻すと元のグループに戻る
- 「完了」の欄のカードも同じカードの部品で、↩ で戻せる。完了の欄にはカードを落とせない
- 完了が 0 件なら欄を出さない

### status の変更を取り消すトースト

- プラグインの画面（ボード、一覧、issue 画面など）で status を変えたら、画面の右下に固定でトーストを出す: 「N件のステータスが変更されました。 やり直す ›」
- 5 秒で消える。消える前に別の status の変更があれば、件数を足して 5 秒から数え直す。N は変わった issue / routine の数（同じものを 2 回変えても 1 件）
- 「やり直す」で、トーストに入っているすべての変更を、最初に変える前の値に戻す。issue は status と、その変更で一緒に消した欄（`delegated_to`、`revisit`、cancel で消した期限など）を戻す。routine はボードの結果を戻す
- 戻しても、閉じたときに止めたタイマーは再開しない。タイマーで in-progress にしたものを戻しても、タイマーは止めない
- MCP（AI）からの変更には出さない
- トーストは Obsidian の Notice（右上）ではなく、プラグインの部品（`.vt-toast`）にする。右下に置き、押せるボタンを持つため

### タイマーとの連動

- issue を closed / canceled にしたら、その issue の記録中のタイマーを止める。プラグインの画面と MCP の両方
- open の issue のタイマーを始めたら、その issue を in-progress にする（グループごとの再生も同じ）。open 以外の status は変えない。MCP の `start_timer` も同じ

### status の記録（statuslog）

- issue の status が変わったら、`statuslog/<端末名>/YYYY-MM.jsonl` に 1 行追記する。月は変えた時刻（端末の時刻）の月。書くのはその端末だけで、追記だけを行う（ADR-0004、0020 と同じ）

  ```json
  {"id":"st_0123456789","at":"2026-11-03T01:23:45.678Z","task":"i-6","from":"open","to":"in-progress","via":"ui"}
  ```

  | 欄 | 内容 |
  |---|---|
  | `id` | `st_` + 英数字 10 文字 |
  | `at` | UTC のミリ秒まで |
  | `task` | issue の ID |
  | `from` / `to` | 変える前と後の status |
  | `via` | `ui`（プラグインの画面）/ `timer`（タイマーを始めて in-progress にした）/ `undo`（トーストで戻した）/ `mcp`（AI） |

- 記録するのはプラグインの `TaskWriter.update` と MCP の `update_issue` / `start_timer` を通った変更だけ。frontmatter を手で書き換えた変更や、同期で受け取った変更は記録しない
- status の正本は今までどおり issue の frontmatter（ADR-0002）。記録は後から分析するための履歴で、記録から status を作らない
- routine の結果はボードの操作ログ（ADR-0020）にあるので、ここには書かない
- 端末名がないときは記録しない（status の変更は止めない）
- 読めない行は問題として報告し、その行だけ飛ばす。`pnpm task:lint` でも検査する
- worklog の見直し（`reviewWorklogs`）に、記録から分かる「最後に closed にした日時」を渡す

## 理由

- 多い遷移を 1 回の操作にしつつ、今のバッジとメニューを残すので、任意の status へも今までどおり変えられる。今の状態（バッジ）と押した後の状態（ボタン）を分けるので、アイコンが何を表すかで迷わない
- ○ の塗りの量で進み具合が分かるので、色が見分けにくくても status が分かる
- 完了したものをボードの下に移すと、残っている作業だけがグループに並ぶ。消さずに置いておくので、誤って閉じても戻せる
- 1 クリックで変わると誤操作も増える。取り消しを 1 回の操作にしておけば、確認のダイアログを挟まずに済む
- 記録は端末別の追記だけのファイルなので、同期でコンフリクトしない（ADR-0004、0020）。書く場所を `TaskWriter.update` 1 か所にまとめるので、画面ごとの漏れが出にくい

## 却下した案

- **status のアイコン自体を押すと次へ進む**: 今の状態と押した後の状態が同じアイコンに重なり、何が起きるか分からない
- **closed のカードを同じ場所に残す（今まで）**: 終わったものが視界に残る
- **完了したカードを今日 closed にした issue の別の View に出す**: ボードと行き来する手間が増える。ボードの下に置けば同じ画面で戻せる
- **status の変更のたびに確認のダイアログを出す**: 1 クリックにした意味がなくなる
- **記録をボードの操作ログ（`board/`）に入れる**: ボードの操作ログはボードの状態を作るためのもので、status の変化はボードに載っていない issue にも起きる
- **記録を issue の frontmatter（`closed_at` など）に置く**: 最後の 1 回しか残らず、2 台が同じ issue を変えるとコンフリクトする
- **metadataCache の変更を見て記録する**: 手書きの変更も拾えるが、同期で受け取った他の端末の変更まで二重に記録する
- **Obsidian の Notice で取り消しを出す**: 置き場所が右上に固定で、件数の更新や数え直しができない

## 影響

- 子の Vault に `statuslog/` フォルダが増える（タスク管理のデータ。プラグインが作る）。移行は要らない
- `vault-conventions.md` の配置、`llm-wiki.md` のタスク管理のデータ、プラグインの開発の文書、design.md（アイコンの例外、トースト、`--vt-duration-spin`）を更新する
- MCP の `update_issue` は、status を変えると statuslog に書き、closed / canceled なら記録中のタイマーを止める。`start_timer` は open の issue を in-progress にする
- 同じ端末名を 2 台で使うと、statuslog がコンフリクトしてその操作が読まれなくなる（worklog と同じ制約）
