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
| 5 | Git: Sync（`refresh-cw`） | [PKM Git](git-sync.md) の同期（取り込んでから送る） |

- 並びはプラグインの読み込み順によらず、いつもこの順
- 呼ぶ先のプラグインが無効なら、押したときにそう知らせる。バッジも出ない
- テンプレートからの作成のボタンはない（コマンドとホットキーで使う）
- コアプラグインのデイリーノートは無効にしている

## 使う概念

[デイリーノート](../concepts/note-daily.md)

## 根拠

[ADR-0029](../../../../src/docs/adr/0029-ribbon-plugin.md)、[ADR-0023](../../../../src/docs/adr/0023-template-id-and-daily.md)、[ADR-0070](../../../../src/docs/adr/0070-pkm-updates.md)、[ADR-0089](../../../../src/docs/adr/0089-git-auto-sync.md)

## 入力と制約

ボタンの順は固定の登録表から作ります。バッジは対応するプラグインが持つ件数です。

## 操作と保存

押すと登録済みのコマンドを実行します。リボン自体に業務データを保存せず、結果は呼び出した機能が保存します。

## 失敗時と戻し方

対応するプラグインが無効だと通知します。件数を取得できないときはバッジを出しません。

## 端末の違い

PC とスマホで同じコマンドの入口を使います。ホットキーからも同じ機能を呼び出せます。
