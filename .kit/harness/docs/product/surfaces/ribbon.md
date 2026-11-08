# リボン

- 種類: リボン（Obsidian の左端のボタン）
- 場面: [朝の計画](../jobs/task-plan-day.md)、[ノートを書き始める](../jobs/note-write.md)、[端末間の同期](../jobs/sync-devices.md)、[思いつきの捕捉](../jobs/task-capture.md)

## 今の振る舞い

自作プラグインのボタンは、すべて pkm-ribbon が次の順に出す。押すと、そのボタンのプラグインのコマンドを呼ぶ。

| 順 | ボタン | 動き |
|---|---|---|
| 1 | Open today's daily note（`calendar`） | なければテンプレートから作って開く |
| 2 | Open Today（`sun`） | [Today](task-today.md) を開く |
| 3 | Open PKM Updates（`bell`） | [PKM Updates](updates.md) を開く。前回の確認から変わったノートの数のバッジが付く（100 件以上は 99+、0 件は出ない） |
| 4 | Capture issues（`list-plus`） | [Capture issues](task-capture.md) |
| 5 | Git: pull（`arrow-down-to-line`） | [PKM Git](git-sync.md) |
| 6 | Git: push（`arrow-up-from-line`） | [PKM Git](git-sync.md) |

- 並びはプラグインの読み込み順によらず、いつもこの順
- 呼ぶ先のプラグインが無効なら、押したときにそう知らせる。バッジも出ない
- テンプレートからの作成のボタンはない（コマンドとホットキーで使う）
- コアプラグインのデイリーノートは無効にしている

## 使う概念

[デイリーノート](../concepts/note-daily.md)

## 根拠

[ADR-0029](../../../../src/docs/adr/0029-ribbon-plugin.md)、[ADR-0023](../../../../src/docs/adr/0023-template-id-and-daily.md)、[ADR-0070](../../../../src/docs/adr/0070-pkm-updates.md)
