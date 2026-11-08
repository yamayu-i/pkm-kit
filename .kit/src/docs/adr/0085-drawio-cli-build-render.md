# ADR-0085: Claude Code が図を作る・直せるように、CLI に build / render / inspect を足し、描画を XML から自前で作る

- 状態: 承認
- 日付: 2026-11-08

## 背景

[ADR-0064](0064-drawio-diagrams.md) は、図（`asset/*.drawio.svg`）を変えるのは Draw.io（pkm-drawio の編集）を通すと決めた。XML だけを外から書き換えると描画と食い違うからである。XML から SVG を作る CLI（`render`）は「今は要らない」として見送った。

その結果、Claude Code は図を作ることも直すこともできない（Issue #85）。図を描きたいときに、人が Draw.io を開いて手で描くしかない。

LLM に座標・大きさ・矢印の経路を考えさせると、遅く、重なりやずれが出やすい。こうした決まった計算はスクリプトに任せたい。

Draw.io 本体で描画する方法（embed をヘッドレスのブラウザで動かす、Draw.io Desktop の CLI）は、ネットワーク（クラウドのセッションからは diagrams.net に繋がらないことがある）か、端末ごとの導入（Playwright・Electron）が要る。

## 決定

### CLI（`.kit/bin/drawio.mjs`）に 3 つのコマンドを足す

| コマンド | すること |
|---|---|
| `build <spec.json \| ->` | 短い JSON（ページ・ノード・エッジ・グループ・向き）から、配置を計算し、編集用 XML と描画を作って `.drawio.svg` に書く |
| `render <図.drawio.svg \| .drawio \| .xml>` | 編集用 XML から描画を作り直す。XML はバイト列のまま `content` に入れ、変えない |
| `inspect <図>` | ページ・セル（ID・種類・ラベル・位置・つながり）と、描けない書式を、短いテキストで出す |

- どれもネットワークを使わず、同じ入力からは同じバイト列を出す
- 処理は `src/core/` に置き、DOM にも Obsidian にも Node にも依存しない（`DecompressionStream` で圧縮した `<diagram>` も読む）
- 書いた SVG は、既存の検査（`extractDiagramXml`・`countPages`・`findSvgProblems`）を通ったものだけを書く

### 描画は自前で、対応する書式を絞る

- 対応する形: 四角・角丸・楕円・ひし形・六角形・平行四辺形・三角形・円柱・ノート・書類・人・文字・グループ・スイムレーン。エッジは直線・直交（`edgeStyle=orthogonalEdgeStyle`）・経由点、矢印（なし・classic・block・open）、破線、ラベル
- 文字は `<text>` で描く（`foreignObject` を使わない。PNG のコピーで Canvas が汚染されない）。HTML のラベルはタグを除いて改行だけを残す
- 描けない形・書式は四角で描き、`render` と `inspect` が警告を出す
- 色・フォントなど、属性に入る値は形式を検査し、合わないものは既定の値にする。ラベルはエスケープする
- 描画は Draw.io と完全には同じにならない。正本は XML なので、pkm-drawio で開いて保存すると Draw.io の描画に置き換わる。表示されるのは 1 ページ目（Draw.io の書き出しと同じ。`--page` で変えられる）

### 配置（`build`）

- 既定は層に分ける配置（`layered`）。閉路はエッジを逆向きに扱って切り、最長路で層を決め、重心法で並べ替える。向きは下（`down`）か右（`right`）
- グループ（1 段まで）は、メンバーを層の中で隣り合わせ、グループごとに帯を分けて重ならないようにする
- ほかに格子（`grid`）と、座標を書いたまま使う（`none`）を選べる
- ノードの大きさはラベルの長さから見積もる（指定があればそれを使う）

### 規約とスキル

- Claude Code が図を作る・変えるときは、`build` か `render` を通す（描画と XML を同時に作る）。XML だけを書き換えて終わりにしない（`.claude/docs/vault-conventions.md`）
- 手順はスキル `.claude/skills/drawio-diagram/` に書く
- 子の Vault のコミット: wiki の操作の中で新しく作った図は、その操作のコミットで main に（wiki の操作のコミットで `asset/` は追加だけが許される）。それ以外（ノートに図を足す、既存の図を直す）はブランチで PR にする
- 圧縮したページは `extract --plain` で展開して書き換える（`render` は展開した XML も圧縮した XML も読む）

## 理由

- 自前の描画ならネットワークも端末ごとの導入も要らず、クラウドのセッション・PC のどちらでも同じ結果になる。決定的なので、テストでバイト列を固定できる
- 正本は XML（ADR-0064）なので、描画が多少違っても、Draw.io で開けば正しく描き直される。食い違いは「見た目の細部」に限られ、「中身」は食い違わない
- 座標の計算をスクリプトに任せると、LLM は「何をどうつなぐか」だけを書けばよく、短く速く書ける
- `inspect` があれば、大きな XML を読まずに今の図を把握でき、直す範囲を決めやすい

## 却下した案

- **Draw.io の embed をヘッドレスのブラウザで動かして描く**: 描画は正確だが、ネットワークと Playwright が要る。クラウドのセッションからは diagrams.net に繋がらないことがある
- **Draw.io Desktop の CLI（`--export`）を使う**: 描画は正確だが、端末ごとに Electron のアプリを入れる必要があり、モバイルにもクラウドにもない。あれば使う形にしても、結果が端末によって変わる
- **Mermaid など別の形式で書いて変換する**: 変換の依存が増え、Draw.io で編集したときの形が変わる
- **XML だけを書き、描画は人が Draw.io で保存するまで古いままにする**: ノートに見える図が中身と食い違い、人が気づけない
- **spec を図のファイルに入れて、いつでも作り直せるようにする**: Draw.io で保存すると知らない属性は消える。作った後の変更は XML を直して `render` する

## 影響

- `.kit/bin/drawio.mjs` に `build` / `render` / `inspect` が増える。既存の `export` / `check` / `extract` / `strip` は変わらない
- 新しいスキル `drawio-diagram`。`vault-conventions.md` の図の規則が変わる
- 子の Vault のファイルは変えないので、移行はない
- ADR-0064 の「却下した案」の `render` を、この ADR で採る
