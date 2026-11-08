# デザインルール

自作プラグインの UI（vault-task の issue 画面・モーダル・今後の View）と、Vault の Obsidian の外観についてのルール。
決めた経緯は [ADR-0013](adr/0013-design-system.md)（Material 3 を参考にする）と [ADR-0016](adr/0016-design-under-control.md)（デザインを管理下に置く）。

- **必須**: 守らなければならない。ほとんどは検査で機械的に確かめている（下の「検査の一覧」）
- **推奨**: 理由があれば外してよい。外すときはこのファイルか ADR に理由を書く

## 1. 根拠の優先順位

ルールがぶつかったときは上が勝つ。

| 順位 | 根拠 | 使い方 |
|---|---|---|
| 1 | [WCAG 2.2](https://www.w3.org/TR/WCAG22/) の AA | 守る。コントラスト（1.4.3 / 1.4.11）、押せる大きさ（2.5.8）、フォーカス（2.4.7）、キーボード（2.1.1） |
| 2 | このファイルとトークン（`tokens.json`） | このリポジトリで決めたこと。値は M3 を元にし、違うところは「M3 との違い」に書く |
| 3 | [Material 3](https://m3.material.io/) | 値の出どころ。[material-web の tokens v0_192](https://github.com/material-components/material-web/tree/main/tokens/versions/v0_192)（角丸・state layer・文字・動き）と [material-color-utilities](https://github.com/material-foundation/material-color-utilities) の `color_spec_2021.ts`（色の役割ごとのコントラスト） |
| 4 | [Obsidian の CSS 変数](https://docs.obsidian.md/Reference/CSS+variables/CSS+variables) | 文字の大きさ（13px / 15px）と面の色の出発点。ただし値はトークンで決め、Obsidian 側をそれに合わせて固定する |

トークンの書式は [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/) に従う。

## 2. 管理の仕組み

デザインの値は 1 か所（正本）に置き、ほかはすべてそこから生成するか、検査で照合する。

```
packages/design/tokens.json（正本）
  ├─ pnpm --filter design build（pnpm build に含まれる）
  │    ├─ packages/vault-task/tokens.css        … プラグインの CSS 変数。ビルドで styles.css の前に連結する
  │    ├─ packages/vault-template/tokens.css    … プラグインの CSS 変数。ビルドで styles.css の前に連結する
  │    ├─ .obsidian/snippets/vault-theme.css    … Obsidian 本体の色を同じ値に固定するスニペット
  │    ├─ docs/design-tokens.md                 … 値とコントラスト比の一覧
  │    └─ packages/design/generated/tokens.ts   … TS から使う色（label の検査）
  └─ 検査
       ├─ pnpm check（packages/design の test）  … トークン・生成物・CSS・Obsidian の設定・このファイル
       ├─ pnpm task:lint                          … labels.json の色
       └─ pnpm preview:ui                         … 描画した画面
```

- **必須**: 値（色・大きさ・余白・角丸・文字・影・動き）は `tokens.json` にだけ書く。CSS に直接書かない
- **必須**: 生成物は手で編集しない。`tokens.json` を変えたら `pnpm build` して、生成物も一緒にコミットする
- **必須**: 値の一覧は [design-tokens.md](design-tokens.md)（生成物）を見る。このファイルには値を書かない（検査で照合できないため）

### トークンの書き方

- 色は `{ colorSpace: "srgb", components, alpha?, hex }`。components と hex が食い違うと読み込みで失敗する
- ダークテーマの値、役割、コントラストの条件などは `$extensions["com.yamayu-pkm"]` に書く

| 拡張 | 意味 |
|---|---|
| `dark` | ダークテーマの値。ないときはライトと同じ |
| `role` | 色の役割: `surface`（面）/ `text`（文字）/ `graphic`（印・枠・アイコン）/ `state`（重ねる色）/ `decorative`（飾り） |
| `contrast` | `{ min, on }`。on はその色を置く面。半透明の面は `["{color.surface}", "{color.state-hover}"]` のように下から並べる |
| `obsidian` | Obsidian 側で同じ値に固定する CSS 変数 |
| `plugin` | `false` ならプラグインの CSS には出さない |
| `source` | 値の根拠 |

- **必須**: `text` の色は `contrast.min` を 4.5 以上（WCAG 1.4.3）、`graphic` の色は 3 以上（WCAG 1.4.11）にする。書かないと読み込みで失敗する
- **必須**: 色を置く面が増えたら `contrast.on` に足す。ホバーで面が変わるなら、重ねた面も足す
- CSS 変数名はパスを `-` でつないだもの（`type.label-small.size` → `--vt-type-label-small-size`）。`color` グループだけは頭を省く（`color.on-surface` → `--vt-on-surface`）

## 3. Obsidian 側の固定

プラグインの色は Obsidian の背景の上に載るので、背景が分からないとコントラストを保証できない。そこで各 Vault の設定で外観を固定する。

- **必須**: `.obsidian/appearance.json` は次のとおり（`obsidian/*` の検査）。値の正本は `.kit/obsidian-required.json` の `appearance.json` で、上流のテストがこれを検査する。各 Vault の `.obsidian/appearance.json` は、セットアップと検査でこの値に合わせる（ハーネスの ADR-0009）
  - `cssTheme` は空（コミュニティテーマを使わない）
  - `enabledCssSnippets` は `["vault-theme"]` だけ
  - `accentColor` はトークンの primary（ライト）と同じ
  - `translucency` は `false`
  - `theme` は自由（ライト / ダークの両方を定義しているので `system` にしている）
- **必須**: Obsidian 本体の色の変数（`--background-primary`、`--background-secondary`、`--text-normal`、`--text-muted`、`--text-faint`、`--interactive-accent`、`--text-accent`、`--color-accent`、`--text-on-accent`、`--text-error`）はスニペットで固定する。どれを固定するかはトークンの `obsidian` で決める
- Obsidian の標準の `--text-faint` は 4.5:1 に届かないので、スニペットで上げている
- **必須**: 入力欄（`input` / `textarea` / `select`）の面・枠・文字・影は Obsidian の既定に任せない。Obsidian は入力欄に浮いて見える影（`--input-shadow`）と自分の色を付けるので、プラグインの根（vault-task は `.vt-ui`、vault-template は `.vt-tpl-view` / `.vt-tpl-modal`）で範囲を決めた共通のルールで、面 `--vt-surface`・枠 `--vt-outline`・文字 `--vt-on-surface`・`box-shadow: none` にし、ホバーで枠を `--vt-on-surface`、フォーカスで `--vt-primary` の 2px の枠にする（M3 の outlined text field。`input/outlined` の検査）。プレビュー（`preview:ui`）はブラウザの既定で描くので、Obsidian 任せの見た目はプレビューと実機で食い違う
- フォントは端末（Windows / macOS / iOS / Android）ごとに違うので固定しない。`--font-interface` / `--font-text` / `--font-monospace` だけは Obsidian の変数を使ってよい

## 4. 色

- **必須**: プラグインの CSS で色を使うときは、トークン（`--vt-*`）を使う。Obsidian の色の変数は使わない
- **必須**: 色は「面（container）/ その上の文字（on）/ 印（点・アイコン・枠）」の 3 つ組で持ち、ライトとダークの両方を定義する
- **必須**: 文字を薄くするのに `opacity` を使わない。弱い文字は `--vt-on-surface-variant` にする（opacity だと下の面によって比が変わり、保証できない）

### 役割

| トークン | 役割 | 用途 |
|---|---|---|
| `--vt-surface` | 面 | 基本の面（Obsidian のエディタの背景）。編集できるものの面 |
| `--vt-surface-container` | 面 | カードの面 |
| `--vt-surface-container-high` | 面 | 一段強い面（日付ブロック、関係のチップ、件数） |
| `--vt-secondary-container` / `--vt-on-secondary-container` | 面 / 文字 | 選んでいるもの（選んだ行、on の絞り込みチップ、今の段階、カードを落とせるグループ） |
| `--vt-on-surface` | 文字（7:1） | 本文 |
| `--vt-on-surface-variant` | 文字（4.5:1） | 補助の文字、ラベル、アイコン、未入力の表示 |
| `--vt-outline` | 印（3:1） | 編集できるものの枠線 |
| `--vt-outline-variant` | 飾り | カード・リスト・区切り線の枠 |
| `--vt-state-hover` / `--vt-state-press` | 状態 | ホバー / 押したときに重ねる色 |
| `--vt-primary` / `--vt-on-primary` | 文字 | アクセント（今のページ、テキストボタン、リンク） |
| `--vt-error` | 文字 | エラー、削除 |
| `--vt-focus-ring` | 印（3:1） | キーボードで選んだときの枠 |

### 色相

| 色 | 使う場所 |
|---|---|
| green | open、実行日、記録中の worklog |
| blue | in-progress、worklog の作業時間 |
| purple | closed |
| gray | canceled、priority の chore |
| sky（薄い水色） | someday、priority の low |
| pink | waiting、delegated |
| red | priority の high、deadline の枠、期限切れ |
| amber | priority の mid、soft_deadline の枠 |

- それぞれ `--vt-<色>-container`（面）/ `--vt-on-<色>-container`（文字）/ `--vt-<色>`（印）がある
- status の色は ADR-0006 の割り当てに従う。ID のバッジも status と同じ色にする
- 実行日の枠では、soft_deadline と deadline を面の外側に隙間を空けた枠で示す（実行日の面の色と重ならないように）
- 期限は `--vt-due-3` → `--vt-due-0`（薄い黄色 → 黄色 → オレンジ → 赤）。期限を過ぎたら赤い枠（ADR-0006）
- 実行日は `--vt-scheduled`（面）と `--vt-on-scheduled`（文字）
- **必須**: 色だけで意味を伝えない（WCAG 1.4.1）。status・priority は文字でも書く。期限は日付と「SOFT_DEADLINE / DEADLINE」の文字を出す

### label の色

- label の面はユーザーが `issue/labels.json` に書いた色をそのまま使い、文字は `--vt-on-label` に固定する
- **必須**: label の色は `--vt-on-label` との比が 4.5:1 以上（ライト / ダークの両方。半透明の色はカードの面に重ねて測る）。`pnpm task:lint` が `low-contrast-label` で知らせる

## 5. 文字

大きさは px で決める（Obsidian の UI の文字も px。ユーザーが変えられるのは本文の文字だけ）。

| 役割 | トークン | 用途 |
|---|---|---|
| headline-small | `--vt-type-headline-small-*` | summary |
| title-large | `--vt-type-title-large-*` | 工数の数値 |
| title-medium | `--vt-type-title-medium-*` | status、狭いペインの工数 |
| body-medium | `--vt-type-body-medium-*` | 本文（Obsidian の `--font-ui-medium` と同じ大きさ） |
| body-small | `--vt-type-body-small-*` | 補助の本文（Obsidian の `--font-ui-small` と同じ大きさ） |
| label-medium | `--vt-type-label-medium-*` | バッジ、テキストボタン、時間 |
| label-small | `--vt-type-label-small-*` | 欄の名前（大文字）、曜日、件数、created / updated |

- 各役割に `-size` / `-line-height` / `-weight` / `-tracking` がある。太さだけを変えるときは `--vt-weight-*`
- **必須**: font-size・font-weight・letter-spacing・line-height はトークンを使う（line-height は 1 / normal も可）
- **必須**: 文字の最小は label-small（11px）
- 時刻・日付・時間の数字には `font-variant-numeric: tabular-nums` を付けて桁をそろえる（推奨）

## 6. 形・余白・大きさ

- **必須**: 角丸は `--vt-radius-xs` / `--vt-radius-s` / `--vt-radius-m` / `--vt-radius-l` / `--vt-radius-xl` / `--vt-radius-full`（M3 の corner-extra-small〜full）。丸は `--vt-radius-full`
- **必須**: 余白と位置（padding・margin・gap・inset・outline-offset）は space の値（2 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 96px）。2px は細かい位置合わせだけ、64 / 96px は大きい領域だけに使う
- **必須**: 大きさ（width・height・flex-basis・grid の列）の px は 4 の倍数（M3 の 4dp グリッド）
- **必須**: 枠線の太さは 1px（`--vt-border-width-thin`）か 2px（`--vt-border-width-thick`）
- **必須**: 影は `--vt-elevation-1`（押せるカード）/ `--vt-elevation-2`（編集できるタイル・行のホバー）/ `--vt-elevation-3`（押せるカードのホバー）/ `--vt-elevation-4`（浮いている操作バー）/ `--vt-elevation-5`（持ち上げて動かすカード）。枠線の代わりの `inset 0 0 0 1px var(--vt-*)` と、選んだものの輪 `0 0 0 1px var(--vt-*)` は可
- **必須**: 押せるものは 24×24px 以上（WCAG 2.5.8。`--vt-size-target-min`）。小さいときは、中心から 24px 四方に他の押せるものを置かない
- 指で押す画面（モバイル）では 40px 以上を目安にする（推奨。M3 は 48dp）

## 7. 状態と動き

- **必須**: 押せるものには必ずホバーを付ける。面がある要素は `background-image: linear-gradient(var(--vt-state-hover), var(--vt-state-hover))` で面の色を変えずに重ねる。色付きのバッジは `::after` に currentColor を置き、`--vt-opacity-state-hover` / `--vt-opacity-state-press` で重ねる（state layer）
- **必須**: キーボードで選んだものには `:focus-visible` で 2px の `--vt-focus-ring` の枠を出す（WCAG 2.4.7）。`outline: none` で消さない
- **必須**: マウスで押せるものは Tab でも選べるようにする（button を使う。使えないときは `tabindex="0"` と Enter の処理）（WCAG 2.1.1）
- **必須**: 無効なものは `--vt-opacity-disabled`（0.38）
- 押したときは少し縮める。小さい丸いボタン・日付は `--vt-scale-press-small`、ボタンは `--vt-scale-press-medium`、カードは `--vt-scale-press-large`
- **必須**: transition / animation の時間は `--vt-duration-*`、緩急は `--vt-easing-standard`（M3 の値）
- **必須**: `@media (prefers-reduced-motion: reduce)` では transition と animation を止める
- **必須**: filter・backdrop-filter・mix-blend-mode を使わない（できる色が決まらず、コントラストを保証できない）

## 8. 部品

新しい部品を作るときは、まずここにある部品とトークンで組めないかを考える。

| 部品 | クラス | 見た目 |
|---|---|---|
| カード | `.vt-card` | `--vt-surface-container` の面 + `--vt-outline-variant` の枠、角丸 l、余白 16px。関係するものをまとめる入れ物で、カード自体は押せない |
| status | `.vt-badge.is-wide` | 丸い tonal ボタン。高さ 44px、title-medium、先頭に status のアイコン、末尾に ▾ |
| status のアイコン | `.vt-status-icon` | ○ を土台にした自作の SVG（ADR-0031）。色は status の印の色（`--vt-dot`）、白抜きは下の面（`--vt-knock`）。in-progress は `--vt-duration-spin` でゆっくり回り、closed は閉じた直後（`.is-enter`）だけチェックを描く |
| 次の status | `.vt-next` | ボードのカードの 28px の丸い tonal ボタン。押した後の status の色とアイコン。戻す（`.is-undo`）は枠線だけ |
| 完了の欄 | `.vt-done` | ボードの下のカード。closed / canceled のカードを並べる。カードは落とせない |
| 取り消しのトースト | `.vt-toast` | 画面の右下に固定（モバイルは下のツールバーの上に左右いっぱい）。`--vt-surface-container-high` の面 + `--vt-elevation-4`、右に primary の文字のボタン（`.vt-toast-action`）。Obsidian の Notice は使わない |
| バッジ | `.vt-badge` | 高さ 28px、角丸 s、label-medium |
| ID | `.vt-id` | 丸いバッジ、等幅フォント、status の色 |
| priority | `.vt-priority` | 記号（▲ ■ ▼ ·）付きのチップ + ▾。記号は飾りなので `aria-hidden` |
| 入力チップ | `.vt-field-chip` | 枠線 + 先頭のアイコン。未入力は点線で「〜を追加」 |
| 期限 | `.vt-due` | ラベル・値・カレンダーアイコンの横並び。近づくと色が付く |
| 日付の枠 | `.vt-day` | 36px の角丸の四角。土日は枠が太い。今日は太字と下に点で、選んでいないときは枠と文字を primary にする（ADR-0030）。別の月は文字と枠を一段弱く（薄くはしない） |
| タイル | `.vt-effort-cell` | ラベル + 大きい数字。編集できるものは `.is-editable`、計算値は `.is-readonly` |
| リストの項目 | `.vt-log` | 押せるカード。左に日付ブロック、右に時間のチップと鉛筆 |
| ページング | `.vt-pager` | 丸い前後ボタン（40px、枠線）+ ページ番号（今のページは primary で塗る）。多いときは `…` で省略 |
| アイコンボタン | `.vt-icon-button` | 24px の丸、ホバーで面が付く |
| 空の状態 | `.vt-empty` | 点線の枠 + 弱い文字 |
| ボタン | `.vt-button`（`.is-primary` / `.is-text`） | 丸い 36px。outlined が既定、主な操作は filled（primary）、補助は text |
| 段階表示 | `.vt-stepper` / `.vt-step` | 今の段階だけ丸い番号 + ラベル + 件数（赤い tonal）を secondary-container の面で出す。ほかは 40px の番号の丸に縮め、細い線でつなぐ。済みは緑のチェック、残りがあれば右上に赤い点。名前と件数はツールチップ（`title` / `aria-label`）。狭いペインでも横スクロールにしない |
| 一覧の行 | `.vt-table` / `.vt-tr` | 押せるカードの行（48px 以上）。選んだ行は primary の枠 + secondary-container の面。狭いペインでは補助の列を隠す |
| 操作バー | `.vt-actionbar` | 選んだ行への操作。下に貼り付き、選ぶと浮き上がる（`--vt-elevation-4`） |
| 絞り込みチップ | `.vt-filter-chip` | M3 の filter chip。on で secondary-container の面 + チェック |
| 検索欄 / 素早い追加 | `.vt-search` / `.vt-quick-add` | 丸い入力欄 + 先頭のアイコン |
| カード（ボード） | `.vt-task` | 押せる・ドラッグできるカード。ID は出さず表題を優先する。記録中は緑の枠 |
| 再生 / 停止 | `.vt-play` | 緑（再生）/ 赤（停止 + 経過時間）の丸いボタン |
| グループ | `.vt-group` | ボードの枠。1 階層目は横に等分（`.vt-board-columns`、狭いペインでは縦）、サブグループは中に縦に積む。カードを落とせるときは primary の枠 + secondary-container の面 |
| 未分類 | `.vt-group.is-ungrouped` | グループと並べず、ボードの上に横長に置く（点線の枠、カードは横に並ぶ）。カードがすべてグループに入ったら出さない |
| 大きい丸ボタン | `.vt-round` | Organize の操作。予定 = 緑、Someday = 水色、Cancel = 赤 |
| スイッチ | `.vt-switch` | M3 の switch（52×32、つまみは 16px → 24px）。routine の一時停止 |
| 入力欄 | `.vt-ui` の中の `input` / `textarea` / `select` | M3 の outlined text field。`--vt-surface` の面 + `--vt-outline` の 1px の枠、影なし。ホバーで `--vt-on-surface` の枠、フォーカスで `--vt-primary` の 2px の枠（3 章）。View・ヘッダー・モーダルの根に `.vt-ui` を付ける |
| 名前の入力欄 | `.vt-name-field` | M3 の outlined text field 風。枠の上にラベル、下に説明（`.vt-name-hint`）かエラー。その場で作る・変える編集に使う |
| 追加ボタン（大） | `.vt-add-group` | 点線の枠の大きいボタン。一覧の最後に「〜を追加」 |
| 色の見本 | `.vt-color-swatch` | 44px の角丸の四角のカラーピッカー（`input[type=color]`）。`--vt-outline` の枠。隣に `#rrggbb` の `.vt-name-field` を置く |
| 小さいチップ | `.vt-chip-mini` / `.vt-date-chip` | 補足（Inbox / 今日 / 日付） |
| サイドバーの行 | `.vt-sidebar` / `.vt-nav-item` | 左サイドバーの画面移動ボタン（40px、先頭にアイコン、右端に件数） |

アイコンは Obsidian の `setIcon`（Lucide）を `Icon` 部品（`src/ui/Icon.tsx`）で使う。文字の記号（✎ ＋ ×）でアイコンを代用しない（priority の記号は例外。意味は文字でも書いている）。status のアイコンは例外で、Lucide にない形なので自作の SVG（`StatusIcon` 部品、`src/ui/StatusIcon.tsx`）を使う（ADR-0031）。

## 9. 編集できるものの目印

| 種類 | 目印 |
|---|---|
| 選択肢から選ぶ（status、priority、estimated） | 末尾に ▾（`chevron-down`） |
| 文字を入力する（status-detail、summary） | 鉛筆（`pencil`）。summary はホバーで出す |
| 日付を選ぶ（soft_deadline、deadline、revisit） | カレンダー（`calendar` / `calendar-clock`） |
| 追加する（label、子 issue） | `plus` / `tag`、未入力なら点線 |
| 外す | `x` |
| 押すと開く・編集する項目（worklog） | 影の付いたカード + 鉛筆。ホバーで影が強くなる |

- **編集できるもの**: `--vt-outline` の枠（3:1）+ `--vt-surface` の面（カードの面より一段明るい）+ 上のアイコン
- **読み取り専用（計算値など）**: 枠なし、`--vt-surface-container` の面、値は `--vt-on-surface-variant`。ホバーしても変わらない

## 10. レイアウト

- issue 画面のヘッダーは左右に 12px の余白を取る。View（`.vt-page`）は 16px、最大幅 1200px で中央に置く
- View の見出しは「タイトル（headline-small）+ 件数のチップ + 右に主な操作」
- セクションの間は 12px。カードの中も 12px
- `.vt-header` と `.vt-view` に `container-type: inline-size` を付け、ペインの幅で切り替える（`@container`）
  - 720px 以下（`--vt-breakpoint-pane-medium`）: 一覧の補助の列を隠し、ボードのグループを縦に積む
  - 480px 以下（`--vt-breakpoint-pane-narrow`）: 横並びを縦並びにする
  - 300px 以下（`--vt-breakpoint-pane-compact`）: 工数のタイルを 1 列にする
- **必須**: 画面の幅・高さの `@media` は使わない。`@container` の幅は breakpoint のトークンと同じ数字にする（`@container` の中では var() が使えないので、検査で照合する）
- 縦並びにしたとき、`flex: 1 1 0` の子は高さが潰れるので `flex: none` に戻す
- 長い文字は省略（`text-overflow: ellipsis`）し、`min-width: 0` を忘れない。グリッドは `minmax(0, 1fr)`

## 11. M3 との違い

| 項目 | M3 | このリポジトリ | 理由 |
|---|---|---|---|
| label-small | 小文字のまま | 欄の名前・曜日は大文字 | frontmatter のキー（estimated など）を、値と見分けやすくする |
| headline-small の太さ | 400 | 600 | summary を画面の見出しとして目立たせる |
| title-large | 22px | 20px | 工数のタイル 3 つが狭いペインで折り返さないように |
| 本文の大きさ | 14px（body-medium） | 15px / 13px | Obsidian の UI の文字（`--font-ui-medium` / `--font-ui-small`）にそろえる |
| 影 | elevation の 2 層の影 | 1 層の薄い影 | Obsidian の平らな見た目に合わせる |
| 押せる大きさ | 48dp | 24px（WCAG 2.5.8 の最小） | デスクトップの密度を優先する。モバイルの対応は今後の課題 |
| ライトの基本の面と本文 | 白に近い面と濃い文字 | 純白を避けた暖かい白と、少し抑えた文字（比は 7:1 以上を保つ） | 長く読んでも目が疲れにくいように（ADR-0019） |
| 色 | ソースカラーから HCT で生成 | 手で選んだ値を、コントラストの検査で保証する | 依存を増やさない（ADR-0016） |

## 12. 検査の一覧

ID は検査が出すメッセージと同じ。新しい検査を足したら、ここにも書く（書き忘れは `pnpm check` で見つかる）。

### CSS（`pnpm check`。`packages/design/src/css-lint.ts`）

| ID | 内容 | 根拠 |
|---|---|---|
| `color/no-literal` | 色を直接書かない（16 進、rgb() などの関数、色の名前、color-mix()） | 2・4 章 |
| `var/known` | var() はトークン、ファイル内で定義した --vt- の変数、Obsidian のフォントの変数だけ | 3・4 章 |
| `var/local` | ファイル内で定義する変数（例: `--vt-dot`、`--vt-cols`）は --vt- で始め、トークンを上書きせず、値はトークン 1 つの var() か数 | 2 章 |
| `type/font-size` | font-size はトークン | 5 章 |
| `type/font-weight` | font-weight はトークン | 5 章 |
| `type/letter-spacing` | letter-spacing はトークンか normal / 0 | 5 章 |
| `type/line-height` | line-height はトークンか normal / 1 | 5 章 |
| `type/font-family` | font-family は inherit か Obsidian のフォントの変数 | 3 章 |
| `shape/radius` | 角丸はトークンか 0 | 6 章、M3 shape |
| `space/scale` | 余白・位置は space の値 | 6 章、M3 の 4dp グリッド |
| `size/grid` | 大きさの px は 4 の倍数 | 6 章、M3 の 4dp グリッド |
| `border/width` | 枠線の太さは 1px / 2px | 6 章 |
| `elevation/shadow` | box-shadow は elevation のトークンか、枠線・輪（`(inset) 0 0 0 1px`）だけ | 6 章 |
| `state/opacity` | opacity は 0 / 1 / トークン（@keyframes の中は除く） | 4・7 章、M3 state |
| `motion/tokens` | transition / animation の時間と緩急はトークン | 7 章、M3 motion |
| `motion/scale` | scale() はトークン（@keyframes の中は除く） | 7 章 |
| `color/no-filter` | filter / backdrop-filter / mix-blend-mode を使わない | 7 章 |
| `css/no-important` | !important を使わない | 2 章 |
| `layout/no-viewport-media` | 画面の幅・高さの @media を使わない | 10 章 |
| `layout/container-breakpoint` | @container の幅は breakpoint のトークン | 10 章 |
| `a11y/focus-visible` | :focus-visible で --vt-focus-ring の outline を付ける | WCAG 2.4.7 |
| `a11y/no-outline-none` | outline: none / 0 で枠を消さない | WCAG 2.4.7 |
| `a11y/reduced-motion` | transition / animation を使うなら prefers-reduced-motion で止める | WCAG 2.3.3 |
| `input/outlined` | 入力欄を使うなら、class で範囲を決めた共通のルールで面・枠・文字をトークンにし、影を消し（`box-shadow: none`）、`:focus` で primary の枠にする | 3・8 章、M3 の outlined text field |

### トークン・生成物・文書（`pnpm check`。`packages/design/test/repo.test.ts`）

- `tokens.json` の書式（DTCG の型、components と hex、別名、role ごとのコントラストの下限）と、整形済みであること
- すべての `contrast` の条件を、ライト / ダークの両方で満たすこと（WCAG 1.4.3 / 1.4.11）
- 生成物が `tokens.json` と食い違っていないこと（`pnpm build` 忘れ）
- このファイルの `--vt-*` とクラス名が実在し、色の値を書いていないこと、検査の ID がすべて載っていること

### Obsidian の設定（`pnpm check`。`packages/design/src/obsidian-config.ts`）

| ID | 内容 |
|---|---|
| `obsidian/no-css-theme` | コミュニティテーマを使わない |
| `obsidian/snippets` | 有効なスニペットは vault-theme だけ |
| `obsidian/accent` | accentColor はトークンの primary |
| `obsidian/no-translucency` | 半透明のウィンドウを使わない |

### 描画した画面（`pnpm preview:ui`。`packages/design/src/audit.ts`）

| ID | 内容 | 根拠 |
|---|---|---|
| `run/contrast` | 描画された文字と、その下の面（重なりと opacity を含む）の比が 4.5:1（大きい文字は 3:1）以上 | WCAG 1.4.3 |
| `run/target-size` | 押せるものは 24×24px 以上（小さいときは周りに間隔） | WCAG 2.5.8 |
| `run/focus-visible` | Tab で選んだものに 2px 以上の枠が出る | WCAG 2.4.7 |
| `run/keyboard` | マウスで押せるもの（cursor: pointer）は Tab で選べる | WCAG 2.1.1 |

- ホバー中の見た目は描画の検査では見ていない。ホバーで面が変わる組み合わせは、トークンの `contrast.on` に重ねた面を書いて静的に確かめる
- `aria-hidden` の要素（飾りの記号）は文字のコントラストの対象外

### データ（`pnpm task:lint`）

- `low-contrast-label`: labels.json の色と `--vt-on-label` の比が 4.5:1 未満

## 13. 確認と変更のしかた

```sh
cd .kit/src
pnpm build                   # tokens.json から生成物を作り直す（プラグインのビルドも）
pnpm check                   # 型チェック → ビルド → テスト（上の静的な検査を含む）
cd packages/vault-task
pnpm preview:ui              # 画面 × light / dark × 広い / 狭いペインの PNG を出し、描画した画面を検査する
pnpm preview:ui board inbox  # 画面を絞る（header / routine / daily / board / issues / inbox / organize / scheduled / someday / routines / groups / forms）
```

- `preview/fixture.tsx` のデータで issue 画面のヘッダーと各 View を描き、Chromium（Playwright）でスクリーンショットを撮る。`obsidian` は `preview/obsidian-mock.ts` に差し替え、Obsidian 側の色は Vault のスニペット（`vault-theme.css`）をそのまま読む
- **必須**: UI を変えたら `pnpm preview:ui` を通し、変えた画面のライト / ダークと狭いペインを見てからコミットする
- 新しい View を作ったら、fixture に足して同じように確認・検査できるようにする
- 値を変えるときは `tokens.json` を編集して `pnpm build`。ルールを変えるときはこのファイルと検査を一緒に変え、決定が変わるなら ADR を足す
