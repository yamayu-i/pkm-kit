# セキュリティチェック 2026-11-27

- 対象 commit: c916a97
- 前回: 2026-11-27 0200d78（2026-11-27-sub-bulk-and-period.md）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、main.js と .kit/bin の再現性、require、pnpm audit）
- `pnpm check`（型チェック・ビルド・テスト）: すべて通過
- `node .claude/scripts/verify.mjs`: 通過

## 目視レビュー

対象は前回からの差分。ADR-0249（pkm-template の @file・/file）、ADR-0247（pkm-task の estimated の 0 と delegated のサブ）、ADR-0245 の残り（前回は未コミットの状態で見た）。

### 認証情報
- 問題なし。認証情報・SecretStorage・pkm-git に触れる変更はない

### 通信
- 問題なし。`requestUrl`・`fetch`・外部 URL の追加はない

### ファイル書き込み
- ADR-0249 で、Vault への書き込みが 1 つ増えた: `vault.createBinary("asset/<名前>")` と、なければ `vault.createFolder("asset")`
  - 名前は `assetFileName` を通す。`/`・`\` などをハイフンにするので、asset/ の下にしか書かない
  - 点だけの名前（`..`）がそのまま残り、`asset/.` を指すことが分かった。先頭・末尾の点を除くよう直し、テストを足した（c916a97）
  - 既存のファイルと名前が重なれば `-N` を付けるので、上書きしない（大文字小文字を区別しない比較）
  - 1 ファイル 20MB を超えるものは読み込まずに除く
- pkm-task の変更は、既存の frontmatter の書き込みの経路を使っており、新しい経路はない

### データ消失
- 問題なし。既存のファイルを上書き・削除する経路の追加はない

### UI
- 問題なし。HTML 文字列を DOM に入れていない。ファイル選択の `<input type="file">` は `createElement` で作り、選択の後に外す

### サプライチェーン
- 依存・lockfile・`pnpm-workspace.yaml` の差分はない
- pkm-template の main.js は 155,857 → 160,289 バイト。添付のコマンドと、main の取り込みで入った共有部分（link-chips・date-input）の増加で説明できる

## 依存

- `pnpm outdated`: 更新のある依存なし
- lockfile の差分なし

## 対応したこと / 残課題

- 対応: 点だけのファイル名が `asset/.` を指す問題を直した（c916a97）
- 残課題: なし
