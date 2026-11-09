# ADR-0111: Draw.io 関連をすべて除き、既存の .drawio.svg は普通の SVG の図として扱う

- 状態: 承認
- 日付: 2026-11-09

## 背景

[ADR-0102](0102-diagram-three-methods.md) で、AI が描く図は Mermaid / D2 / SVG の 3 方式になった。Draw.io は「既存の図のために残すだけ。新しい開発はしない」とした。

残しているものは次のとおり。どれも使い道が薄いのに、保守の手間と攻撃面がある。

- pkm-diagram の Draw.io の編集画面（[ADR-0064](0064-drawio-diagrams.md)）。外部の origin（embed.diagrams.net）を `allow-scripts` の iframe で読む。#98 のように embed の仕様の変化で壊れる
- コマンド「New diagram」と `/drawio` のスニペット（[ADR-0094](0094-snippet-command.md)）。人が Draw.io の図を新しく作る入口
- CLI の `build` / `render` / `inspect` / `extract` / `strip`（[ADR-0085](0085-drawio-cli-build-render.md)）。Draw.io の XML のモデル・配置・描画を自前で持つ、大きなコード

ユーザーは Draw.io 関連をすべて除くと決めた（Issue #111）。

## 決定

### 除くもの

- pkm-diagram: Draw.io の編集画面（iframe とその通信）、コマンド「New diagram」「Edit a diagram in this note」、操作バーとファイルのメニューの「Edit」、XML のコピー
- スニペット `/drawio`（`.kit/templates/snippet/new-drawio.md`）。スニペットの `command` の仕組み（ADR-0094 の 1）は残す
- CLI: `build` / `render` / `inspect` / `extract` / `strip` と、それを支える XML のモデル・配置・描画のコード。旧名の `.kit/bin/drawio.mjs`
- スキル・規約・文書の Draw.io の記述。操作バーなどの CSS のクラスの名前も `vt-drawio-*` から `vt-diagram-*` にする

### 既存の .drawio.svg

- 普通の SVG の図として扱う。ファイルには手を付けず、移行もしない
- 表示（Obsidian の画像の表示）・コピー（PNG / SVG）・PNG で保存・拡大・縮めすぎの印は、ほかの SVG の図と同じように使える
- コピーと tmp/ への書き出しでは、ルートの `content` 属性（Draw.io の編集用 XML）を除く。大きく、共有先では要らないため（この処理と、PNG にするときに `foreignObject` を外す処理だけは残す）
- 直したいときは、ADR-0102 の 3 方式で描き直す

### 同期と書き出しの扱いを、SVG の図全体に広げる

Draw.io の名前を持つ特別な扱いは、Draw.io の図だけでなく SVG の図全体に当てはまるので、名前を `.svg` に変えて残す。

- 同期（PKM Git の 3-way マージと、`.gitattributes` の `merge=binary`）: `.drawio.svg` / `.drawio` を行単位でマージしない扱いを、`.svg` 全体にする。SVG の図は CLI が作る生成物（スタイルと描画、D2 の出力）で、別々の変更から行を混ぜると、行が重ならなくても図が壊れる。両側が変えたら、リモート版と `<名前> (conflict …).svg` を残す
- HTML の書き出し（pkm-html、ADR-0044）: `.drawio.svg` だけ編集用 XML を除いていたのを、`.svg` 全体に `toSharingSvg` をかける（普通の SVG は変わらない）

### 残すもの

- CLI の `export` / `check`（`asset/` の SVG の図を data URI にして tmp/ に書き出す。ADR-0044 の HTML の書き出しも使う）、`svg-style` / `svg-check` / `d2`（ADR-0102）
- 移行 0064・0102 のスクリプト（過去の子の Vault の設定を直すため。消すと取り込みの途中の Vault で困る）

## 理由

- 新しい図は 3 方式で作るので、Draw.io の編集画面と作成の入口は使われない。外部の origin のスクリプトを動かす iframe がなくなり、プラグインがネットワークを使わなくなる
- 既存の図は画像としてそのまま見えるので、ファイルを変える移行は要らない。変えるとリンクの書き換え（DailyNote の本文を含む）が起きる

## 却下した案

- **移行で既存の .drawio.svg を普通の .svg に変える**（編集用 XML を除き、名前とリンクを書き換える）: Draw.io の痕跡はなくなるが、ノートの書き換えが起きる。見え方は変わらないので、得るものが小さい
- **CLI の `render` / `inspect` だけ残す**: 既存の図を AI が直す手段は残るが、XML のモデルと描画の大きなコードを抱え続ける。直すなら 3 方式で描き直せばよい

## 影響

- ADR-0064・ADR-0085 は置換（この ADR）。ADR-0094 の 2（`/drawio`）と、ADR-0102 の 5（drawio を残す）は、この ADR で置換
- 子の Vault: 移行はない。`template/snippet/` に `command: pkm-diagram:create-diagram` などを書いたスニペットを置いていたら、選んでも実行できない（pkm-template が通知する）ので消す。`hotkeys.json` に消えたコマンドのキーがあっても動きに影響しない
- セキュリティ: `allow-scripts` の iframe を許すファイルがなくなる（security-scan の許可の一覧を空にする）
- 同期: これまで行単位でマージしていた普通の `.svg` も、両側が変えたらファイル単位の衝突（別名の版を残す）になる
