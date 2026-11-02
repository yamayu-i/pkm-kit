# ADR-0009: 仕組みを上流のリポジトリに分け、各 Vault はその子として更新を取り込む

- 状態: 承認
- 日付: 2026-11-02
- 関連: [ADR-0010](0010-upstream-updates-and-migrations.md)（更新の取り込みと移行）、[ADR-0011](0011-harness-parent-and-child.md)（ハーネスの親子分離とエスカレーション）

## 背景

このリポジトリは Vault そのもので、次のものを一つの履歴で管理している。

- ノート
- 自作プラグインのソース（`.plugin-src/`）とビルド成果物
- ハーネス（`.claude/`）
- Obsidian の設定

実現したい体験は次のとおり。

- 上流のリポジトリ（公開リポジトリ `yamayu-i/pkm-kit`。以下「上流」）から、新しい Vault を作れる
- 上流を更新し、その変更を各 Vault（以下「子」）で取り込むと、新しい機能を使える
- 後方互換は必須にしない。取り込むときに AI エージェントが対応できる程度の Breaking Change は許す（[ADR-0010](0010-upstream-updates-and-migrations.md)）

今の構成には、これを妨げるものが 3 つある。

- 個人のノートと仕組みが同じリポジトリにある。そのため、仕組みだけを公開したり、別の Vault に配ったりできない
- ソースの中で `../../../..` を使い、この Vault のルートを指している箇所がある（`esbuild.config.mjs`、`bundle.test.ts`、`design/node/paths.ts`、`templates-repo.test.ts`、`stamp-updated.test.ts`）
- 仕組みが持つファイルと、ユーザーが育てるファイルの境界が決まっていない。テンプレート、`CLAUDE.md`、`.obsidian/*.json` などがその例である

## 決定

### 1. 2 層にする

- **上流**は公開リポジトリにし、仕組みだけを持つ。個人のノートと個人の記録は入れない
  - 仕組みとは、プラグインのソースとビルド成果物、CLI のバンドル、子向けのハーネス、親のハーネス、移行、セットアップである
- **子**は非公開リポジトリで、上流の全体と、その子のノート・記録を持つ。プラグインのソースも子に入るが、子では変えない
- プラグインのソースを別のリポジトリに分ける 3 層の構成にはしない

### 2. 子は GitHub の fork ではなく、git の remote で上流とつなぐ

公開リポジトリの fork は、非公開にできない。テンプレートから作るリポジトリは、履歴を共有しないので merge で更新を取り込めない。そこで子は次のように作る。

1. GitHub に空の非公開リポジトリを作る
2. 上流を clone し、remote の名前を `upstream` に変える。非公開のリポジトリを `origin` として足し、push する
3. `node .kit/setup.mjs` を実行する（[ADR-0011](0011-harness-parent-and-child.md) の 4 で決めるエスカレーションの方法の選択を含む）

以後、子は `upstream/main` を merge して更新を取り込む（[ADR-0010](0010-upstream-updates-and-migrations.md)）。モバイルは今までどおり、vault-git で `origin` から pull するだけである。

### 3. 所有の境界をパスで決め、検査する

| 区分 | 意味 | 例 |
|---|---|---|
| 上流のもの | 上流だけが変える。子は変えない | `.kit/`、`.obsidian/plugins/<id>/`、`.obsidian/snippets/vault-theme.css`、子向けのハーネス（`.claude/` のうち上流のもの）、`.githooks/`、`.github/workflows/` のうち上流のもの |
| 子のもの | 上流には存在しない。子だけが変える | ノート全般、`.kit-local/`、`.claude/local/`、`.claude/skills/local-*`、`.claude/notes/`・`reviews/`・`security/` の記録、`.obsidian/*.json` |

- 上流のもののパスは、上流の `.kit/owned-paths.json` に列挙する
- 子の `verify.mjs` は、最後に取り込んだ上流のコミット（`.kit-local/upstream.json`）から HEAD までの間に、上流のものが merge 以外で変わっていないかを確かめる
- 上流の CI は、上流のすべてのファイルが `owned-paths.json` に載っているかを確かめる。あわせて、子のもののパス（ノートなど）が上流に入っていないかも確かめる

両方が書きたくなるものは、次のように重ね合わせて、境界をまたがないようにする。

| もの | 上流 | 子 | 決め方 |
|---|---|---|---|
| テンプレート | `.kit/templates/file/*.md`、`.kit/templates/config.json` | `template/file/*.md`、`template/config.json` | 同じ名前は子を優先する。`config.json` はキーごとに子が上書きする。vault-template が読み込むときに重ねる |
| `CLAUDE.md` | `.claude/CLAUDE.md`（子向けの目次） | `.claude/local/CLAUDE.md` | 上流の目次が `@local/CLAUDE.md` で子の分を読み込む |
| スキル | `.claude/skills/<名前>/` | `.claude/skills/local-<名前>/` | 名前で分ける |
| Obsidian の設定 | `.kit/obsidian-required.json`（必要なキーと値） | `.obsidian/*.json` | 上流はファイルを持たない。セットアップと移行で必要なキーだけを書き、`verify.mjs` が照合する。Obsidian 本体が書くキーや、ユーザーの好みは残る |
| label・ボードのグループ | なし（初期値は `setup.mjs` が書く） | `issue/labels.json`、`issue/board-groups.json` | 子のもの |
| `.gitignore` | `.gitignore`（上流のもの） | `.git/info/exclude` か、`.kit-local/gitignore` の追記 | 子は `.gitignore` を変えない |

### 4. 上流の構成

| パス | 置くもの |
|---|---|
| `.kit/src/` | プラグインのソース（今の `.plugin-src/`）。pnpm workspace |
| `.kit/bin/` | CLI のバンドル（`lint.mjs`、`mcp.mjs`、`worklog-review.mjs`、`stamp-updated.mjs`）。ビルド済みのものをコミットする |
| `.kit/templates/` | テンプレートの既定値 |
| `.kit/migrations/` | 移行（[ADR-0010](0010-upstream-updates-and-migrations.md)） |
| `.kit/fixtures/` | 移行と検査を試すための、子を模した Vault |
| `.kit/harness/` | 親のハーネス（[ADR-0011](0011-harness-parent-and-child.md)） |
| `.kit/setup.mjs`、`.kit/owned-paths.json`、`.kit/obsidian-required.json` | セットアップと境界の定義 |
| `.obsidian/plugins/<id>/`、`.obsidian/snippets/vault-theme.css` | ビルド成果物。上流の CI が、ソースから作り直したものと一致するかを確かめる（今の `plugin.yml` と同じ） |
| `.claude/` | 子向けのハーネス（[ADR-0011](0011-harness-parent-and-child.md)） |

- ビルドの出力先は、`.kit/src` からの相対パスで決める。Vault のルートの位置は、上流でも子でも同じになる
- updated の付与の規則（ADR-0028）は、vault-git の `stamp/updated.ts` を正本にする。`.claude/scripts/` の検査は、Node の型の除去でこれを直接読み込む。今 `.claude/scripts/lib/updated.mjs` にある写しと、表の資料で揃える仕組みは要らなくなる
- プラグインの ADR、`design.md`、`plugin-development.md` は、`.kit/` に移す

### 5. この Vault を最初の子にする

1. この Vault の履歴を `git filter-repo` で書き換え、上流の最初の履歴を作る。消すものと、置き場所を移すものは次のとおり
   - 消すもの: 個人のノート（`daily/`、`issue/`、`routine/`、`member/`、`worklog/`、`board/`、`wiki/`、`sources/`、`note/`、`asset/`、`memo.md` など）と、個人の記録（`.claude/notes/`、`reviews/`、`security/`）
   - 移すもの: `.plugin-src/` を `.kit/src/` に移す
2. 公開する前に、履歴の全体に秘密情報、個人のノートの内容、端末名が残っていないことを確かめる
3. 上流で、4 の構成に直す（パス、重ね合わせ、セットアップ、親子のハーネス）
4. この Vault に `upstream` を設定し、最初の 1 回だけ `--allow-unrelated-histories` で merge する。filter-repo で履歴を書き換えるので、共通の祖先がないためである。上流のものは上流の版を、子のものはこの Vault の版を採る。以後は通常の merge で取り込める
5. この Vault から `.plugin-src/` と、上流に移ったものの写しを消す

## 理由

- 2 層なら、プラグインのソースとその成果物とハーネスを、同じ PR で変えて同じ CI で確かめられる。今の開発の流れをほぼ保てる
- git の merge で届けると、新しい機能と、それに伴う移行を、1 回の取り込みでまとめて受け取れる。取り込みの記録も、git の履歴そのものになる
- 所有の境界をパスで決めて検査すると、merge の衝突は、両方が書くものに限られる。そして両方が書くものは、重ね合わせでなくせる。衝突が起きたら、それは境界の違反である
- 上流を公開しても、子は非公開のまま上流を取り込める

## 却下した案

- **GitHub の fork で子を作る**: 公開リポジトリの fork は非公開にできず、個人のノートが公開される
- **テンプレートリポジトリから子を作る**: 履歴を共有しないので、更新を merge できない
- **3 層（プラグインのソース → 上流 → 子）**: 子が軽くなるが、変更が 3 つのリポジトリをまたぐ。PR は 3 回になる
- **成果物を取り込みのコマンドでコピーする（この ADR の前の草案）**: プラグインの成果物は届けられる。しかしテンプレートやハーネスの改善、Breaking Change への対応は届けられない。取り込みの記録も別に作る必要がある
- **上流が Obsidian の設定の JSON をファイルごと持つ**: Obsidian 本体の書き換えとユーザーの好みで、毎回衝突する

## 影響

- [ADR-0001](0001-harness-scope.md) の前提（リポジトリは非公開で、Vault そのもの）が変わる。上流は公開で仕組みだけを持ち、子は非公開で Vault そのものになる。ADR-0001 は前提の部分を置換する
- [ADR-0005](0005-checks-in-ci.md) の CI の分担が変わる。プラグインの検査は上流の CI で、子の CI は境界の検査とノートの検査を行う
- 上流は公開なので、ソース・テスト・ADR・テストの資料に、個人のノートの内容、端末名、秘密情報を入れない。上流の CI とレビューの観点に加える
- vault-template は、テンプレートを `.kit/templates/` と `template/` から重ねて読むように変える。vault-task のテンプレートの検査も、重ねた結果に対して行う
- 新しい依存は追加しない（`git filter-repo` は移行の作業で一度だけ使う。リポジトリには入れない）
