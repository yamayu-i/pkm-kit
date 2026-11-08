# セキュリティチェック 2026-11-08（PKM Updates とリボン）

- 対象 commit: 755a530
- 前回: 2026-11-08（0b43cc7）
- 結果: pass

新しいプラグイン pkm-updates（`src/obsidian/` で Vault への書き込みあり）を足し、pkm-ribbon がほかのプラグインのインスタンスを `app.plugins.getPlugin` で引くようにし、ビルド設定（pkm-ribbon の `styles.css`）と `security-scan.mjs` の対象を変えたので行った（ADR-0070）。

## 機械的チェック

- `pnpm security:scan`: 8/8 pass。pkm-updates を再現性と require の検査の対象に足し（`allowedRequires` は `obsidian` だけ）、pkm-ribbon の対象に `styles.css` を足した
- `pnpm check`: 成功（pkm-git 85、pkm-task 285、pkm-template 154、pkm-html 13、pkm-ribbon 6、pkm-updates 16、design 69、shared 17 件）。`node .claude/scripts/verify.mjs`: すべて成功

## 目視レビュー

- **認証情報・通信**: 触れていない。pkm-updates・pkm-ribbon は通信しない: 問題なし
- **ファイル書き込み**: pkm-updates の書き込みは Viewed の記録だけ。パスは `updates/<端末名>/YYYY-MM.jsonl` で、端末名は `sanitizeDeviceName`（`/` などを置き換え、先頭の `.` を除く）を通し、`normalizePath` してから Vault の API（`createFolder`・`create`・`process`）で書く。Vault の外や隠しパスには書かない。中身は `JSON.stringify` の 1 行を追記するだけで、既存の行を書き換えない: 問題なし
- **データ消失**: 追記だけで、端末別のファイルなので同期でぶつからない: 問題なし
- **プラグイン間の呼び出し**: pkm-ribbon は `getPlugin(<コマンドの接頭辞>)` の `getRibbonBadge` を、自分の表にあるコマンドについてだけ呼ぶ。戻り値は数として検査し（`badgeText`）、例外は捕まえてバッジを出さない。pkm-updates は端末名を pkm-task・pkm-git の設定から読むだけ（書かない）: 問題なし
- **UI**: バッジは `createElement` と `textContent` で出す。PKM Updates は Preact でノートのタイトルを文字として描く（HTML を入れない）: 問題なし
- **サプライチェーン**: lockfile で新しく入ったパッケージはない（pkm-updates の importer が、既存と同じ版の preact と開発用の依存を使うだけ）。`allowBuilds`・`minimumReleaseAge` は変わらない。バンドル: pkm-updates 70,654 バイト（新規。pkm-task と pkm-template の core を束ねる分）、pkm-ribbon 3,879 バイト（バッジの分だけ増えた）、pkm-git・pkm-task・pkm-template はリボンの登録を消した分だけ減った

## 依存

- `pnpm outdated`: preact 11.2.0 がある（メジャー。脆弱性の修正ではないので上げない）。lockfile で増えたパッケージはない

## 対応したこと / 残課題

- 残課題: モバイルで、リボンのバッジが出るか（モバイルのリボンはメニューに畳まれる）と、PKM Updates の Viewed の書き込みを実機で確かめる
