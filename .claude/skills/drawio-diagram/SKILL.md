---
name: drawio-diagram
description: Vault の図（asset/*.drawio.svg。Draw.io の編集可能 SVG）を Claude Code が作る・直す・読み取る手順。座標・大きさ・矢印の経路は CLI（node .kit/bin/drawio.mjs の build / render / inspect）に計算させ、LLM は何をどうつなぐかだけを書く。ユーザーが「図を描いて」「構成図・フロー図・関係図を作って」「この図を直して」「図に〇〇を足して」「この図は何を表している？」と言ったとき、ノートや wiki のページに図があると分かりやすいときに使う。
---

# Draw.io の図を作る・直す

図は `asset/<名前>.drawio.svg` に置き、`![説明](asset/<名前>.drawio.svg)` で参照する（[ノートの書式と配置](../../docs/vault-conventions.md)）。1 つのファイルに、描画（SVG）と編集用 XML（全ページ）を持つ。正本は XML（[ADR-0064](../../../.kit/src/docs/adr/0064-drawio-diagrams.md)）。

**XML だけを書き換えて終わりにしない**。描画と食い違う。図を作る・変えるときは、必ず CLI の `build` か `render` を通す（描画と XML を同時に書く。[ADR-0085](../../../.kit/src/docs/adr/0085-drawio-cli-build-render.md)）。座標を自分で計算しない。

| したいこと | コマンド |
|---|---|
| 新しく作る | `build`（短い JSON の spec から、配置・XML・描画を作る） |
| 今の図を把握する | `inspect`（ページ・セルの ID・形・ラベル・位置・辺） |
| 今の図を直す | `extract --plain` → XML を書き換える → `render` |
| 描画だけを作り直す | `render <図>`（その場で書き直す） |

どれもネットワークを使わず、同じ入力からは同じファイルを作る。

描画は Draw.io と細部が違うことがある（文字の位置・折り返し、形の細部）。ユーザーが pkm-drawio で開いて保存すれば、Draw.io の正確な描画に置き換わる。作った・直したら、そう伝える。

## 新しく作る

### 1. 決める

- **名前**: 英語のケバブケース（`asset/` 直下。サブフォルダを作らない）。既存の名前と重ならないこと
- **向き**: 手順・流れは `down`（上から下）、段階・パイプラインは `right`（左から右）。並べるだけなら `layout: "grid"`
- 1 枚に詰め込まない。ノードが 15 を超えそうなら、ページ（`pages`）か図を分ける

### 2. spec を書いて build する

spec は短い JSON。ファイルに残さなくてよいので、標準入力で渡す（残すなら `tmp/` に置く）。

```sh
node .kit/bin/drawio.mjs build - --output asset/<名前>.drawio.svg <<'EOF'
{
  "direction": "down",
  "groups": [{ "id": "vault", "label": "Vault", "color": "blue" }],
  "nodes": [
    { "id": "user", "label": "ユーザー", "shape": "actor" },
    { "id": "note", "label": "ノート", "group": "vault" },
    { "id": "fig", "label": "図\n(drawio.svg)", "shape": "document", "group": "vault", "color": "yellow" },
    { "id": "ok", "label": "正しい？", "shape": "diamond" }
  ],
  "edges": [
    { "from": "user", "to": "note", "label": "書く" },
    { "from": "note", "to": "fig", "dashed": true, "label": "参照" },
    { "from": "fig", "to": "ok" },
    { "from": "ok", "to": "user", "label": "いいえ" }
  ]
}
EOF
```

既存のファイルは上書きしない（`--force` で上書き。ユーザーが Draw.io で直した図を消すので、今の図を直すなら下の「今の図を直す」で）。spec の誤りは、場所と使える値を添えてエラーになるので、それに従って直す。

### spec の書き方

ページが 1 つなら、下の項目をルートに書く。複数なら `{ "pages": [ {…}, {…} ] }`。

| 項目 | 値 |
|---|---|
| `name` | ページの名前 |
| `direction` | `down`（既定）/ `right` |
| `layout` | `layered`（既定。辺をたどって層に分ける）/ `grid`（入力順に格子。`columns` で列の数）/ `none`（各ノードの `x`・`y` をそのまま使う） |
| `nodes[]` | `id`（必須。英数字と `_ . : -`。`0` と `1` は使えない）、`label`（`\n` で改行。省くと id）、`shape`、`color`、`group`、`width`・`height`（省くとラベルから見積もる）、`x`・`y`（`layout: none` のとき）、`fill`・`stroke`・`fontColor`（`#rrggbb`）、`fontSize`、`bold`、`dashed`、`style`（Draw.io の style を後ろに足す） |
| `edges[]` | `from`・`to`（必須。ノードかグループの id）、`label`、`dashed`、`arrow`（`end` 既定 / `start` / `both` / `none`）、`line`（`orthogonal` 既定 / `straight` / `curved`）、`color`、`width`、`style` |
| `groups[]` | `id`・`label`・`color`、`group`（入れ子）、`direction`・`layout`・`columns`（グループの中の配置） |

- `shape`: `rounded`（既定）、`box`、`ellipse`、`circle`、`diamond`（判断）、`hexagon`、`parallelogram`（入出力）、`step`、`triangle`、`cylinder`（データの置き場所）、`note`、`document`、`process`、`cloud`、`actor`（人。ラベルは下）、`text`（枠なしの文字）
- `color`: `white`、`gray`、`blue`、`green`、`orange`、`yellow`、`red`、`purple`、`dark`、`none`（Draw.io の既定のパレット）。意味で使い分ける（例: 外部は gray、データは yellow、注意は red）。色は 3〜4 種類までにする
- 戻る辺（下から上へ）は図の外側を回し、ほかのノードを横切る辺は横に寄せる。それでも見づらいときは、ノードの順（`nodes` の並び）か向きを変える。辺を減らすのも手

### 3. 確かめる

```sh
node .kit/bin/drawio.mjs inspect asset/<名前>.drawio.svg
```

ラベル・つながり・グループの中身が意図どおりかを見る。`!` で始まる行は、描けない書式の警告。

ブラウザ（Playwright）がある環境では、画像にして見て確かめてよい（`tmp/` に置く。`<img>` に図を読み込んだ HTML のスクリーンショット）。重なり・読めない文字・長すぎる辺があれば、spec を直して `--force` で作り直す。

### 4. ノートから参照する

`![<図の説明>](asset/<名前>.drawio.svg)` をノートに書く。説明は図の内容を 1 文で（画像が出ない環境で読まれる）。DailyNote（`daily/`）の本文の既存の内容は変えない（追記はよい）。

## 今の図を直す

ユーザーが Draw.io で手を入れた図もあるので、作り直さずに XML を直す。

1. `node .kit/bin/drawio.mjs inspect asset/<名前>.drawio.svg` で、ページ・セルの ID・位置を把握する
2. `node .kit/bin/drawio.mjs extract asset/<名前>.drawio.svg --plain > tmp/<名前>.xml`（`--plain` は Draw.io が圧縮したページを展開する）
3. `tmp/<名前>.xml` を書き換える
   - 既存のセルの `id` は変えない。新しいセルの `id` は重ならないものにする
   - ラベルは `value`（`html=1` なら HTML。改行は `&lt;br&gt;`）
   - 位置は `<mxGeometry x y width height>`。グループ（`container=1`・`swimlane`）の子は、親からの相対の座標。`inspect` は絶対の座標を出すので、親の位置を引く
   - 辺は `edge="1" source="…" target="…"`。経路は `<Array as="points">` の経由点
   - ノードを足すときは、既存のノードの間隔（多くは 40〜80）に合わせ、`inspect` の位置で空いている場所に置く。大きく組み替えるなら、ユーザーに確かめてから `build` で作り直す
4. `node .kit/bin/drawio.mjs render tmp/<名前>.xml --output asset/<名前>.drawio.svg`
5. `inspect` で確かめる

描画だけが古い（XML だけが変わった）図は `node .kit/bin/drawio.mjs render asset/<名前>.drawio.svg` で描き直す。2 ページ目以降を表に出すなら `--page <N>`。

## 図を読み取る

「この図は何？」と聞かれたら、`inspect` の出力（ラベルと辺）から読み取って答える。SVG の描画部分や XML の全文を読まない（長い）。細部が要るときだけ `extract --plain` の XML の該当するセルを読む。

## コミット

- wiki の操作（[LLM wiki の仕組み](../../docs/llm-wiki.md)）の中で新しく作った図は、その操作のコミット（`wiki(…)`）に含めて main に直接コミットしてよい。wiki の操作のコミットでは、`asset/` は追加だけが許される（既存の図は変えられない）
- それ以外（ノートに図を足す、既存の図を直す）は、ブランチで行い PR にする（[進め方](../../docs/workflow.md)）。コミットは `docs(diagram): <要約>`
- `tmp/` の spec や XML はコミットしない（`tmp/` は git で管理しない）

## 外に共有する

図を含むノートを外に渡すときは `node .kit/bin/drawio.mjs export <ノート>` で `tmp/` に書き出す（図を、編集用 XML を除いた SVG の data URI にして埋め込む。[ノートの書式と配置](../../docs/vault-conventions.md)）。

## 出力の段階

出力は [write-for-reader](../write-for-reader/SKILL.md) に従う。下は既定で、上げ下げはその場で判断する。

| 出力 | 読み手 | 段階 |
|---|---|---|
| 図そのもの | 人 | 2 |
| 作った・直した報告（チャット） | 人 | 1 |
