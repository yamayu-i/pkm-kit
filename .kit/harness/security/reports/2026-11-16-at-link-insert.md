# セキュリティチェック 2026-11-16

- 対象 commit: d82ab0b
- 前回: 2026-11-16 ec9b8b2（2026-11-16-tickler-open-only）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed。初回は「バンドルが Obsidian の提供するもの以外を require しない」が pkm-template の `@codemirror/view` で失敗した。リンクの印（ADR-0194）に ViewPlugin を使うためで、Obsidian 本体が提供するもの（pkm-task・pkm-markdown と同じ。同梱しない）なので、pkm-template の `allowedRequires` に足した
- `pnpm check`: 型チェック・ビルド・テストすべて成功

## 目視レビュー

差分は ADR-0194（@ でリンクを探して入れ、本文のリンクをインラインビューで描く）。`packages/shared/src/link-*.ts`、pkm-task と pkm-template の `src/obsidian/link-insert.ts`、pkm-template の `creator.ts`（今日の daily を開かずに作る）、両方の esbuild の設定（共有の CSS を続ける）。

- 認証情報・通信: 対象外。通信の追加なし。問題なし
- ファイル書き込み: 新しい書き込みは、@daily で今日の daily を作るときだけ。既存の `createNoteFromTemplate`（Vault の中のテンプレートの生成先）を通り、開かない指定を足しただけ。エディタへの挿入は `editor.replaceSelection`。問題なし
- データ消失: 本文は描き替えるだけで書き換えない（Live Preview の装飾と Reading の DOM）。Reading で描き替えた `a` は、自分の登録で描いたものだけを戻す。問題なし
- UI: HTML 文字列を DOM に入れていない（`createSpan` の `text`、`setText`、`setIcon`）。スライドの題（`deck.html` の `<title>`）も文字として入れ、md のリンクの文字では `[` `]` `\\` を退避する。問題なし
- サプライチェーン: 新しいパッケージはない。shared の devDependencies に `@codemirror/state` 6.7.6 と `@codemirror/view` 6.43.13 を足した（pkm-task・pkm-template と同じ版。lockfile は workspace の参照が増えただけ）。`allowBuilds`・`minimumReleaseAge` は変えていない
- バンドルサイズ: pkm-task と pkm-template の main.js が、検索とチップの分だけ増えた（それぞれ 600〜700 行）。styles.css に共有の CSS（link-chips.css）が続く

## 依存

- `pnpm outdated`: 更新なし
- lockfile: shared の importer に既存の 2 つの参照が増えただけ

## 対応したこと / 残課題

- `scripts/security-scan.mjs` の pkm-template の `allowedRequires` に `@codemirror/view` を足した
