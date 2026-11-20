# ノートの一覧

- 種類: View（Daily notes、Notes、Sources、Temporary files）
- 開き方: コマンド「Open Daily notes」など。[一覧ペイン](layout-panes.md) に開く
- 場面: [前に書いたノートを探す](../jobs/note-find.md)、[wiki を育てる](../jobs/wiki-grow.md)

## 今の振る舞い

| View | 集めるもの | 列 |
|---|---|---|
| Daily notes | `type: daily` | 日付と曜日、Created |
| Notes | `type: note` | タイトル、Tags、Created |
| Sources | `type: source` | タイトル、Origin、Retrieved、取り込み済みか |
| Temporary files | `tmp/` の下のすべてのファイル（サブフォルダ・Markdown 以外も） | Name（`tmp/` からのパス）、Type（拡張子）、Modified、Size、Delete |

- 場所ではなく type で集める。並べ替え（既定は新しい順）とタイトルの絞り込み。行を押すとノートを開く。`tmp/` の下のノートは、type があっても出さない
- Temporary files だけは場所で集める。既定は更新日時の新しい順で、名前で絞り込む。名前を押すと開く（Obsidian が開けない拡張子は、PC では OS の既定のアプリで開き、スマホでは開けない旨を通知する）。Delete は確認の後に、Obsidian の「削除したファイル」の設定に従って消す。まとめて消す・自動で消すことはしない
- Notes だけは、上のタブで「Table」（上の表）と「Folders」を切り替える。既定は Table で、選んだタブは端末ごとに覚える
- Folders は `note/` を 1 本の木で見せる（[Slides](slide.md) の一覧と同じ見た目）。フォルダの行は開閉し（開いたフォルダは端末ごとに覚える）、名前と中のノートの数を出す。ノートの行はタイトル・Tags・Created。1 段の中はフォルダ（名前の順）が先、ノートは Created の新しい順か Title の順。絞り込むと、当たったノートを平らな行で並べ、フォルダの位置を出す。`note/` の外の `type: note` は、木の最後の「Other locations」に出す
- Folders の操作: 「New folder」（`note/` の直下）、フォルダの「…」から New folder・Rename・Move to…・Delete（中に `.gitkeep` のほかのファイルがないときだけ）、ノートの「…」から Open in new tab・Move to…。PC ではドラッグで、フォルダの行に落とすとそのフォルダへ、行のない所に落とすと `note/` の直下へ動かす。行き先は `note/` とその下だけ。フォルダ名は日本語でもよい
- ラベルは英語

## 使う概念

[ノートの type](../concepts/note-type.md)、[デイリーノート](../concepts/note-daily.md)、[wiki](../concepts/wiki-page.md)

## 根拠

[ADR-0026](../../../../src/docs/adr/0026-note-views.md)、[ADR-0027](../../../../src/docs/adr/0027-hide-properties-english-labels.md)、[ADR-0045](../../../../src/docs/adr/0045-tmp-list-view.md)、[ADR-0213](../../../../src/docs/adr/0213-note-list-folders.md)

## 入力と制約

Daily notes・Notes・Sources は場所より type で集めます。Temporary files は tmp/ 以下を拡張子に関係なく集めます。

## 操作と保存

検索や並べ替え、Notes のタブの切り替えとフォルダの開閉は表示だけの操作です（タブと開閉は端末に覚えます）。Folders の操作は `note/` の下のファイルを動かし、リンクは Obsidian が書き換えます。新しいフォルダには `.gitkeep` を置きます。Temporary files の Delete は確認後に Obsidian の削除設定に従って消します。

## 失敗時と戻し方

tmp/ のノートが Notes に見えないのは仕様です。削除したファイルは Obsidian の削除先を確認します。対応しない拡張子は開けない旨を通知します。

## 端末の違い

Notes の Folders のドラッグは PC だけです。スマホでは「…」の Move to… で動かします。

PC で Obsidian が開けない拡張子は OS の既定アプリへ渡します。スマホでは開ける拡張子が限られます。
