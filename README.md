# yamayu-pkm

Obsidian の Vault。同期は自作プラグイン **Vault Git**（`.obsidian/plugins/vault-git/`）、テンプレートからのノート作成は **Vault Template**（`.obsidian/plugins/vault-template/`、設定は `template/config.json`。Obsidian のホットキー設定で「Vault Template: テンプレートから新規ファイルを作成」に `Cmd + N` 等を割り当て可能）で行う。コミュニティプラグインは使わない。

## ノートの書式

素の Markdown で書く（wiki リンクは使わない）。詳細は `.claude/docs/vault-conventions.md`。

- リンク: `[タイトル](folder/note.md)`（Vault ルートからのパス）
- 添付: `asset/` 直下
- デイリーノート: `daily/YYYY/MM/YYYY-MM-DD.md`

## LLM wiki

Claude Code が、取り込んだ資料やデイリーノートをもとに wiki をまとめる。仕組みは `.claude/docs/llm-wiki.md`。

| フォルダ | 内容 |
|---|---|
| `sources/` | 取り込んだ元資料（Claude Code が作り、変更しない） |
| `wiki/` | Claude Code がまとめるページ。目次は `wiki/index.md`、操作の記録は `wiki/log.md` |
| `wiki/feedback.md` | 使っていて気づいたことを書く場所（月 1 回の見直しで読まれる） |

Claude Code への頼み方の例: 「この記事を取り込んで: <URL>」「wiki から〇〇について調べて」「wiki を点検して」「デイリーノートを整理して」。
人が書いたノート（`daily/` など）は、Claude Code が書き換えることはない（末尾にリンクを追記するだけ）。

## Vault Git の使い方

| 操作 | 内容 |
|---|---|
| pull（リボン ↓ / コマンド） | 未コミットの変更を自動コミット → 取り込み。コンフリクトはマーカー入りのまま残して止まらない |
| push（リボン ↑ / コマンド） | リモートが先に進んでいたら何もせずモーダルを出す。そうでなければ自動コミット → push |
| 未解決のコンフリクトを一覧 | マーカー入りのノートとコンフリクト版ファイルを一覧（ステータスバーの「Git: ⚠ 未解決 N」からも開ける） |

コンフリクトの扱い:

- md / txt: `<<<<<<<` マーカー入りでコミットされる。後で PC で直せばよい
- それ以外（`.obsidian` の JSON、画像など）: リモート版を採用し、ローカル版を `名前 (conflict 端末 日時).拡張子` で残す
- 片方で削除・片方で編集: 編集した側を残す

### セットアップ（各端末で 1 回）

1. 設定 → コミュニティプラグイン → 制限モードをオフ（ストアからは何も入れない）
2. 「Vault Git」を有効にする
3. プラグイン設定で、端末名・コミットの名前・メールアドレスを入れる
4. アクセストークンを登録する（GitHub の fine-grained PAT。このリポジトリだけに限定し、権限は Contents: Read and write のみ）。トークンは Obsidian のキーチェーン（SecretStorage）に保存され、`data.json` には入らない。トークンは「トークンを送るホスト」（既定は `github.com`）の `https://` にしか送られない。PC で clone したリポジトリも origin を `https://` にしておくこと（SSH は非対応）

PC: このリポジトリを `git clone` して Vault として開く。

モバイル:

1. 空の Vault を作り、`.obsidian/plugins/vault-git/` に `main.js` と `manifest.json` を（ファイルアプリなどで）コピーする
2. 上の 1〜4 を行い、「初回 clone」にリモート URL（`https://github.com/…/….git`）とブランチを入れる
3. コマンド「リモートをこの Vault に clone（初回のみ）」を実行する

## 開発

`.plugin-src/` にソースがある。Claude Code 用のハーネス（進め方・スキル・検査）は `.claude/` にあり、入口は `.claude/CLAUDE.md`。

```sh
mise install
cd .plugin-src && pnpm install --frozen-lockfile && pnpm check
```
