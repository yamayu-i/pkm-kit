# ADR-0009: 自作プラグインを別リポジトリに切り出し、ビルド成果物だけを Vault に置く

- 状態: 提案
- 日付: 2026-11-02

## 背景

このリポジトリは Vault そのもので、ノート・自作プラグインのソース（`.plugin-src/`）・ハーネス（`.claude/`）を一つの履歴で管理している。プラグインのソースを別のリポジトリに分けたい。

モバイルではビルドできないので、Vault には今後もビルド成果物（`main.js` / `manifest.json` / `styles.css`）をコミットしておく必要がある。

一方で、今のソースは「Vault の中にある」ことを前提に書かれている。`../../../..` で Vault のルートを指している箇所は次のとおり。

| 箇所 | Vault 側の対象 |
|---|---|
| `packages/*/esbuild.config.mjs` | `.obsidian/plugins/<id>/` に直接書き出す |
| `packages/vault-task/test/bundle.test.ts`、`packages/vault-template/test/bundle.test.ts` | Vault に置いた `main.js` を読む |
| `packages/design/node/paths.ts` | `.obsidian/snippets/vault-theme.css` を生成し、`.obsidian/appearance.json` を検査する |
| `packages/vault-template/test/templates-repo.test.ts` | Vault の `template/file/` を読む |
| `packages/vault-task` の `lint:vault` / `mcp` / `worklog:review` | Vault のルートを対象に動く。task-coach と worklog-review のスキルが使う |
| `packages/vault-git/test/stamp-updated.test.ts` | `.claude/scripts/test/fixtures/updated-cases.json` を読む（PC の Git フックと規則を揃えるため） |
| `.github/workflows/plugin.yml` | ビルドし直した成果物がコミット済みのものと一致することを確かめる |

ハーネスにも `.plugin-src` があることを前提にした箇所がある。CLAUDE.md のルール 7・8、`verify.mjs --plugin`、security-check・task-coach・worklog-review・dev-implement のスキル、`plugin-development.md`、そして `.plugin-src/docs/adr/` へのリンクである。

## 決定

### 1. リポジトリを分ける

- 新しいリポジトリ（仮名 `yamayu-i/vault-plugins`。以下「プラグインのリポジトリ」）を作る。`.plugin-src/` の履歴を `git filter-repo --subdirectory-filter .plugin-src` で取り出し、そのリポジトリのルートにする
- 次のものはプラグインのリポジトリに移す
  - `packages/`、`scripts/`（security-scan）、`docs/`（プラグインの ADR 0001〜0028、`design.md`、`design-tokens.md`）
  - プラグインの CI。Vault の `plugin.yml` を元にする
  - Node と pnpm のバージョンの指定（`mise.toml`）
- Vault からは `.plugin-src/` と `plugin.yml` を消す。`mise.toml` は検査スクリプト用の Node だけを残す

### 2. 成果物は「取り込みのコマンド」で Vault にコピーする

プラグインのリポジトリに `pnpm vault:install --vault <Vault のパス>` を用意する。このコマンドは次の順に動く。

1. 作業ツリーに未コミットの変更があれば止める（どのコミットから作ったかを追えるようにするため）
2. `pnpm check` を通してから、`dist/` にビルドする。ビルドの出力先は既定で `dist/<id>/`。Vault には直接書かない
3. 下の表の「Vault との取り決めの検査」を、指定した Vault に対して実行する。1 つでも落ちたら何もコピーしない
4. 成果物をコピーし、取り込みの記録 `.obsidian/plugins/vault-plugins.lock.json` を書く

| コピーするもの | Vault 側の置き場所 |
|---|---|
| 各プラグインの `main.js` / `manifest.json` / `styles.css` | `.obsidian/plugins/<id>/` |
| デザイントークンから生成したスニペット | `.obsidian/snippets/vault-theme.css` |
| vault-task の CLI のバンドル（`lint.mjs`、`mcp.mjs`、`worklog-review.mjs`） | `.claude/tools/vault-task/` |

取り込みの記録には、次のものを入れる。

- プラグインのリポジトリの URL とコミットの SHA
- コピーした各ファイルの SHA-256
- `appearance.json` に求める値（`accentColor` など。デザイントークンから導いたもの）

Vault 側では、取り込みをブランチで行い PR にする（開発の作業なので、今と同じ工程）。コミットの形式は `build(plugins): <要約>（vault-plugins@<短い SHA>）`。

### 3. Vault との取り決めの検査を、どちらの側で行うか

| 検査 | プラグインのリポジトリ | Vault |
|---|---|---|
| 型・ビルド・テスト・security-scan | CI と `vault:install` | — |
| ビルドの再現性（成果物がソースから作り直せる） | CI でビルドを 2 回し、一致を確かめる | — |
| 成果物が手で書き換えられていない | — | `verify.mjs` と CI が、取り込みの記録の SHA-256 と照合する |
| `appearance.json` がデザインの値どおり | `vault:install` が対象の Vault を検査する | `verify.mjs` が取り込みの記録の値と照合する（トークンを持たずに済む） |
| テンプレート（`template/file/`）が vault-template・vault-task と合う | `vault:install` が対象の Vault を検査する（今の `templates-repo.test.ts` を CLI にする）。リポジトリのテストには代表的なテンプレートの写しを置く | テンプレートを変えたら、プラグインのリポジトリから `pnpm vault:check --vault <パス>` を実行する（手順として文書に書く） |
| updated の付与の規則（ADR-0028）が PC の Git フックと揃う | 表の写しを `test/fixtures/updated-cases.json` に置く。`vault:install` は写しが Vault の正本と同じかを確かめる | 正本は Vault の `.claude/scripts/test/fixtures/updated-cases.json` のまま |
| タスク管理データの整合性（`task:lint`） | — | `.claude/tools/vault-task/lint.mjs` で実行する（`pnpm task:lint` の代わり） |

### 4. 文書とハーネスを分ける

- プラグインの ADR と UI のデザインルールは、プラグインのリポジトリに置く。Vault の文書から参照するときは、GitHub の URL で書く
- Vault のデータの形式（issue の frontmatter、worklog・board の jsonl、ID の連番、updated の付与）は、Vault の利用者にとっての取り決めでもある。この取り決めは Vault の [ノート規約](../vault-conventions.md) に要約を残し、根拠としてプラグインの ADR の URL を書く
- `plugin-development.md` はプラグインのリポジトリに移す。Vault には、取り込みの手順と取り込みの記録の説明だけを残す
- ハーネスのうち、プラグインのソースに関わるものの扱い
  - dev-implement のプラグイン向けの工程と、security-check はプラグインのリポジトリで行う
  - security-check の実施記録（`.claude/security/`）と週 1 回の期限の管理は Vault に残す。レポートには、検査したプラグインのリポジトリのコミットを書く
  - task-coach・worklog-review のスキルと MCP の設定は、`.claude/tools/vault-task/` のバンドルを使うように変える
- CLAUDE.md のルール 7 は「プラグインの成果物は `vault:install` でだけ更新する。手で書き換えない」に置き換える

### 5. 移行の順序

成果物が古いままになる期間や、二重に管理する期間を作らないため、次の順に進める。

1. プラグインのリポジトリを作る。リポジトリの作成はユーザーが行う
2. 履歴を取り出して push し、パスを `dist/` 向けに直す PR を出す。`vault:install` もこの PR に入れる
3. Vault 側の PR を出す
   - `vault:install` で成果物を入れ直す。中身が今のコミット済みのものと同じになることを確かめる
   - 取り込みの記録の検査と `.claude/tools/` を足す
   - `.plugin-src/` を消し、文書とスキルを直す
4. Vault 側の PR をマージした後で、プラグインのリポジトリを正本とする。それまでは `.plugin-src/` を変えない

## 理由

- 成果物をコミットし続けるので、モバイルの Vault Git の動きは今と変わらない。submodule のような、モバイルの Git が扱いにくい仕組みを持ち込まない
- Vault に置く成果物には、取り込みの記録のハッシュを付ける。こうすると、ソースがない Vault の側でも、成果物がどのコミットから来て、手で変えられていないかを確かめられる。今 CI が `git diff --exit-code` で保証していることを、リポジトリをまたいでも保てる
- Vault に依存する検査を `vault:install` にまとめると、取り決めが壊れた成果物は Vault に入らない
- CLI をバンドルにして Vault に置くと、task-coach や worklog-review を使うときに、プラグインのリポジトリを取得してビルドしなくて済む。クラウドのセッションでも Vault だけで動く。今は手元で `pnpm build` しないと MCP サーバーが動かないので、この点はむしろ良くなる
- 取り決めの正本を、それを守る側に置く。updated の規則とテンプレートは Vault、デザイントークンはプラグイン。写しの一致は取り込みのときに機械で確かめる

## 却下した案

- **submodule で Vault に取り込む**: 相対パスはそのまま動く。しかしモバイルの Vault Git（isomorphic-git）は submodule を扱えない。Obsidian の同期でも中身が欠ける
- **一つのリポジトリのままにする**: 分けたいという要望に応えられない。今の結びつきを保つだけなら、これがいちばん手間がかからない
- **GitHub Release に成果物を置き、Vault 側のスクリプトで取得する**: 成果物が作られた経路は明確になる。ただし、Vault 側で取得するのにトークンが要る（プラグインのリポジトリを非公開にする場合）。リリースの運用も増える。必要になったら、取り込みの記録の形式を変えずに追加できる
- **npm パッケージとして公開する**: 公開範囲が広がり、サプライチェーン対策の対象も増える。Vault で `node_modules` を使わない方針（ルール 8）にも合わない
- **Vault に依存する検査をなくす**: テンプレートや updated の規則の食い違いを見つけられなくなる

## 影響

- 日々の開発が 2 つのリポジトリにまたがる。プラグインを変えたときは「プラグインのリポジトリで PR → マージ → Vault で取り込みの PR」と、PR が 2 回になる
- クラウドのセッションでプラグインを開発するときは、プラグインのリポジトリも追加する（`add_repo`）。`vault:install` を試すには、Vault も同じセッションに要る
- `.claude/tools/vault-task/` に、ビルド済みの CLI（`yaml` などを束ねたもの）をコミットする。security-check の対象に加える
- 文書: CLAUDE.md、`harness.md`、`workflow.md`、`vault-conventions.md`、`plugin-development.md`、[ADR-0005](0005-checks-in-ci.md)（CI の分担）、関係するスキルを直す。ADR-0005 は、CI の分担の部分だけ置換する
- `.plugin-src/docs/adr/` のプラグインの ADR は、番号を保ったままプラグインのリポジトリに移す。Vault の文書にある相対リンクは URL に書き換える
- 新しい依存は追加しない（`git filter-repo` は移行の作業で一度だけ使う。リポジトリには入れない）
