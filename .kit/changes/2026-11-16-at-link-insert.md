## 変更の要約

- 本文で `@` のあとに種類を打つと検索ダイアログが開き、選んだものへのリンクをカーソルの位置に入れる（ADR-0194）。`@issue`・`@sub-issue`・`@member`・`@routine`（pkm-task）、`@note`・`@heading`・`@daily`・`@slide`（pkm-template）。コマンドパレットの「Insert link to …」からも呼べる
- 検索: 題の部分一致。数字だけなら ID（`12` → `i-12`）。issue とサブは、何も付けなければ closed / canceled を除き、`s:closed`・`s:open,waiting`・`s:all` で絞る。routine は `s:paused` / `s:all`。ノートは `t:wiki`（type）・`f:wiki/`（フォルダ）。一度に 50 件まで出し、「Load more」で足す
- `@sub-issue` は親の issue → そのサブの 2 段階（`12#` と打つと親を飛ばす）。`@heading` はノート → 見出しの 2 段階。どちらも、次の段の空の欄で Backspace を押すと前の段に戻る
- `@daily` はある daily を新しい順に出す。今日の daily がなければ先頭の「Today」で作ってからリンクを入れる
- md に入るのはふつうの Markdown リンク（`[i-12 題](issue/i-12.md)`、サブは `[i-12#k3f9a2 題](issue/i-12.md#k3f9a2)`）
- 本文の issue・サブ・routine・member へのリンクを、Live Preview（カーソルがリンクの外にあるとき）と Reading で、status の色の ID のバッジと今の題のチップに描く。題を変えても追従する。ほかのノートへのリンクは、文字はそのままで前に種類のアイコンを足す
- インラインテンプレート（`template/inline/`）でも `command` を使えるようになった（ADR-0094 の置き換え）
- 子への影響: 移行なし。上流の既定（`.kit/templates/inline/`）に 8 つのファイルが増える。`template/inline/` に同じファイル名を置くと、打つ名前（`alias`）を変えられる。PC とモバイルで、`@issue` → 選ぶ → リンクが入り、チップに描かれることを確かめる
