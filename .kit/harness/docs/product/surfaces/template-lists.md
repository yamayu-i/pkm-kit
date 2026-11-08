# ノートの一覧

- 種類: View（Daily notes、Notes、Sources）
- 開き方: コマンド「Daily notes を開く」など。[一覧ペイン](layout-panes.md) に開く
- 場面: [前に書いたノートを探す](../jobs/note-find.md)、[wiki を育てる](../jobs/wiki-grow.md)

## 今の振る舞い

| View | 集めるもの | 列 |
|---|---|---|
| Daily notes | `type: daily` | 日付と曜日、Created |
| Notes | `type: note` | タイトル、Tags、Created |
| Sources | `type: source` | タイトル、Origin、Retrieved、取り込み済みか |

- 場所ではなく type で集める。並べ替え（既定は新しい順）とタイトルの絞り込み。行を押すとノートを開く
- ラベルは英語

## 使う概念

[ノートの type](../concepts/note-type.md)、[デイリーノート](../concepts/note-daily.md)、[wiki](../concepts/wiki-page.md)

## 根拠

[ADR-0026](../../../../src/docs/adr/0026-note-views.md)、[ADR-0027](../../../../src/docs/adr/0027-hide-properties-english-labels.md)
