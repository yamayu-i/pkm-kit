# ADR-0167: 通常の改行を残し、本文の余白を両モードに適用する

- 状態: 承認
- 日付: 2026-11-15

## 背景

[Issue #167](https://github.com/yamayu-i/pkm-kit/issues/167)。Reading View と Live Preview で改行の表示が異なるとの報告があった。必須設定は strictLineBreaks: true で、Reading View は通常の改行をつなぐ。pkm-markdown にも Reading のみの余白指定と、深いリストの記号の不足がある。

## 決定

- 必須設定の strictLineBreaks を false にし、通常の改行を Reading View でも残す。既存 Vault は設定の移行で更新する。本文は書き換えない。
- issue 以外のノートも同じ設定を使う。issue だけ独自の本文レンダラーを導入しない。
- H2 の上余白・リストの上下余白を両モードに適用する。Reading の H2 は本体の文脈付きの指定にも負けないようにする。本文の文字の大きさと行の高さは既定のままにする。
- Reading のリスト記号も深さ 9 まで ● → ○ → – を繰り返す。
- 編集用記号・連続空行・補助線・コピー操作・サブカードの保存方法には、モードの構造による差を残す。差を [表示差の一覧](../markdown-views.md) に記録する。

## 理由

書いた改行が読むときにも残れば、本文を編集してから読むときの意図しない変化が減る。既存の必須設定と pkm-markdown の修正で対応でき、リンク・埋め込み・編集操作を引き続き Obsidian 本体に任せられる。

## 却下した案

- 各行の末尾に空白 2 つを足す: 表示を直すために既存ノートの本文を一括変更する必要はない。
- CSS で本文をすべて pre-wrap にする: 構造を持つ表・コード・リストや他の UI に影響し、Markdown の設定と食い違う。
- 独自の Markdown 描画に置き換える: 本体・他のプラグインとの互換性と編集操作の責務が増える。

## 影響

Vault 全体の表示が変わる。移行は app.json の strictLineBreaks: true のみを false にし、他の設定・本文を保持する。false・未設定・ファイルなしは変更しない。壊れた JSON と不正な値は変更せず check で止める。設定の反映には取り込み後の再起動が必要。移行は [0167-markdown-line-breaks](../../../migrations/0167-markdown-line-breaks/README.md)。
