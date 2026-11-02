# ADR-0010: プラグイン群が Vault のセットアップの仕組みを持つ

- 状態: 提案
- 日付: 2026-11-02
- 前提: [ADR-0009](0009-split-plugin-repo.md)（プラグインを別リポジトリ `my-vault-plugins` に切り出す）

## 背景

ADR-0009 でプラグインを `my-vault-plugins` に切り出す。このリポジトリだけを使って、別の新しい Vault でも、この Vault と同じ使い心地を実現したい。

しかし今の使い心地は、プラグインの成果物だけでは揃わない。この Vault に置いた次のものに支えられている。

| 種類 | この Vault にあるもの | なければどうなるか |
|---|---|---|
| Obsidian の設定 | `app.json`（Markdown リンク、`showInlineTitle: false`、添付は `asset/` など）、`core-plugins.json`（Canvas・Bases・Templates などを無効）、`daily-notes.json`、`community-plugins.json`（3 つを有効）、`appearance.json` | プラグインのヘッダーと Obsidian 標準のタイトルが二重に出る。ADR-0016 で固定した外観にならない |
| 外観 | `.obsidian/snippets/vault-theme.css` | 色がデザインのトークンと合わない |
| テンプレート | `template/file/*.md`（13 個）と `template/config.json` | vault-template に「有効なテンプレートがありません」と出る。issue / routine / member を、vault-task が読める形で作れない |
| タスク管理の初期データ | `issue/labels.json`、`issue/board-groups.json` | 動きはするが、label の色やボードのグループがない |
| PC の Git フック | `.githooks/pre-commit` と `.claude/scripts/stamp-updated.mjs`・`lib/updated.mjs` | PC の Git CLI でコミットしたとき、updated が付かない（ADR-0028） |
| `.gitignore` | 各プラグインの `data.json` を除く行 | 端末ごとの設定がコミットされる |
| Claude Code 向け | task-coach・worklog-review のスキル、MCP サーバーの設定、ノート規約 | AI からのタスク操作ができない |

このうち、ノートの規約と PC の updated の付与の規則は、プラグインと Vault の両方にまたがる。updated の規則は今、vault-git（`stamp/updated.ts`）と Vault（`.claude/scripts/lib/updated.mjs`）の 2 か所に同じものがあり、表の資料を共有して揃えている。

## 決定

### 1. `my-vault-plugins` に「キット」を置く

プラグインのリポジトリに `kit/` を置き、Vault に置くものを次の 2 種類に分けて持つ。

| 区分 | 意味 | 取り込みのときの扱い |
|---|---|---|
| **管理するファイル** | プラグインのリポジトリが正本。Vault では手で変えない | 毎回上書きする。取り込みの記録（`.vault-plugins/lock.json`）にハッシュを残す |
| **初期のファイル** | 最初の 1 回だけ置く。置いた後は Vault の持ち物で、自由に変えてよい | Vault になければ置く。あれば変えない。キットの版と違うときは、違いを報告だけする |

| ファイル | 区分 |
|---|---|
| `.obsidian/plugins/<id>/` の成果物 | 管理する |
| `.obsidian/snippets/vault-theme.css` | 管理する |
| `.vault-plugins/bin/`（`lint.mjs`、`mcp.mjs`、`worklog-review.mjs`、`stamp-updated.mjs`） | 管理する |
| `.vault-plugins/lib/updated.mjs`（updated の規則。Vault のスクリプトから使う） | 管理する |
| `.vault-plugins/lock.json`（取り込みの記録） | 管理する |
| `.githooks/pre-commit`（`.vault-plugins/bin/stamp-updated.mjs` を呼ぶだけ） | 管理する |
| `template/file/*.md`、`template/config.json` | 初期 |
| `issue/labels.json`、`issue/board-groups.json` | 初期 |
| `.gitignore` に足す行 | 初期（足りない行だけを足す） |
| Obsidian の設定の JSON | 「必要なキー」だけを扱う（次の 2 を参照） |

### 2. Obsidian の設定は「必要なキー」だけを合わせる

`.obsidian/*.json` は、Obsidian 本体も書き換えるし、ユーザーの好みも入る。そのためファイルごと上書きはしない。

- キットは、使い心地に必要なキーと値だけを持つ。例: `app.json` の `useMarkdownLinks: true` と `showInlineTitle: false`、`community-plugins.json` の 3 つのプラグイン、`appearance.json` の `cssTheme` / `accentColor` / `enabledCssSnippets`
- 取り込みのときは、ほかのキーを残したまま、必要なキーだけを書き込む。書き込んだキーは一覧にして報告する
- 書くときは Obsidian と同じく、末尾に改行を付けない（`check-obsidian-config.mjs` と合わせる）
- `verify.mjs` は、取り込みの記録に書いた必要なキーが、今もその値になっているかを照合する（ADR-0009 の `appearance.json` の照合を、ほかの設定にも広げたもの）

### 3. 取り込みのコマンドを、新しい Vault の初期化にも使う

コマンドは ADR-0009 の `pnpm vault:install --vault <パス>` だけにする。新しい Vault でも、既存の Vault の更新でも同じものを使い、何度実行しても結果が同じになるように作る。

- 管理するファイルは毎回書く
- 初期のファイルは、ないものだけを置く
- Obsidian の設定は、必要なキーだけを合わせる
- 取り決めの検査は、置いた後の状態に対して行う
- `--dry-run` を付けると、何を書くかを表示するだけで、書かない

新しい Vault の手順はプラグインのリポジトリの README に書く。

1. 空のフォルダ（git の作業ツリーでもよい）を用意する
2. `my-vault-plugins` を clone し、`pnpm install --frozen-lockfile` を実行してから `pnpm vault:install --vault <パス>` を実行する
3. Obsidian でフォルダを開き、コミュニティプラグインを許可する
4. （git で同期する場合）vault-git の設定で、リモートとトークンを設定する。トークンは SecretStorage に置かれる
5. （PC の Git CLI を使う場合）`git config core.hooksPath .githooks` を 1 回実行する

### 4. updated の規則の正本をプラグインのリポジトリに一本化する

- 正本は vault-git の `stamp/updated.ts` にする
- そこから、PC の Git フック用の CLI（`.vault-plugins/bin/stamp-updated.mjs`）と、Vault のスクリプトが読むライブラリ（`.vault-plugins/lib/updated.mjs`）をビルドする
- この Vault の `.claude/scripts/lib/updated.mjs` と `stamp-updated.mjs` は消し、`wiki-lint.mjs` などは `.vault-plugins/lib/updated.mjs` を読むように直す
- 表の資料（`updated-cases.json`）はプラグインのリポジトリに移す。2 つの実装を表で揃える仕組みは要らなくなる

### 5. Claude Code 向けは、別に指定したときだけ置く

`vault:install --with-claude` と指定したときだけ、次のものを置く。

| ファイル | 区分 |
|---|---|
| `.claude/skills/task-coach/`、`.claude/skills/worklog-review/` | 管理する |
| `.mcp.json` の `vault-task` の項目（`.vault-plugins/bin/mcp.mjs` を指す） | 必要なキーだけを合わせる |
| `.claude/CLAUDE.md`（ノート規約の要約と、上の 2 つのスキルへのリンク） | 初期 |

- 2 つのスキルはプラグインの使い方そのものなので、正本をプラグインのリポジトリに移す
- この Vault でも `--with-claude` で取り込む。スキルを直すときは、プラグインのリポジトリで直す。この Vault の harness-review が改善を提案するときは、プラグインのリポジトリに Issue を立てる
- この Vault の CLAUDE.md とノート規約は、この Vault の持ち物のまま。初期のファイルなので、取り込みで上書きされない

### 6. 初期のファイルの中身は、この Vault から作る

- キットの初期のテンプレートは、今の `template/file/` と `template/config.json` を元にする
- 個人に依存するもの（label の名前、ボードのグループ、デイリーノートの見出しなど）は、汎用の例に置き換える
- テンプレートの取り決めの検査（ADR-0009 の 3）は、プラグインのリポジトリのテストではキットの初期のテンプレートに対して行う。Vault に対しては `vault:install` と `vault:check` で行う

## 理由

- 管理するファイルと初期のファイルを分けると、2 つの目的を両立できる。新しい Vault は 1 回のコマンドで揃う。既存の Vault では、ユーザーが育てたテンプレートや設定を壊さずに、プラグインだけを更新できる
- Obsidian の設定をファイルごと持つと、Obsidian の更新やユーザーの好みと衝突する。必要なキーだけにすれば、使い心地に効く部分だけを保てる
- updated の規則が 2 か所にあると、変えるたびに両方を直して表で揃える必要がある。プラグインのリポジトリに一本化すると、別の Vault にも同じ規則が届き、二重の管理もなくなる
- Claude Code を使わない Vault もありうるので、`.claude/` は指定したときだけ置く

## 却下した案

- **キットを別のリポジトリ（Vault のテンプレートリポジトリ）にする**: GitHub の「テンプレートから作る」で始められる。しかし、作った後の更新を届けられない。プラグインと版がずれる
- **Vault の設定もファイルごと管理する**: 簡単だが、Obsidian 本体の書き換えやユーザーの設定を毎回消してしまう
- **初期のファイルも毎回上書きする（3-way マージで更新を届ける）**: テンプレートの改善を既存の Vault に届けられる。しかし、マージの仕組みが要り、衝突したときの扱いも増える。今は違いの報告にとどめ、必要になったら考える
- **プラグインの初回起動時に、プラグイン自身がファイルを置く**: Node なしで、モバイルでも動く。しかし、`.githooks` や `.claude/` などの隠しパスや、git の設定まではプラグインから扱いにくい。また、取り決めの検査と取り込みの記録を 1 か所にまとめられなくなる。プラグインの中で足りないファイルを案内することは別途ありうる
- **updated の規則を Vault 側に残し、プラグインのリポジトリには写しを置く（ADR-0009 の草案での案）**: 別の Vault に Git フックを届けられない

## 影響

- `my-vault-plugins` に `kit/` と、設定の JSON の必要なキーを合わせる処理が加わる。テストは、空の Vault と既存の Vault（この Vault を模したもの）の両方で、取り込みを 2 回実行して結果が同じになることを確かめる
- この Vault の移行（ADR-0009 の 5 の手順 3）で、次のことを行う
  - `.githooks/pre-commit` と updated の規則を `.vault-plugins/` に移す
  - task-coach・worklog-review のスキルを管理するファイルにする
  - `.mcp.json` に MCP サーバーを設定する（今は task-coach のスキルに例として書いてあるだけ）
- 管理するファイルの一覧は、取り込みの記録に書く。`verify.mjs` は一覧にないファイルを `.vault-plugins/` に見つけたら失敗にする
- この Vault の文書（CLAUDE.md の構成、`harness.md`、`vault-conventions.md`）に、`.vault-plugins/` と、管理するファイル・初期のファイルの区分を書く
- この Vault の harness-review と security-check は、プラグインのリポジトリから来るスキルとバンドルも対象にする。security-check にかかるトークンが大きすぎる場合は見直す（ADR-0009）
