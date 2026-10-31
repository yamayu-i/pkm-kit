# ADR-0012: issue 画面の構成と、親子関係の編集

- 状態: 承認
- 日付: 2026-10-31

## 背景

issue 画面の構成は最初の構想で決めていたが、ADR に残していなかった。親子関係を設定する場所も決まっていなかった。

## 決定

画面は ADR-0008 のとおり、CodeMirror の block widget として md の先頭に差し込む。上から順に:

1. `created` と更新日時（ファイルの更新時刻。ADR-0002）を右上に横並びで、小さくグレーで表示する
2. ID（status 色のバッジ）と summary（大きめ）。summary はクリックで編集する
3. 左右 2 等分（細い画面では縦並び）
   - status: 横幅いっぱいのバッジ。クリックでプルダウン
   - status-detail: 小さめの濃いグレー。20 文字以内の自由記述。delegated のときは委任先（ADR-0007）も表示し、クリックで member の選択モーダルを出す。status を delegated に変えたときも自動で出す
4. priority と label のバッジ（左詰め）。priority はプルダウン、label は複数選択
5. 予定と期限（左詰め）
   - 今日からの 7 日間のストリップ。上に曜日。土日は枠が少し太い。mid_due は黄色の枠、deadline は赤の枠、deadline より後の日は薄いグレーで塗る。予定の日は緑の背景に白い文字。クリックで on / off。下の「calendar >」で、7 日より先も選べるカレンダーモーダルを開く
   - mid_due と deadline を縦 2 行（`mm/dd (曜日)`）。クリックで編集。色は ADR-0006
6. Parent と Children（左右等分、はみ出しは折り返し、小さめの文字）。summary を表示し、クリックで移動する
7. estimated、実績（按分後。ADR-0005）、残り（左右 3 等分）
   - estimated はクリックで 15m / 30m / 1h / 2h / 5h / 1d から選ぶか、日数（d）を入力する
   - 表記は 60m = 1h、8h = 1d で換算する（例: `2d3h33m`）。実績は読み取り専用
8. セパレータ、worklog（新しい順に 5 件ずつページング、クリックで編集）、セパレータ
9. 本文（ふつうの Markdown エディタ）。新しい issue は `## ToDo`（`- [ ] ` を 1 つ）/ `## Description` / `## Note`

### 親子関係の編集

- **Parent**: 欄の鉛筆ボタンで、issue を検索するモーダル（ID と summary であいまい検索）を出して選ぶ。× で外す
- **Children**: 「+ 子を追加」で、次のどちらかを選ぶ
  - 既存の issue を検索して選ぶ → その issue の `parent` をこの issue にする
  - summary を入力して新しく作る → `parent` がこの issue の新しい issue を作る（Inbox に入る）
- 子を外すときは、子の行の × で、その子の `parent` を消す
- 保存されるのは子の `parent` だけ（`children` は保存しない。ADR-0002）
- 自分自身や自分の子孫は親に選べない（循環を作らない）。閉じた issue も候補に出すが、後ろに並べる
