# スライド

- 種類: 画面（ブラウザで開く `index.html`）・手順（スキル slide）
- 開き方: Claude Code に「スライドを作って」と頼む。できた `slide/<…>/<デッキ>/index.html` をブラウザで開く（Obsidian では、ファイルのメニューかタブの右上の「Open in browser」）
- 場面: まだない（発表や共有の資料を作る場面は、使い方が見えてから jobs/ に足す）

## 今の振る舞い

### 作る・直す（Claude Code との往復）

- Claude Code は、聞き手・してほしいこと・投影するか読ませるか・時間と材料を聞き、全スライドの見出し（主張の文）とパターンの表を出して合意を取ってから、`deck.html` を書いてビルドする
- 使う人はブラウザで開き、「Review」で直したい部品（見出し・カード・図・項目など）を押してコメントを書き、「Copy review」でレポートをコピーして Claude Code に貼る。スライド全体・デッキ全体へのコメントも書ける
- Claude Code は、レポートのとおりに `deck.html` を直してビルドし直し、コメントの番号ごとにどう直したかを返す
- ブラウザを再読み込みすると、レビューの画面のまま、前回から変わったスライドに「Updated」が付き、上に何枚変わったかが出る（「Mark as seen」で消す）。コメントを付けた部品が変わっていれば、コメントにも「Updated」が付く。直ったコメントは「Done」で消す
- コメントは、そのブラウザに残る（ほかの端末には同期しない）

### 見る（ブラウザ）

- 開くと全スライドの一覧。上に「Slide Show」「Download as PDF」「Review」「Presenter」「Notes」「Theme」
- 「Slide Show」（S）か、一覧のスライドを押すと、画面を最大化してそのスライドから始まる。→ ↓ Space Enter PageDown で次（1 つずつ出す部品があれば、その次）、← ↑ PageUp Backspace で前、Home / End、Esc で一覧に戻る。クリック（左 1/3 で前、それ以外で次）とスワイプでも進む。下に進み具合が出る
- 「Download as PDF」は印刷の画面を開く。「PDF に保存」を選ぶと、1 枚 1 ページで、文字を選択・検索できる PDF になる（用紙の大きさと余白は設定済み）
- 「Presenter」（Slide Show 中は P）は、別のウィンドウに今のスライド・次のスライド・発表者ノート・経過時間と時刻を出す。どちらのウィンドウで送っても同期する
- 「Notes」は、一覧の各スライドの下に発表者ノートを出す。「Theme」はライト / ダークを切り替える
- 外部に通信しない。スクリプトが動かない場所（Obsidian の中）では、全スライドとノートが縦に並んだページとして読める

### CLI（PC の Claude Code）

- `node .kit/bin/slide.mjs new` / `build` / `check` / `export`（添付を埋め込んだ 1 ファイルを `tmp/` に）/ `pdf`（PC の Chrome 系のブラウザで PDF にして `tmp/` に）/ `patterns`
- `node .claude/scripts/verify.mjs` は、`index.html` が `deck.html` と今の CLI から作ったものと違えば失敗する（ビルドし忘れ、手での編集）

## 使う概念

なし（スライドはノートではない。frontmatter も type も持たない）

## 根拠

[ADR-0117](../../../../src/docs/adr/0117-slides.md)。デザインの規約とパターンは、スキル [slide](../../../../../.claude/skills/slide/SKILL.md)
