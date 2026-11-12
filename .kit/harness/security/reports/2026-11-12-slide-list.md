# セキュリティチェック 2026-11-12

- 対象 commit: d80630d
- 前回: 2026-11-11（3d69a63）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、main.js と .kit/bin の再現、require、pnpm audit）。新しいプラグイン pkm-slide を再現の確認の対象に足した
- `pnpm check`: 型チェック・ビルド・テストがすべて通った（pkm-slide 10、slide 86 ほか）
- `pnpm --filter slide preview:ui`: すべて確かめた（全 61 パターンのはみ出し、外部への要求なし、#thumb、スクリプトなし）

## 目視レビュー

差分: 新しいプラグイン pkm-slide（ADR-0120）、slide の CLI（CSS、--fit の付与、#thumb の目印）、shared の一覧ペインの接頭辞、pkm-view-selector の候補。

### 認証情報・通信
- 問題なし。pkm-slide は通信しない（requestUrl も外部 URL もない）。トークンを扱わない

### ファイル書き込み
- 問題なし。書くのは Vault の中だけで、Obsidian の API（`createFolder`、`create`、`FileManager.renameFile`、`vault.process`、`trashFile`）を通る
- 対象は `slide/` の下に限る。行き先は一覧で見分けた整理のフォルダだけ（`moveTarget`）、名前は英小文字・数字・ハイフンだけ（`nameError`。`..` や `/` を入れられない）
- `index.html` の書き換えは `<html>` の開始タグの `data-deck` の値だけ。値は slide のビルドと同じ方法でエスケープする（`retargetDeck`。テストでビルドの出力と一致を確かめる）。`data-deck` がなければ書き換えずに知らせる
- 消すのはデッキのない整理のフォルダだけで、ゴミ箱に送る（`trashFile`）

### データ消失
- 問題なし。上書きは `data-deck` の 1 属性だけ。動かす操作は Obsidian の改名で、ノートのリンクは Obsidian が書き換える

### UI
- 問題なし。DOM は preact で作り、HTML 文字列を入れない。縮小の iframe は `sandbox=""`（スクリプト・同一オリジン・フォーム・ポップアップをすべて許さない）で、src は Vault のリソースのパス。index.html の CSP（`default-src 'none'`）も効く

### スライドの CLI
- 問題なし。`--fit` は数値だけの style をビルドが付ける（デッキの style の検査の後）。`#thumb` は CSS の `:target` だけで、スクリプトの変更はない

### サプライチェーン
- lockfile の差分は新しい workspace パッケージ pkm-slide の importer だけ。新しいパッケージ・版はない（preact、esbuild、linkedom、obsidian、typescript、vitest、@types/node はほかのパッケージと同じ版）
- `allowBuilds` は esbuild のみ、`minimumReleaseAge` は残っている

## 依存

- `pnpm outdated`: 出力なし
- 増えたパッケージ: なし

## 対応したこと / 残課題

- なし。実機で確かめること（ADR-0120）: Obsidian の iframe が app:// のリソースのパスを sandbox で開けるか（開けなければ縮小が空になるだけで、ほかの操作に影響しない）
