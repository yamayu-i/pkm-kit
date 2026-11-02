# ADR-0028: コミット時に変更ノートの updated を自動付与する

- 状態: 承認（一部置換: ハーネスの ADR-0009。規則を 2 か所に持つ部分）
- 日付: 2026-11-01

## 背景

[Issue #9](https://github.com/yamayu-i/yamayu-pkm/issues/9)。[ハーネスの ADR-0007](../../../.claude/docs/adr/0007-note-format.md) は「updated は人や AI に記入させず、コミット時に自動で付与する」と決め、[ADR-0008](../../../.claude/docs/adr/0008-updated-on-create.md) は作成時にも入れるとした。コミット時の付与は未実装で、変更しても updated が作成時の値のままになっている。

コミットの経路は 2 つある。

- PC の Git CLI(`git commit`。Claude Code、手動)
- Vault Git(vault-git。isomorphic-git。PC とモバイルの Obsidian)。未コミットの変更を `snapshot` で丸ごとコミットする

Git の hook はモバイルでは動かないので、hook だけでは完結しない。

## 決定

### 1. 付与の規則(2 つの経路で同じにする)

- **対象**: Vault の Markdown(`.md`)で、frontmatter があるもの。除く: `.` で始まる要素を含むパス、先頭が `temporary/`・`template/`・`tmp/`、ファイル名が `README.md`
- **付与する時**: そのコミットで追加(A)または変更(M)されたノートだけ。削除、未変更、同期で受け取っただけのノート(マージ、rebase、cherry-pick)には付与しない
- **値**: 秒までの ISO 8601。端末のローカルのオフセット付き(UTC なら `Z`)。1 回のコミットに含まれるすべてのノートで同じ値
- **書き換える範囲**: frontmatter の `updated:` の 1 行だけ。本文、`created`、`sources`、ほかの項目は変えない。`updated` がなければ、`created` の次の行に足す(`created` もなければ frontmatter の末尾)。引用符は、既存の行にあればそれに合わせ、足すときは `"` で囲む。改行コード(LF / CRLF)は保つ
- **循環の防止**: HEAD との差が `updated` の行だけのときは付与しない(日時だけの変更でコミットを増やさない)
- **元資料(`sources/`)**: 新しく追加したときだけ付与する。コミット済みの元資料は作成後に変更しない(`llm-wiki.md`)ので、PC の Git CLI では変更・削除のコミットを止める。Vault Git では同期を止めないため、付与しないだけにする
- **曖昧な `updated`**: 重複、リスト、複数の値のときは書き換えない。PC の Git CLI ではコミットを止め、Vault Git ではそのノートへの付与だけを見送る
- **移行**: 空の `updated`(と欠けている `updated`)は、付与の対象になったときに埋まる。まだ変更されていないノートには、`stamp-updated.mjs --migrate` で、そのファイルを最後に変えたコミットの日時を入れる

### 2. PC の Git CLI

- `.githooks/pre-commit` が `.claude/scripts/stamp-updated.mjs --staged` を呼ぶ。有効にするには `git config core.hooksPath .githooks`(リポジトリごとに 1 回。worktree 間で共有される)
- ステージ済みの内容(index の blob)に付与する。部分 stage のとき、未 stage の変更は巻き込まない(index の blob だけを書き換え、作業ツリーはステージ済みの内容と同じときだけ更新する)
- `MERGE_HEAD`、`CHERRY_PICK_HEAD`、rebase の途中では何もしない(同期で受け取っただけの内容に付与しない)
- node が見つからないときは警告を出して、コミットは止めない

### 3. Vault Git(PC とモバイルの Obsidian)

- `snapshot` で、コミットするノートのうち対象のものに付与してから `git add` する。作業ツリーのファイルを書き換える(書き込みの直前に内容が変わっていたらその回は付与しない)
- マージコミットでは付与しない。ただし両側で `updated` を変えて衝突する場合は、`updated` を衝突の対象から外し、新しい方の値を採用する(本文などの衝突は従来どおりマーカーを入れる)

### 4. 実装と検査

- 規則は `.claude/scripts/lib/updated.mjs`(PC)と `packages/vault-git/src/stamp/updated.ts`(プラグイン)に、それぞれ持つ。パッケージ間で import しない([ADR-0023](0023-template-id-and-daily.md) と同じ)。同じ入出力の表(`.claude/scripts/test/fixtures/updated-cases.json`)を、両方のテストが読んで揃える
- `wiki-lint` は `created` と `updated` を、秒までの ISO 8601(オフセット付き)にする。`updated` は frontmatter のあるノートで必須
- `check-append-only` は、`updated:` の行の変更を「既存の行を変えた」とは数えない(wiki の操作のコミットに付与が入るため)

## 理由

- 規則を 1 つにして実装を 2 つ持つのは、モバイルに hook がなく、プラグインと Node のスクリプトが別々にビルド・実行されるため。表で揃えれば食い違いをテストで見つけられる
- `updated` の 1 行だけを書き換えるので、daily の本文の保護(ハーネスのルール 3)と、`sources` の不変性を損なわない
- 同期で受け取っただけのノートに付与しないので、端末間で `updated` を書き換え合うコミットの往復が起きない

## 却下した案

- **hook だけにする**: モバイルでは動かない
- **Obsidian のファイル変更イベントで保存のたびに付与する**: 変更のたびに書き込みが走り、同期とぶつかる。コミット時というこれまでの決定とも違う
- **付与する時刻を作業ツリーのファイルの更新時刻にする**: 端末ごとにずれ、同じコミット内で同一時刻にならない
- **衝突を `updated` も含めてマーカーにする**: `updated` は必ず両側で変わるので、同期のたびに衝突する

## 影響

- vault-git の `snapshot` と `tree-merge` を変える。ファイルの書き込みを伴うので、セキュリティチェックの対象
- 新しい依存はない
- 他の端末が古いプラグインのままだと、付与されないコミットが混ざる。プラグインを更新すれば、次の変更から付与される
- 部分 stage の作業ツリーと index で `updated` の行が食い違うことがある。次のコミットで「`updated` の行だけの差」になるので付与されず、循環しない
- Issue の「sources は初回コミット時のみ付与し、その後の不変性を守る」は、`sources/` の元資料のことと扱う(PR #45 の試作の解釈に合わせた)。wiki ページの frontmatter の `sources` 項目は、この仕組みが書き換えない
