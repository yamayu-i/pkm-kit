# セキュリティチェック 2026-11-20

- 対象 commit: c2fd699
- 前回: 2026-11-20 8fac46a
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、ビルドの再現性、require、pnpm audit）
- `pnpm check`: 型チェック・ビルド・テストがすべて成功

## 目視レビュー

前回からの差分は pkm-template の Notes の一覧（ADR-0213）だけ。

### 認証情報
- 問題なし。認証情報を扱うコードの変更はない

### 通信
- 問題なし。通信のコードの変更はない

### ファイル書き込み
- 問題なし。書き込みは Obsidian の API（`vault.createFolder`・`vault.create`（空の .gitkeep）・`fileManager.renameFile`・`fileManager.trashFile`）だけで、Vault の外に書く経路はない
- 行き先は `moveTarget`・`renameTarget` で note/ とその下のフォルダに限る。フォルダ名は `/ \ :` などを拒否し、`.` で始まる名前（隠しフォルダ、`..`）も拒否する（テストあり）
- 消すのは中に .gitkeep のほかのファイルがないフォルダだけで、ゴミ箱へ送る

### データ消失
- 問題なし。ノートの移動はリンクを Obsidian が書き換える。同じ名前があれば動かさない

### UI
- 問題なし。HTML 文字列を DOM に入れていない（Preact と `createEl` の `text`）

### サプライチェーン
- 依存の変更はない。lockfile の差分なし
- pkm-template の main.js が約 127KB から約 146KB に増えた。Folders の View と操作のダイアログの分

## 依存

`pnpm outdated`: 更新のある依存はなし

## 対応したこと / 残課題

- なし
