# セキュリティチェック 2026-11-15

- 対象 commit: 01052fa
- 前回: 2026-11-15 の上流レポート
- 結果: pass

## 機械的チェック

pnpm security:scan は 8/8 PASS。依存固定、lockfile、CLI のビルド再現性、危険な API、秘密情報、pnpm audit を確認した。
型チェックとビルドは成功。並列テストの共有キャッシュに ENOTEMPTY が出たため、同じ全テストを workspace-concurrency=1 で順に実行し成功した。スクリプトは TMPDIR=/private/tmp で 158 テスト成功。

## 目視レビュー

CLI は Markdown の生 HTML を文字として扱い、リンクのスキームと認証付き URL を制限する。出力先の Vault 外と symlink を拒否する。UI 画像は合成データから作り、個人の Vault・認証情報を読み込まない。
HTML の閲覧は既存の pkm-html の sandbox・CSP・画像変換を使う。生成器は Node 専用の cli/ に置き、Obsidian のプラグインに同梱しない。通信は行わない。

## 依存

marked 18.2.0 を固定版のビルド時依存として追加。推移的依存と install スクリプトの追加はない。既存の esbuild・Playwright・linkedom・Preact・Obsidian 型定義を再利用した。pnpm outdated の追加報告なし。

## 対応したこと / 残課題

見出し ID の衝突、危険な URL、画像破損、出力先 symlink をテストした。iframe 内の本文に対する表示検査はライト／ダーク・390／1280px で成功した。Obsidian 実機の表示と仕様本文の意味上の一致は、今回の完了条件の変更に従い継続更新の対象とする。
