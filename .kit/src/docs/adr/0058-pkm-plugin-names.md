# ADR-0058: 自作プラグインの名前を vault-* から pkm-* にする

- 状態: 提案
- 日付: 2026-11-08

## 背景

- 自作プラグインは `vault-git`、`vault-task`、`vault-template`、`vault-ribbon`、`vault-html` の 5 つ（ADR-0001、0022、0029、0037）。テーマのスニペットは `vault-theme`（ADR-0016）
- 「Vault」は Obsidian の一般名詞で、Obsidian のコミュニティプラグインにも同じ前置きのものが多い。このキット（pkm-kit）のものだと名前から分からない
- プラグイン ID は、子の Vault の `.obsidian/community-plugins.json`、`hotkeys.json`（`<id>:<command>` のキー）、端末ごとの `.obsidian/plugins/<id>/data.json`（git に入れていない。端末名、vault-git のトークンを指す SecretStorage の ID など）に現れる

## 決定

### 改名するもの

| 種類 | 旧 | 新 |
|---|---|---|
| プラグイン ID・フォルダ（`.obsidian/plugins/`、`.kit/src/packages/`） | `vault-git` / `vault-task` / `vault-template` / `vault-ribbon` / `vault-html` | `pkm-git` / `pkm-task` / `pkm-template` / `pkm-ribbon` / `pkm-html` |
| 表示名（manifest の `name`） | `Vault Git` など | `PKM Git` など |
| スニペット | `vault-theme.css` | `pkm-theme.css` |
| コマンド ID | `vault-task:open-daily` など | `pkm-task:open-daily` など（プラグイン ID から決まる） |
| MCP サーバー名・環境変数 | `vault-task-mcp`、`VAULT_TASK_DEVICE` | `pkm-task-mcp`、`PKM_TASK_DEVICE`（旧名の環境変数も読む） |
| ビルドの環境変数 | `VAULT_*_OUTDIR` | `PKM_*_OUTDIR` |
| CSS のクラス名・View の type など、コードの中の `vault-*` の識別子 | | `pkm-*`（保存されるのは端末ごとの `workspace.json` だけで、開き直せば直る） |

文書・スキル・検査・`.gitignore`・`.kit/owned-paths.json`・`.kit/obsidian-required.json` の記述も新しい名前にする。

### 改名しないもの

- 承認済みの ADR、`CHANGELOG.md`、`.kit/changes/` の既存のファイル、移行、レビューやセキュリティチェックの記録: 書いた時点の名前のまま残す（承認済みの ADR は書き換えない）
- スキル `vault-upgrade`、文書 `vault-conventions.md` など、プラグインでないもの

### 子の Vault の移行（`.kit/migrations/0058-pkm-plugin-names/`）

スクリプトが行う:

- `community-plugins.json` の `vault-*` を `pkm-*` に置き換える（順序と、子が足したプラグインはそのまま）
- `appearance.json` の `enabledCssSnippets` の `vault-theme` を `pkm-theme` に置き換える
- `hotkeys.json` のキー `vault-<名前>:` を `pkm-<名前>:` に置き換える
- この端末の `.obsidian/plugins/vault-*/data.json` を `pkm-*/data.json` へ写す（新しい方がなければ）。古いフォルダに `data.json` だけが残っていれば、そのフォルダを消す

`data.json` は端末ごとで git に入らないので、ほかの端末（モバイルを含む）には移行が届かない。そのため、各プラグインは起動時に自分の `data.json` がなく、古い ID の `data.json` があれば、それを読んで自分の設定として保存する（1 回だけ。古いファイルは消さない）。vault-git のトークンは SecretStorage にあり、`data.json` が持つのはその ID なので、写せばそのまま使える。

### 旧名のプラグインの片付け

- 上流の merge で `.obsidian/plugins/vault-*/` の `main.js` などは消え、`pkm-*/` が届く。古いフォルダに残るのは git に入らない `data.json` だけ
- Obsidian は `community-plugins.json` にない ID を読み込まないので、古い `data.json` が残っても動きに影響しない

## 理由

- キットの名前（pkm-kit）にそろえると、Obsidian の設定画面やコマンドパレットで、どれがキットのものかが分かる
- コマンド ID とスニペット名もプラグイン ID と同じ前置きにそろえないと、名前の規則が 2 つになる
- 端末ごとの `data.json` を移行だけで扱うと、移行を実行しない端末で端末名や vault-git の設定が消えたように見える。プラグインの起動時に引き継げば、どの端末でも同期のあとに開き直すだけで済む

## 却下した案

- **表示名だけを変え、ID は `vault-*` のまま**: 子の設定を変えずに済むが、フォルダ・コマンド ID・ソースの名前と表示名がずれ、改名の目的（キットのものだと分かる）が設定ファイルや Issue では果たせない
- **`pkm-kit-*` にする**: より明確だが長い。コマンド ID（`pkm-kit-template:open-todays-daily`）が長くなり、`pkm-` だけでキットのものと分かる
- **古い ID でも読み込める互換のプラグインを残す**: 2 重に読み込まれる危険があり、残したものの片付けが新しい移行になる
- **移行で `data.json` をすべての端末分扱う**: `data.json` は git に入らないので、移行を実行した端末の分しか扱えない

## 影響

- 5 つのプラグインの `main.js`、`manifest.json`、`styles.css`、スニペット、`.kit/bin/` の CLI（MCP）が変わる。ソースのフォルダも移る
- 子の Vault: 移行 `0058-pkm-plugin-names`。取り込んだあと、各端末で Obsidian を開き直す（同期だけの端末も）。開き直すまでは古いプラグインが動いたまま
- MCP を Claude Code などに `vault-task` の名前で登録している場合、登録名は利用者の設定なので変わらない（変えたいなら利用者が変える）
- 未マージの PR #20 は `.kit/owned-paths.json` のプラグインの成果物のパスに触れるので、どちらかを後で合わせる
