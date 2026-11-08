# セキュリティチェック 2026-11-08（インラインテンプレート）

- 対象 commit: dbb71fe
- 前回: 2026-11-08（5041633）
- 結果: pass

pkm-template の `src/obsidian/` に、`@` でのエディタへの挿入と `template/inline/` の読み込みを足したので行った（ADR-0067）。

## 機械的チェック

- `pnpm security:scan`: 8/8 pass
- `pnpm typecheck`・`pnpm build`・テスト（パッケージを 1 つずつ）: 成功（pkm-git 85、pkm-task 285、pkm-template 154、pkm-html 13、pkm-ribbon 3、design 67、shared 17 件）。`node .claude/scripts/verify.mjs`: すべて成功

## 目視レビュー

- **認証情報・通信**: 触れていない: 問題なし
- **ファイル書き込み**: ファイルへの書き込みはない。挿入は開いているエディタへの `replaceRange` だけ。読み込みはスニペットと同じ関数で、フォルダ名だけ固定の `template/inline/`・`.kit/templates/inline/` に変えた（直下の md だけ。`/` を含む名前は除く）: 問題なし
- **コードの実行**: 本文は既存の `renderTemplate` で文字列として展開するだけ: 問題なし
- **UI**: 候補は `el.setText` で出す（HTML を入れない）: 問題なし
- **サプライチェーン**: 依存・lockfile・ビルド設定は変えていない。pkm-template のバンドルは 86,740 → 88,384 バイト（`@` の処理の分）

## 依存

- `pnpm outdated`: 更新なし

## 対応したこと / 残課題

- 残課題: モバイル（iOS / Android の入力方式）で、`@` の入力が `input.type` として届き候補が出るかは実機で確かめる
