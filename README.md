# pkm-kit

Obsidian の Vault を、自作プラグインと Claude Code のハーネス（進め方・スキル・検査）で育てるための一式。
このリポジトリから自分の Vault（非公開のリポジトリ）を作り、ここが更新されたらその変更を取り込むと、新しい機能が使える。

- 同期は自作プラグイン **Vault Git**（モバイルでも動く git の pull / push）
- タスク管理は **Vault Task**、テンプレートからのノート作成は **Vault Template**（既定のテンプレートは `.kit/templates/`。各 Vault の `template/` で上書きできる。Obsidian のホットキー設定で「Vault Template: テンプレートから新規ファイルを作成」に `Cmd + N` 等を割り当て可能）
- ノートは素の Markdown で書き、Claude Code が LLM wiki をまとめる
- コミュニティプラグインは使わない

> 上流（このリポジトリ）と各 Vault の分け方の設計は、`.kit/harness/docs/adr/` の ADR-0009〜0011 にある。変更の記録は `.kit/CHANGELOG.md`。

## 新しい Vault を作る

GitHub の fork は使わない（公開リポジトリの fork は非公開にできず、ノートが公開されてしまう）。git の remote で上流とつなぐ。

```sh
# 1. GitHub に空の非公開リポジトリ（例: you/my-vault）を作っておく
git clone https://github.com/yamayu-i/pkm-kit.git my-vault
cd my-vault
git remote rename origin upstream
git remote add origin https://github.com/you/my-vault.git
git push -u origin main

# 2. セットアップ（Node は mise.toml の版。mise install で入る。npm の依存は要らない）
node .kit/setup.mjs            # エスカレーションの方法を尋ねる。--escalation=issue|file|none でも指定できる
node .claude/scripts/verify.mjs
git add -A && git commit -m "vault: セットアップ" && git push
```

`setup.mjs` が行うこと（何度実行しても同じ結果になる。`--dry-run` で予定だけを表示する）:

- `.kit-local/config.json` に、上流を変えないと直らない問題を見つけたときの伝え方（エスカレーションの方法）を書く
- `.kit-local/upstream.json` に、取り込んだ上流のコミットを書く
- `.obsidian/*.json` に、使い心地に必要なキーだけを合わせる（ほかの設定は残す）
- `issue/labels.json`、`issue/board-groups.json`、`.claude/local/CLAUDE.md`（この Vault だけの規約）の初期値を置く（なければ）
- PC の Git CLI でも `updated` を付けるため、`git config core.hooksPath .githooks` を実行する

その後、Obsidian でフォルダを開き、コミュニティプラグインを許可する。モバイルは下の「Vault Git の使い方」のとおり。

自分の Vault では、上流のもの（`.kit/owned-paths.json` に当たるファイル）を変えない（`verify.mjs` が検査する）。テンプレートは `template/` に置けば、上流の既定を上書きできる。

## 上流の更新を取り込む

自分の Vault で、ブランチを切って `upstream/main` を merge し、移行を実行して PR にする。Claude Code では `vault-upgrade` のスキルが手順を持っている（スクリプトで済まない移行の部分は、移行の README に従って直す）。

```sh
git fetch upstream && git checkout -b upgrade-YYYY-MM-DD origin/main
git merge upstream/main
node .kit/migrate.mjs --upstream=upstream/main   # 未適用の移行を実行し、取り込んだコミットを記録する
node .claude/scripts/verify.mjs
```

取り込む変更と移行は `.kit/CHANGELOG.md` にある。PR をマージした後、モバイルは vault-git で pull するだけでよい。

## 仕組み

| パス | 内容 |
|---|---|
| `.kit/src/` | プラグインのソース（pnpm workspace）と、プラグインの ADR・デザインルール |
| `.kit/templates/` | テンプレートの既定（各 Vault の `template/` で、同じ名前のファイルと設定の項目を上書きできる） |
| `.kit/bin/` | Vault で使う CLI（タスク管理の lint・MCP サーバー・worklog の見直し、updated の付与）。ビルド済み |
| `.kit/owned-paths.json` | このリポジトリが持つパス。各 Vault はここに当たるファイルを変えない |
| `.kit/obsidian-required.json` | 各 Vault の Obsidian の設定に必要なキーと値 |
| `.obsidian/plugins/` / `.obsidian/snippets/` | プラグインのビルド成果物と、外観を固定するスニペット（モバイルではビルドできないのでコミットする） |
| `.claude/` | 子向けのハーネス（各 Vault で使う手順・規約・検査）。入口は `.claude/CLAUDE.md`。各 Vault だけの追加は `.claude/local/` と `.claude/skills/local-*` |
| `.kit/harness/` | 上流（このリポジトリ）を開発するためのハーネス。入口は `.kit/harness/CLAUDE.md` |
| `.githooks/` | PC の Git CLI でコミットしたときに、ノートの `updated` を付与するフック |

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
4. アクセストークンを登録する（GitHub の fine-grained PAT。自分の Vault のリポジトリだけに限定し、権限は Contents: Read and write のみ）。トークンは Obsidian のキーチェーン（SecretStorage）に保存され、`data.json` には入らない。トークンは「トークンを送るホスト」（既定は `github.com`）の `https://` にしか送られない。PC で clone したリポジトリも origin を `https://` にしておくこと（SSH は非対応）

PC: 自分の Vault のリポジトリを `git clone` して Vault として開く。コミット時に `updated` を付与するため、`git config core.hooksPath .githooks` を 1 回実行する。

モバイル:

1. 空の Vault を作り、`.obsidian/plugins/vault-git/` に `main.js` と `manifest.json` を（ファイルアプリなどで）コピーする
2. 上の 1〜4 を行い、「初回 clone」にリモート URL（`https://github.com/…/….git`）とブランチを入れる
3. コマンド「リモートをこの Vault に clone（初回のみ）」を実行する

## 開発

`.kit/src/` にソースがある。ビルドすると、`.obsidian/plugins/` の成果物と `.kit/bin/` の CLI が作り直される。どちらもコミットする（CI が、ソースから作り直したものと一致するかを確かめる）。

```sh
mise install
cd .kit/src && pnpm install --frozen-lockfile && pnpm check
node .claude/scripts/verify.mjs   # ハーネスの検査と、所有の境界の検査
```
