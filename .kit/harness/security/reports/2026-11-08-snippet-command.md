# セキュリティチェック 2026-11-08

- 対象 commit: 3d85828
- 前回: 2026-11-08 / 5041633
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報・危険な API・依存の固定・lockfile・ビルドの再現性・require・pnpm audit）
- `pnpm check`（`verify.mjs --plugin`）: 成功

## 目視レビュー

対象は pkm-template のスニペットの `command`（ADR-0094）。`src/core/snippet.ts` と `src/obsidian/SnippetSuggest.ts`、上流の既定のスニペット `.kit/templates/snippet/new-drawio.md`。

- 認証情報: 扱わない。問題なし
- 通信: 足していない。問題なし
- ファイル書き込み: スニペット自体はファイルを書かない。エディタの範囲の置き換えだけ。図のファイルの作成は今までどおり pkm-drawio（ADR-0064 の検査済みの経路）。問題なし
- コマンドの実行: スニペットの `command` は `<プラグイン ID>:<コマンド>` の形だけを受け付け、`app.commands.executeCommandById()` に渡す（pkm-ribbon・pkm-updates と同じ経路）。実行できるのは Obsidian に登録済みのコマンドだけで、任意のコードは実行できない。スニペットを置けるのは上流の `.kit/templates/snippet/` と子の `template/snippet/`（Vault の持ち主のもの）だけ。問題なし
- データ消失: 実行できないときは消した `/…` を戻す。DailyNote の既存の本文は変えない（打った文字の置き換えだけ）。問題なし
- UI: 通知は `Notice` の文字列だけ。HTML を入れていない。問題なし
- サプライチェーン: 依存の変更なし。バンドルの増加は小さい（main.js の差分 33 行）
