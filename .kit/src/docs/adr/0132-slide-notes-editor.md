# ADR-0132: スライドの発表者ノートを pkm-slide で編集し、プラグインの中でビルドし直す

- 状態: 提案
- 日付: 2026-11-13

## 背景

[Issue #132](https://github.com/yamayu-i/pkm-kit/issues/132)。発表者ノート（`deck.html` の `<aside class="notes">`。[ADR-0117](0117-slides.md)）を直すには、今は Claude Code か手で `deck.html` を書き換え、PC で `slide.mjs build` を実行するしかない。発表の準備中に話すことを少し直したい場面は多く、モバイルでも直したい。

ブラウザの閲覧の画面（`index.html`）で直せるようにする案は、次の理由で筋が悪い。

- `index.html` は `file://` で開く静的なページで、ブラウザから Vault のファイルに書き戻せない。CSP で通信も止めている（ADR-0117 の 3）
- 書き戻せても、`deck.html` を変えたら `index.html` をビルドし直す必要がある。ビルドは Node の CLI で、ブラウザでもモバイルでも動かない
- Obsidian の中（pkm-html）で開いた `index.html` は、スクリプトを取り除いて表示する（[ADR-0037](0037-html-viewer.md)）

一方で、pkm-slide（[ADR-0120](0120-slide-list-view-and-patterns.md)）は Vault のファイルを読み書きでき、モバイルでも動く。ビルドの中身 `buildDeck()`（`packages/slide/src/core/build.ts`）は、入力の文字列から出力の文字列を作る関数で、DOM の解析と SHA-256 を呼ぶ側から受け取る。Node にも Obsidian にも依存しない。

## 決定

### 1. 編集の画面

pkm-slide に、デッキの発表者ノートを編集する画面「Edit notes」を足す。

| 項目 | 内容 |
|---|---|
| 開き方 | Slides の View のデッキのメニュー（右クリックか「…」）の「Edit notes」。pkm-html でデッキの `index.html` を開いているときは、コマンド「Edit slide notes」でもそのデッキを開く |
| 形 | ノートペインに開く View（種類 `pkm-slide-notes`）。モーダルにしない（長い文を書くので、狭い画面でも広く使えるように） |
| 中身 | スライドごとに、番号・見出し（スライドの題）・ノートの入力欄を上から並べる。ノートのないスライドも、空の入力欄を出す |
| 保存 | 「Save」のボタンと Ctrl / Cmd + S。変更がなければ押せない。保存していない変更があるまま閉じようとしたら確かめる |
| 結果 | 保存できたら「Saved」と、ビルドの警告があればその件数を出す。エラーで保存しなかったら、その理由を出す（下の 3） |

ブラウザの閲覧の画面の「Notes」は、これまでどおり見るだけにする。

### 2. ノートの書き方（素の文字で編集する）

入力欄は素の文字で書く。HTML を書かせない（モバイルで打ちにくく、誤ったマークアップがビルドのエラーになるため）。

- 保存するとき: 空行で区切った段落を `<p>` にし、段落の中の改行は `<br>` にする。`<` `>` `&` はエスケープする。空にしたら aside ごと取り除く
- 開くとき: aside の中が、文字と `<p>` と `<br>` だけなら、上の逆の変換で素の文字にして入力欄に出す
- それ以外のマークアップ（リスト、強調、リンクなど）を含むノートは、そのスライドだけ入力欄を読み取り専用にして、「HTML で書かれたノートです。Claude Code か deck.html で直してください」と出す。素の文字に変えると、書いた人の意図した形が失われるため

### 3. deck.html の書き換え

`deck.html` は、変えたスライドの aside の中だけを書き換える。ほかの部分（字下げ、改行、属性の順、コメント）は 1 バイトも変えない。

- DOM を直列化し直さない。ソースの文字列から、何枚目の `<section>` の中の `<aside class="notes">` の開始と終了の位置を探し、その間を入れ替える
- ノートのなかったスライドに書いたら、そのスライドの `</section>` の直前に、その行の字下げにそろえて `<aside class="notes">…</aside>` を足す
- 1 枚に aside が 2 つ以上あるスライドは、読み取り専用にする（どれを書き換えるか決められない）
- 書き換えた後、ビルドがエラーを出したら、`deck.html` も `index.html` も書かない（元のまま）
- 開いた後に `deck.html` がほかで変わっていたら（Claude Code、同期）、保存せずに知らせ、開き直してもらう

### 4. プラグインの中でのビルド

保存したら、プラグインの中で `buildDeck()` を実行して `index.html` を書く。CLI の `slide.mjs build` が作るものと**同じバイト列**にする（`slide.mjs check` と `verify.mjs` が、CLI でビルドし直して比べるため）。

- DOM の解析には、CLI と同じ linkedom を束ねる（Obsidian の DOMParser では、直列化の結果が linkedom とずれる恐れがある）。linkedom は pkm-slide の devDependencies にすでにある版（0.18.15）を使う。新しい依存は足さない
- SHA-256 は、純粋な JS の実装を `packages/shared` に書く（モバイルに Node の crypto はなく、Web Crypto は非同期で `buildDeck()` の形に合わない）。テストで Node の crypto と比べる
- 閲覧の画面の CSS とスクリプト（`virtual:slide-assets`）は、CLI と同じものをビルドで束ねる
- 子の Vault の基本の色（`.kit-local/theme.json` の primary。[ADR-0125](0125-slide-vault-primary.md)）も CLI と同じに読む。読み方は `packages/slide` の関数を共有する
- 添付があるかの判定（`exists`）は Vault の API で行う。デッキの外を指すものは、ないものとして扱う（CLI と同じ）

### 5. 確かめ方

- テスト: 見本のデッキ（パターンのひな形を全部並べたもの）について、プラグインのビルドの関数と CLI のビルドの出力が同じになること
- テスト: ノートの書き換えで、変えた aside の外が変わらないこと。足す・消す・HTML のノートを読み取り専用にすることも

## 理由

- 書き換えとビルドを同じ場所（Obsidian）で行うので、保存したらすぐ `index.html` まで新しくなる。モバイルでも完結し、PC でビルドし直す手順が要らない
- ブラウザの閲覧の画面に手を入れないので、CSP と「外部に通信しない」の決定（ADR-0117）を変えずに済む
- 素の文字にすると、モバイルでも打ちやすく、ノートの誤りでビルドが止まらない。HTML のノートを読み取り専用にすれば、書いた形を壊さない
- ソースの位置で入れ替えると、Claude Code が書いた `deck.html` の差分が、ノートを変えた所だけになる（レビューしやすい。`data-l` の行番号もノートの外では変わらない）

## 却下した案

- **ブラウザの閲覧の画面で編集し、`localStorage` に置いて、レポートを Claude Code に貼る**（レビューのコメントと同じ往復）: 実装は小さいが、自分の手では保存まで終わらない。モバイルで完結しない
- **ブラウザの File System Access API で `deck.html` に書く**: Chrome 系だけで、ビルドは別に要る
- **`slide.mjs serve`（localhost のサーバー）で受けて書き換え、ビルドする**: CSP と通信の決定を変える必要があり、ほかのサイトからの要求への対策も要る。PC だけ
- **`deck.html` だけ書き換え、`index.html` は PC でビルドする**: モバイルで直すと、次に PC でビルドするまで `index.html` が古く、`verify.mjs` と CI が止まる
- **Obsidian の DOMParser でビルドする**: プラグインは小さく済むが、CLI と出力がずれると `check` が止まり、原因が分かりにくい
- **HTML のノートも素の文字に変えて編集させる**: リストや強調が黙って失われる
- **ノートを `deck.html` の外（別のファイル）に置く**: ソースが 2 つになり、Claude Code が `deck.html` だけ読んでも全体が分からなくなる

## 影響

- 変更: `packages/pkm-slide`（Edit notes の View、メニューとコマンド、ノートの書き換え、ビルドの呼び出し、テスト）、`packages/slide`（ノートの位置を探す関数と、基本の色の読み方を、CLI とプラグインで共有できる形にする。テスト）、`packages/shared`（SHA-256）、`.obsidian/plugins/pkm-slide/`（ビルドの成果物。linkedom と閲覧の画面の資源を束ねるので、`main.js` は数百 KB〜1MB 近く大きくなる）、プロダクトの文書（`surfaces/slide.md`）、`design.md`（View を足すなら）、スキル `slide`（ノートは Obsidian でも直せること）
- 子の Vault: 移行は要らない（pkm-slide はすでに有効。新しい View とコマンドが増えるだけ）。`.kit/changes/` に書く
- セキュリティ: Vault の中の `deck.html` と `index.html` を書くようになる。書く先はデッキのフォルダの 2 つだけで、パスは Slides の一覧が見つけたデッキから作る。ビルドはこれまでどおりスクリプトとイベントの属性を取り除く（`stripDangerous`）。入力欄の文字はエスケープしてから `deck.html` に入れる。セキュリティチェックの対象にする
