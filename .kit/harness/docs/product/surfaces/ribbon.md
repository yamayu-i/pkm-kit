# リボン

- 種類: リボン（Obsidian の左端のボタン）
- 場面: [朝の計画](../jobs/task-plan-day.md)、[ノートを書き始める](../jobs/note-write.md)、[端末間の同期](../jobs/sync-devices.md)

## 今の振る舞い

| ボタン | 出すプラグイン | 動き |
|---|---|---|
| 今日のデイリーノートを開く（`calendar`） | vault-ribbon | なければテンプレートから作って開く |
| Daily を開く（`calendar-check`） | vault-ribbon | [Daily](task-daily.md) を開く |
| テンプレートから新規ファイルを作成 | vault-template | [テンプレートから作成](template-create.md) |
| issue をまとめて作成 | vault-task | [issue をまとめて作成](task-capture.md) |
| Git: pull / Git: push | vault-git | [Vault Git](git-sync.md) |

- 最初の 2 つは続けて並ぶ。呼ぶ先のプラグインが無効なら、そう知らせる
- コアプラグインのデイリーノートは無効にしている

## 使う概念

[デイリーノート](../concepts/note-daily.md)

## 根拠

[ADR-0029](../../../../src/docs/adr/0029-ribbon-plugin.md)、[ADR-0023](../../../../src/docs/adr/0023-template-id-and-daily.md)
