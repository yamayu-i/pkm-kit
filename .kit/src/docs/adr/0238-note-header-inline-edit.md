# ADR-0238: note・source・wiki のヘッダーで、表示している項目をその場で編集する

- 状態: 承認
- 日付: 2026-11-27

## 背景

#238。

- [ADR-0027](0027-hide-properties-english-labels.md) で、専用のヘッダーがある type（daily、note、source、concept、entity、topic、answer）は Properties 欄を隠した。ヘッダーは表示のみ（[ADR-0026](0026-note-views.md)）なので、これらの type では Live Preview とリーディングで frontmatter を直せず、ソースモードに切り替えるしかない
- 直したくなる項目がヘッダーに出ているのに直せない: note の `title`・`tags`、source の `title`・`origin`・`retrieved`、wiki のページ（concept、entity、topic、answer）の `title`・`sources`
- source の `origin` はテンプレートでは空で作られ、作った直後に入れる項目だが、空の項目はヘッダーに出ない
- ADR-0027 がヘッダーからの編集を却下した理由は、daily の `board` などプラグインが管理する項目との衝突だった。daily 以外の type には当てはまらない

## 決定

### 編集できる項目

| type | 編集できる項目 | 表示だけの項目 |
|---|---|---|
| note | タイトル（`title`）、Tags（`tags`） | Created |
| source | タイトル（`title`）、Origin（`origin`）、Retrieved（`retrieved`） | Cited by |
| concept、entity、topic、answer | タイトル（`title`）、Sources（`sources`） | Backlinks |
| daily | なし（今のまま） | すべて |

- `created`・`updated`・`type` はヘッダーから編集しない（`created` は変えない値、`updated` はコミット処理が付ける。ADR-0028）
- Cited by・Backlinks は他のノートから求める値なので、編集の対象ではない
- ほかの項目（`aliases` など）は、今までどおりソースモードで直す

### 見せ方: 値を二重に出さず、横に編集アイコンボタンを置く

- 編集できる項目は、今の表示の横に編集アイコンボタン（鉛筆。`aria-label` は「Edit title」「Edit tags」など）を 1 つ置く。値を別の入力欄で二重に出さない
- 押すと、その項目の表示がその場で入力欄に変わる。ほかの項目の表示は変えない。同時に編集するのは 1 項目だけ
- モバイルにはホバーがないので、ボタンは常に出す。弱い色にして値より目立たせない
- 編集できる項目は、値が空でもヘッダーに行を出し、値の位置に弱い文字で「Not set」を出す（空の `origin` を入れられるようにするため）。表示だけの項目は今までどおり、値がなければ出さない

### 入力と保存

| 項目 | 入力欄 | 保存する値 |
|---|---|---|
| タイトル | 1 行の入力 | `trim` した文字列。空は保存せず、説明を出す |
| Tags | 1 行の入力（カンマか空白で区切る） | 文字列のリスト。先頭の `#` と重複を除く。空なら空のリスト |
| Origin | 1 行の入力 | `trim` した文字列。空なら空のまま |
| Retrieved | 1 行の入力（`YYYY-MM-DD`） | 日付として読めるものだけ。読めなければ保存せず、説明を出す |
| Sources | 複数行の入力（1 行 1 件。ノートのパスか URL） | 空でない行のリスト |

- Enter（Sources は Ctrl/Cmd+Enter）か、欄を離れたときに保存し、表示に戻る。Escape は保存せずに戻る。IME の変換中の Enter では保存しない
- 書き込みは Obsidian の `app.fileManager.processFrontMatter` で、その項目だけを変える。本文には触れない
- 検査に通らないときは、項目の下に日本語の説明を出し、書かない
- 編集とリーディングの両方で同じように動く

### 文言

画面に常に出る文言（ボタンの `aria-label`、「Not set」）は英語、説明・エラーは日本語（`docs/design.md`「文言」）。

## 理由

- Properties 欄を隠したまま、ヘッダーに出ている項目を直せるので、ADR-0027 で減らした重複が戻らない
- 値の横のボタンにすると、見た目はほぼ今のままで、直したいときだけ入力欄になる
- `processFrontMatter` は Obsidian の標準の書き込みで、frontmatter の YAML を壊さずに 1 項目だけ変えられる
- daily は pkm-task が管理する項目があり、ヘッダーに直したい項目もないので、対象から外す

## 却下した案

- **Properties 欄を隠すのを daily だけにする**: 手間は小さいが、ADR-0027 で直したヘッダーと Properties 欄の重複が戻る
- **ヘッダーに常に入力欄を出す**: 表示と入力欄で値が二重に見えるか、ヘッダーが入力欄だらけになる
- **項目の編集をモーダルにまとめる**: 1 項目を直すのに手数が多い。その場で直す方が、pkm-task の issue 画面の題（`SummaryField`）の直し方とも揃う

## 影響

- ADR-0026 と ADR-0027 の「ヘッダーは表示のみ」「ヘッダーから frontmatter を編集する案は却下」を、note・source・wiki の type について置き換える（一部置換）。daily は変わらない
- pkm-template がノートの frontmatter に書き込むようになる。セキュリティチェックの対象に、書き込みの経路が増える
- `processFrontMatter` は frontmatter 全体を書き直すので、ほかの項目の引用符などの書き方が変わることがある（値は変わらない）
- 子の Vault のノートとテンプレートは変えないので、移行は要らない。子から見える変更として `.kit/changes/` に書く
