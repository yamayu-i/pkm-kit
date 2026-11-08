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
- ラベルは英語

## 使う概念

[ノートの type](../concepts/note-type.md)、[デイリーノート](../concepts/note-daily.md)、[wiki](../concepts/wiki-page.md)

## 根拠

[ADR-0026](../../../../src/docs/adr/0026-note-views.md)、[ADR-0027](../../../../src/docs/adr/0027-hide-properties-english-labels.md)、[ADR-0045](../../../../src/docs/adr/0045-tmp-list-view.md)
