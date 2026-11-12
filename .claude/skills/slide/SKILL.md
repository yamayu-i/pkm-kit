---
name: slide
description: スライド（発表・共有の資料）を、ユーザーと話し合いながら slide/ に HTML で作り、ブラウザでのレビューを受けて直す手順。目的と聞き手を聞く → 見出しだけで話の筋を合意する → 伝えたいことからパターンを逆引きして deck.html を書く → node .kit/bin/slide.mjs でビルドする → ユーザーがブラウザで開いてレビューのコメントをコピーする → 貼られたレポートのとおりに直す、を繰り返す。ユーザーが「スライドを作って」「発表資料を作って」「デッキにして」「このスライドを直して」と言ったとき、「# スライドのレビュー:」で始まるレポートを貼ったとき、slide/ の deck.html を変えるときに使う。
---

# スライドを作る・直す

スライドは、ユーザーと往復して仕上げる。1 回で完成させようとしない。**話し合う → 作る → ユーザーがブラウザで見てコメントする → 直す** を、短い周期で回す（[ADR-0117](../../../.kit/src/docs/adr/0117-slides.md)）。

- ソースは `slide/<…>/<デッキ>/deck.html`。ブラウザで開くのはビルドした `index.html`（手で編集しない）
- デザインは [共通の規約](conventions.md) と、下の逆引きで選ぶパターンで決まる。値（色・大きさ）は書かない
- 書式と部品は [deck.html の書き方](authoring.md)

## 流れ

### 1. 聞く（作る前に、チャットで）

次の 4 つが依頼から分からなければ、まとめて 1 回で聞く。推定できるものは、推定を添えて確認にする。

| 聞くこと | 決まること |
|---|---|
| 聞き手は誰で、何を知っているか | 言葉の選び方、定義のスライドが要るか（C16） |
| 聞き終えた後に、何をしてほしいか（決める・動く・理解する） | 表紙と結びの 1 文、最後が [next-steps](patterns/next-steps.md) か [summary](patterns/summary.md) か |
| 話して投影するか、読んでもらうか | 密度（`present` か `read`。C11） |
| 時間（または枚数）と、使える材料（数字・図・写真） | 枚数、どのパターンが使えるか |

### 2. 話の筋を、見出しだけで合意する

`deck.html` を書く前に、**全スライドの見出し（主張の文）とパターンの表**をチャットに出し、ユーザーの合意を得る。ここで直すのが最も安い。

```
| # | 見出し（主張の文） | パターン | 見せるもの |
|---|---|---|---|
| 1 | 問い合わせの初回応答を、4 時間から 1 時間に縮める | cover | — |
| 2 | 担当が決まるまでの待ちが、応答時間の 7 割を占める | chart-share | 内訳の帯 |
```

- 見出しだけを上から読んで、話が通るかを自分で確かめてから出す（C2）
- 材料が足りないスライド（数字や図がない）は、そのことを表に書いて聞く。数字を作らない

### 3. パターンを選ぶ（逆引き）

伝えたいことから、下の表でパターンを引く。選んだら、そのパターンのファイルを読み、ひな形から書く。一覧は `node .kit/bin/slide.mjs patterns` でも出る。

| 伝えたいこと | パターン |
|---|---|
| **構成** | |
| 何の話かを 1 行で言う（1 枚目） | [cover](patterns/cover.md) |
| 話す順を先に見せる・今どこかを示す | [agenda](patterns/agenda.md) |
| 次のまとまりに移る | [section](patterns/section.md) |
| 持ち帰ってほしいことを言い直す | [summary](patterns/summary.md) |
| 誰が何をいつまでにするかを決める | [next-steps](patterns/next-steps.md) |
| 最後の 1 文と連絡先 | [closing](patterns/closing.md) |
| 聞かれたら見せる細かい資料 | [appendix](patterns/appendix.md) |
| 写真を全面に敷いた表紙 | [cover-image](patterns/cover-image.md) |
| 話し手・チームの人の紹介 | [profile](patterns/profile.md) |
| **主張する** | |
| 主張を、図・写真・グラフで支える（迷ったらこれ） | [assertion-evidence](patterns/assertion-evidence.md) |
| 1 つの文だけを強く残す | [statement](patterns/statement.md) |
| 1 つの数字で納得させる | [big-number](patterns/big-number.md) |
| 誰かの言葉で裏付ける | [quote](patterns/quote.md) |
| 写真の上に 1 文を載せて印象で残す | [image-statement](patterns/image-statement.md) |
| 2 つの数字の差（前と後、目標と実績） | [two-numbers](patterns/two-numbers.md) |
| 問いを投げて考えさせる | [question](patterns/question.md) |
| よくある思い込みを正す | [myth-fact](patterns/myth-fact.md) |
| **比べる** | |
| 2 つの違いを並べる | [comparison](patterns/comparison.md) |
| 変える前と後 | [before-after](patterns/before-after.md) |
| 1 つの案の良い点と悪い点 | [pros-cons](patterns/pros-cons.md) |
| 3 つ以上の案から選んだ理由 | [decision-table](patterns/decision-table.md) |
| 2 つの軸で位置づける | [matrix-2x2](patterns/matrix-2x2.md) |
| 2〜3 つの案から勧める 1 つを示す | [options](patterns/options.md) |
| 2 つの極の間のどこにいるか | [spectrum](patterns/spectrum.md) |
| 2〜3 つの条件の重なり | [venn](patterns/venn.md) |
| **構造を見せる** | |
| 同じ重さの 2〜4 個の要素（柱・理由・特長） | [cards](patterns/cards.md) |
| 上下に重なる層 | [layers](patterns/layers.md) |
| 全体を部分に分ける | [tree](patterns/tree.md) |
| 言葉の意味を決める | [definition](patterns/definition.md) |
| 写真と文を左右に並べる | [split-image](patterns/split-image.md) |
| 5〜9 個の要素を見渡させる | [grid](patterns/grid.md) |
| 中心と、それを囲むもの | [hub](patterns/hub.md) |
| 土台から積み上がる段 | [pyramid](patterns/pyramid.md) |
| **流れを見せる** | |
| 順に進む手順 | [process](patterns/process.md) |
| いつ何が起きるか | [timeline](patterns/timeline.md) |
| 回り続ける段階 | [cycle](patterns/cycle.md) |
| 段階ごとに減る量 | [funnel](patterns/funnel.md) |
| 期間 × 流れの予定（ロードマップ） | [roadmap](patterns/roadmap.md) |
| 利用者の段階ごとの行動と気持ち | [journey](patterns/journey.md) |
| はい / いいえで分かれる判断 | [flow](patterns/flow.md) |
| **データを見せる** | |
| 項目どうしの量を比べる | [chart-bar](patterns/chart-bar.md) |
| 時間に沿った変化 | [chart-line](patterns/chart-line.md) |
| 全体に占める割合 | [chart-share](patterns/chart-share.md) |
| 正確な値を引けるようにする | [table](patterns/table.md) |
| 2〜4 個の指標の今の値と変化 | [kpi](patterns/kpi.md) |
| 期間ごとの量の移り変わり（縦棒） | [chart-column](patterns/chart-column.md) |
| 目標に対する進み具合 | [progress](patterns/progress.md) |
| 始まりから終わりまでの増減の内訳 | [chart-waterfall](patterns/chart-waterfall.md) |
| 2 つの軸の交わりの多い少ない | [heatmap](patterns/heatmap.md) |
| **物を見せる** | |
| 実物・現場の写真 | [image](patterns/image.md) |
| 画面のどこを見るか | [screenshot](patterns/screenshot.md) |
| 短いコードの見てほしい行 | [code](patterns/code.md) |
| 仕組み・構成・関係の図 | [diagram](patterns/diagram.md) |
| 2〜6 枚の写真を見比べる | [gallery](patterns/gallery.md) |
| 変える前と後の画面 | [screenshot-compare](patterns/screenshot-compare.md) |
| **話の型** | |
| 課題と、その解き方 | [problem-solution](patterns/problem-solution.md) |
| リスクと対策 | [risks](patterns/risks.md) |
| 聞き手に決めてほしいこと・お願い | [ask](patterns/ask.md) |
| 振り返り（続ける・困った・次に試す） | [retro](patterns/retro.md) |
| 状況・問題・解決で話の全体を 1 枚に | [scr](patterns/scr.md) |
| よく聞かれる問いと答え | [faq](patterns/faq.md) |

どれにも当たらないときは、最も近いパターンの部品を組み合わせ（[部品の一覧](authoring.md#部品)）、気づきに記録する（足すかどうかは [パターンの保守](maintaining.md)）。

### 4. 作ってビルドする

```sh
node .kit/bin/slide.mjs new slide/<フォルダ> --title "<題>"   # 初めてのとき。フォルダは英小文字・数字・ハイフン
node .kit/bin/slide.mjs build slide/<フォルダ>                 # deck.html を変えるたび
```

- エラーは必ず直す（`index.html` が書かれない）。警告は [共通の規約](conventions.md) の ID が付いている。直すか、直さない理由をユーザーに伝える
- ブラウザ（Playwright）がある環境では、画像にして見て確かめる（[目で確かめる](authoring.md#目で確かめる)）。はみ出し・重なり・読めない大きさを直してから渡す

### 5. ユーザーに渡す（チャット）

次の 3 つを短く伝える。

1. 開くファイル: `slide/<フォルダ>/index.html` を**ブラウザで**開く（Obsidian では、ファイルのメニューの「Open in browser」。Obsidian の中の表示はスクリプトが動かず、一覧だけになる）
2. レビューのしかた: 「Review」を押す → 直したい部品を押してコメントを書く → 「Copy review」→ チャットに貼る
3. 自分で決めたこと・迷ったこと（材料が足りず仮に置いたもの、警告を残した理由）

### 6. レビューを受けて直す

`# スライドのレビュー:` で始まるレポートが貼られたら、[レビューを受けて直す](review.md) に従う。直したら 4 に戻ってビルドし、**コメントの番号ごとに、どう直したか**を返す。ユーザーはブラウザを再読み込みすると、変わったスライドに「Updated」が付いて見える。

これを、ユーザーが「これでよい」と言うまで繰り返す。

### 7. 仕上げ

- PDF: 画面の「Download as PDF」（印刷で「PDF に保存」）。PC に Chrome 系のブラウザがあれば `node .kit/bin/slide.mjs pdf slide/<フォルダ>`（`tmp/` に書く）
- 外部に渡す 1 ファイル: `node .kit/bin/slide.mjs export slide/<フォルダ>`（添付を埋め込んで `tmp/` に書く）
- コミットは `deck.html`・`index.html`・添付を一緒に。`node .claude/scripts/verify.mjs` が、古い・手で直した `index.html` を止める

## ファイル

| ファイル | 内容 |
|---|---|
| [conventions.md](conventions.md) | 共通の規約（C1〜C16）と、根拠が割れている点・経験則の注意書き |
| [authoring.md](authoring.md) | `deck.html` の書式、部品、色、ステップ、発表者ノート、図、目で確かめる |
| [patterns/](patterns/assertion-evidence.md) | パターンごとの、使う場面・ひな形・書くときの指示・よくある失敗 |
| [review.md](review.md) | レビューのレポートの読み方と直し方 |
| [evidence.md](evidence.md) | 規約の根拠（`E1` などの ID）と、根拠に採らなかったもの |
| [maintaining.md](maintaining.md) | パターン・規約を足す・消す・直す手順 |

## 出力の段階

出力は [write-for-reader](../write-for-reader/SKILL.md) に従う。下は既定で、上げ下げはその場で判断する。

| 出力 | 読み手 | 段階 |
|---|---|---|
| 聞くこと、見出しの表（チャット） | 人 | 3 |
| スライドそのもの | 人 | 密度が `present` なら 1〜2、`read` なら 2〜3 |
| 渡すとき・直したときの報告（チャット） | 人 | 1 |
