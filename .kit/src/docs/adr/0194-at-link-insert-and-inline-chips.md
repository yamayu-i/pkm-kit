# ADR-0194: @ で issue・ノートなどを探してリンクを入れ、本文のリンクをインラインビューで描く

- 状態: 承認
- 日付: 2026-11-16

## 背景

- 本文で issue やノートを指すときは、パスを手で書くか、別の画面で探してリンクをコピーするしかない（#194）
- インラインテンプレート（`@`、ADR-0067）は決まった値を入れるだけで、Vault の中のものを探して指す手段がない。ADR-0094 は「行の中の `@` からファイルを作る場面はない」として、インラインでは `command` を使わないことにした
- issue へのリンクは、Live Preview では `[i-12 …](issue/i-12.md)` の文字のまま見える。status も今の題も分からない

## 決定

### 1. 呼び出し方: インラインテンプレートの `command`

- インラインテンプレートでも `command`（ADR-0094）を使えるようにする。選ぶと、打った `@…` を消してそのコマンドを実行する。本文は入れない
- 上流の既定（`.kit/templates/inline/`）に次の 8 つを置く。子の Vault は、同じファイル名を `template/inline/` に置けば名前を変えたり、`command` を外して止めたりできる

| 打つもの | ファイル | コマンド |
|---|---|---|
| `@issue` | `issue.md` | `pkm-task:insert-issue-link` |
| `@sub-issue` | `sub-issue.md` | `pkm-task:insert-sub-issue-link` |
| `@member` | `member.md` | `pkm-task:insert-member-link` |
| `@routine` | `routine.md` | `pkm-task:insert-routine-link` |
| `@note` | `note.md` | `pkm-template:insert-note-link` |
| `@heading` | `heading.md` | `pkm-template:insert-heading-link` |
| `@daily` | `daily.md` | `pkm-template:insert-daily-link` |
| `@slide` | `slide.md` | `pkm-template:insert-slide-link` |

- コマンドは、コマンドパレットからも呼べる（エディタがあるときだけ）。選んだリンクはカーソルの位置に入れる。ダイアログを閉じたら何も入れない

### 2. md に書くもの

ふつうの Markdown リンク（Vault ルートからのパス、`vault-conventions.md`）。リンクの文字は、プラグインがない所（LLM、ほかのエディタ）でも読める控えとして、入れたときの題を書く。`[` `]` `\` は `\` で退避し、パスの空白などは `%20` の形にする。

| 種類 | 書くもの |
|---|---|
| issue | `[i-12 題](issue/i-12.md)` |
| sub-issue | `[i-12#k3f9a2 題](issue/i-12.md#k3f9a2)`（アンカーはサブの `id`。ADR-0135 の合成キーと同じ形） |
| member | `[呼び名](member/m-3.md)` |
| routine | `[r-3 題](routine/r-3.md)` |
| note | `[タイトル](wiki/foo.md)` |
| heading | `[タイトル › 見出し](wiki/foo.md#見出し)` |
| daily | `[2026-11-20 FRI](daily/2026/11/2026-11-20.md)` |
| slide | `[デッキの題](slide/foo/index.html)` |

### 3. 検索ダイアログ

8 種類とも、共有の部品（`packages/shared/src/link-picker.ts`）で同じ形にする。

- 入力は空白で区切った語。`キー:値` の語は絞り込み、それ以外は検索語。検索語はすべて含むもの（大文字小文字を区別しない部分一致）。先頭から一致するものを先に出す
- 数字だけなら ID で探す（`12` → `i-12`、`i-120` …。同じ数のものを先に出す）。`i-12` と書いてもよい
- 検索語がなければ、最近変えたもの（ファイルの更新日時）の順
- 一度に出すのは 50 件まで。残りがあれば末尾に「Load more (N)」の行を出し、選ぶと 50 件足す（ダイアログは閉じない）。検索語を変えたら 50 件に戻す

種類ごとの検索:

| 種類 | 探す所 | 絞り込み | 既定 |
|---|---|---|---|
| issue | 題（`summary`）と ID | `s:closed` / `s:open,waiting`（カンマで複数）/ `s:all` | closed と canceled を除く |
| sub-issue | ① 親: サブを持つ issue（issue と同じ）→ ② その親のサブの題。`12#` / `i-12#` と打つと ① を飛ばす。② で空の欄から Backspace を押すと ① に戻る | ① ② とも `s:` | ① ② とも closed と canceled を除く。② は md の順 |
| member | `name`・`nickname`・`alias` と ID（`m-N`） | なし | |
| routine | 題と ID（`r-N`） | `s:paused` / `s:all` | 一時停止（`active: false`）を除く |
| note | タイトル（`title` → `name` → ファイル名）、`aliases`、パス | `t:wiki`（type。`t:wiki` は wiki の 4 つの type）、`f:wiki/`（フォルダの前方一致） | `issue/`・`routine/`・`member/`・`daily/`・`tmp/`・`template/` を除く（専用の種類があるか、リンクしないもの） |
| heading | ① ノート（note と同じ）→ ② そのノートの見出し | ② は見出しの文字 | ② は md の順。Backspace で ① に戻る |
| daily | ある daily のファイル名の日付（`1120`・`2026-11` のどちらでも） | なし | 新しい順。今日の daily がなければ先頭に「Today」を出し、選ぶとテンプレートから作ってからリンクを入れる（存在しないノートへのリンクを書かない） |
| slide | デッキの題（`deck.html` の `<title>`）とフォルダ | なし | 新しい順 |

### 4. インラインビュー

Live Preview（カーソルがリンクの中にないとき）と Reading で、本文の Markdown リンクを描き替える。ソースモードとコードの中（フェンス・インラインコード）は描き替えない。共有の部品（`packages/shared/src/link-chips.ts`）に、リンクを見つける・描く・押したら開く処理を置き、どう描くかは各プラグインが決める。

- **置き換える（チップ）**: `issue/`・`routine/`・`member/` の md へのリンク（pkm-task）。チップの題は md の文字ではなく、今の索引から出す（題を変えても追従する）。索引にないもの（消した・まだ読み込んでいない）は描き替えず、ふつうのリンクのまま
  - issue: status の色の ID のバッジ（`IdBadge` と同じ）と題。closed / canceled は題に打ち消し線
  - sub-issue: 合成キー `i-12#k3f9a2` のバッジ（サブの status の色）と題、前に弱い文字で親の題
  - member: 頭文字の丸と呼び名（`nickname`）
  - routine: `r-N` のバッジ（一時停止は灰色）と題
- **印を足す**: それ以外の Vault の中のファイルへのリンク（pkm-template）。リンクの文字はそのまま（本文の言い回しを変えない）で、前に小さいアイコンを足す。daily は `calendar`、slide は `presentation`、見出しへのリンクは `hash`、wiki のページ（type が concept / entity / topic / answer）は `book-open`、source は `library`、ほかは `file-text`
- チップを押すと、そのノートを開く（Mod を押していれば新しいタブ）。sub-issue は親の issue を開く。描き直しは、索引が変わったとき（pkm-task）とノートの情報が変わったとき（pkm-template）

## 理由

- インラインテンプレートの `command` に乗せると、`@` の候補の仕組みは 1 つのままで、プラグインをまたいでも打ち方がそろう。子の Vault は、ファイルを置くだけで名前を変えたり止めたりできる。ADR-0094 がインラインで `command` を外した理由（使う場面がない）は、この依頼でなくなった
- md はふつうの Markdown リンクのままにすると、Vault の規約（素の Markdown）と wiki-lint のリンク切れの検査、ノートの改名（note-rename）の書き換えがそのまま効く
- issue・member などの「もの」を指すリンクは、今の status と題を見せるのが目的なので置き換える。ノートへのリンクは文の一部（「この記事」など）として書くことが多いので、文字を変えず印だけを足す
- 取得の上限は、issue が数千件になっても、ダイアログの描画を打つたびに軽く保つため

## 却下した案

- **pkm-task が `@` の候補を別に出す（EditorSuggest を足す）**: `@` で開く候補が 2 つになり、どちらが出るかが登録の順で決まる。打ち方も子の Vault で変えられない
- **独自の書式（`@[i-12]` など）で書く**: 素の Markdown でなくなり、Obsidian 以外では読めず、リンク切れの検査と改名の書き換えが効かない
- **ノートへのリンクも、今のタイトルのチップに置き換える**: 本文の言い回しが消え、wiki のページのリンクがすべてチップに変わる
- **sub-issue のリンク先を見出しのアンカー（`#サブの題`）にする**: 題を変えるとリンクが切れる。`id` は変わらない
- **ダイアログで全件を出す**: issue が多い Vault で、打つたびの描画が重くなる
- **daily で日付のカレンダーを開き、なければ作る**: 未来・過去の日の daily を、その日の日時でテンプレートから作ると `created` が実際と食い違う。作るのは今日だけにする

## 影響

- pkm-template: `INLINE_KIND` が `command` のあるファイルも出す（`withoutCommands` をやめる）。`insert-note-link` などのコマンドと、リンクの印（Live Preview の拡張と Reading の post processor）を足す。今日の daily を開かずに作る処理を `TemplateManager` に足す
- pkm-task: `insert-issue-link` などのコマンドと、チップ（同じく 2 つの描き方）を足す
- shared: `link-query.ts`（検索語の解釈と並べ方。Obsidian に依存しない）、`link-picker.ts`（ダイアログ）、`link-chips.ts` / `link-chips.css`（描き替え）を足す。shared の開発用の依存に `@codemirror/state` と `@codemirror/view` を足す（pkm-task・pkm-template と同じ版。型の検査のためだけで、バンドルには入らない）
- `.kit/templates/inline/` に 8 つのファイルを足す（上流の既定）。子の `template/inline/` は子のもの。子のものを書き換える移行は要らない。`.kit/changes/` に変更を書く
- ADR-0094 の「インラインテンプレートでは `command` を使わない」を置き換える
- `docs/design.md` の部品の表に、リンクのチップと検索ダイアログを足す
- Live Preview の描き替えは Obsidian の内部の描き方（リンクの装飾）と重なるので、実機で確かめる
