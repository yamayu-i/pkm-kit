# 自作プラグインのデザインルール

vault-task の UI（issue 画面、モーダル、今後の View）はこのルールに従う。決めた経緯は [ADR-0013](adr/0013-design-system.md)。
実装は `packages/vault-task/styles.css`。新しい部品を作るときは、まずここにある部品とトークンで組めないかを考える。

## 方針

- **Material 3 を参考にする**: トーナルな面の色、角丸、チップ、ホバー時の state layer、文字の階層
- **Obsidian に溶け込ませる**: 文字・背景・アクセントは Obsidian の CSS 変数から作る。テーマ（ライト / ダーク、アクセントカラー）が変わっても破綻しない
- **編集できるかどうかが、見ただけで分かる**（下の「編集できるものの目印」）
- **狭いペインとモバイルでも使える**: 画面幅ではなくペインの幅で切り替える

## トークン

`styles.css` の先頭で `body` に定義している（モーダルでも使うため）。色を直接書かず、トークンを使う。

### 面と線

| トークン | 用途 |
|---|---|
| `--vt-surface` | カードの面（文字色 3% を背景に混ぜる） |
| `--vt-surface-high` | 一段強い面（日付ブロック、関係のチップ、件数） |
| `--vt-outline` | カードやリストの枠線 |
| `--vt-outline-strong` | 編集できるものの枠線 |
| `--vt-state-hover` / `--vt-state-press` | ホバー / 押したときに重ねる色（文字色 8% / 12%） |
| `--vt-primary` / `--vt-on-primary` | Obsidian のアクセントカラー（今のページ、カレンダーのリンク） |

### 角丸

| トークン | 値 | 用途 |
|---|---|---|
| `--vt-radius-s` | 8px | チップ、入力欄、小さいボタン |
| `--vt-radius-m` | 12px | 日付の枠、期限、worklog のカード |
| `--vt-radius-l` | 16px | セクションのカード、工数のタイル |
| `--vt-radius-full` | 999px | status、ID、丸いボタン |

### 色

色は「container（面）/ on（文字）/ 印（点・アイコン・枠）」の 3 つ組で持ち、`body.theme-dark` でダーク用に置き換える。

| 色 | 使う場所 |
|---|---|
| green | open、実行日、記録中の worklog |
| blue | in-progress、worklog の作業時間 |
| purple | closed |
| gray | canceled、priority の chore |
| sky（薄い水色） | someday、priority の low |
| pink | waiting、delegated |
| red | priority の high、deadline の枠、期限切れ |
| amber | priority の mid、mid_due の枠 |

- status の色は ADR-0006 の割り当てに従う。ID のバッジも status と同じ色にする
- 期限は `--vt-due-3` → `--vt-due-0`（薄い黄色 → 黄色 → オレンジ → 赤）。期限を過ぎたら赤い枠（ADR-0006）
- label の色はユーザーが `issue/labels.json` に書いた色をそのまま使う（文字は濃いグレー固定）

### 文字

| 役割 | 指定 | 例 |
|---|---|---|
| 見出し（headline） | 1.6em / 600 | summary |
| 数値（title） | 1.35em / 600、`tabular-nums` | 工数 |
| 本文 | Obsidian の `--font-ui-medium` / `--font-ui-small` | |
| ラベル（label-small） | 11px / 500、大文字、字間 0.06em、`--text-muted` | ESTIMATED、MID_DUE、WORKLOG |
| 補足 | 11〜12px、`--text-faint` | created / updated |

- 時刻・日付・時間の数字には `tabular-nums` を付けて桁をそろえる

## 部品

| 部品 | クラス | 見た目 |
|---|---|---|
| カード | `.vt-card` | `--vt-surface` の面 + `--vt-outline` の枠、角丸 l、余白 14px 16px。関係するものをまとめる入れ物で、カード自体は押せない |
| status | `.vt-badge.vt-status.is-wide` | 丸い tonal ボタン。高さ 44px、16px 太字、先頭に色の点、末尾に ▾ |
| バッジ | `.vt-badge` | 高さ 26px、角丸 s、12px |
| ID | `.vt-id` | 丸いバッジ、等幅フォント、status の色 |
| priority | `.vt-priority` | アイコン（▲ ■ ▼ ·）付きのチップ + ▾ |
| 入力チップ | `.vt-field-chip` | 枠線 + 先頭のアイコン。未入力は点線で「〜を追加」 |
| 期限 | `.vt-due` | ラベル・値・カレンダーアイコンの横並び。近づくと色が付く |
| 日付の枠 | `.vt-day` | 36px の角丸の四角。土日は枠が太い。今日は下に点 |
| タイル | `.vt-effort-cell` | ラベル + 大きい数字。編集できるものは `.is-editable`、計算値は `.is-readonly` |
| リストの項目 | `.vt-log` | 押せるカード。左に日付ブロック、右に時間のチップと鉛筆 |
| ページング | `.vt-pager` | 丸い前後ボタン（40px、枠線）+ ページ番号（今のページはアクセントカラーで塗る）。多いときは `…` で省略 |
| アイコンボタン | `.vt-icon-button` | 24px の丸、ホバーで面が付く |
| 空の状態 | `.vt-empty` | 点線の枠 + 薄い文字 |

アイコンは Obsidian の `setIcon`（Lucide）を `Icon` 部品（`src/ui/Icon.tsx`）で使う。文字の記号（✎ ＋ ×）でアイコンを代用しない。

## 編集できるものの目印

| 種類 | 目印 |
|---|---|
| 選択肢から選ぶ（status、priority、estimated） | 末尾に ▾（`chevron-down`） |
| 文字を入力する（status-detail、summary） | 鉛筆（`pencil`）。summary はホバーで出す |
| 日付を選ぶ（mid_due、deadline、revisit） | カレンダー（`calendar` / `calendar-clock`） |
| 追加する（label、子 issue） | `plus` / `tag`、未入力なら点線 |
| 外す | `x` |
| 押すと開く・編集する項目（worklog） | 影の付いたカード + 鉛筆。ホバーで影が強くなる |

- **編集できるもの**: `--vt-outline-strong` の枠 + `--background-primary` の面（カードの面より一段明るい）+ 上のアイコン
- **読み取り専用（計算値など）**: 枠なし、`--vt-surface` の面、値は `--text-muted`。ホバーしても変わらない
- 押せるものには必ずホバー（`--vt-state-hover` を重ねる、影を強くする）を付ける。押したときは少し縮める（`scale(0.92〜0.99)`）
- 無効なボタンは不透明度 0.38

## レイアウト

- issue 画面のヘッダーは左右に 12px の余白を取る
- セクションの間は 12px。カードの中も 12px
- `.vt-header` に `container-type: inline-size` を付け、**ペインの幅が 480px 以下**なら横並びを縦並びにする（`@container`）。画面幅の `@media` は使わない
- 縦並びにしたとき、`flex: 1 1 0` の子は高さが潰れるので `flex: none` に戻す
- 長い文字は省略（`text-overflow: ellipsis`）し、`min-width: 0` を忘れない。グリッドは `minmax(0, 1fr)`

## ダークテーマ

- 色トークンは `body.theme-dark` でダーク用に置き換える。container は暗く、on（文字）は明るくする
- 新しい色を足すときは、ライトとダークの両方を定義する

## アクセシビリティ

- アイコンだけのボタンには `aria-label` と `title` を付ける
- 今のページは `aria-current="page"`、トグルは `aria-pressed`
- 文字と面の組み合わせは、container と on の組（または白文字と濃い色）にする

## 確認のしかた

Obsidian がなくても、ブラウザで見た目を確認できる。

```sh
cd .plugin-src/packages/vault-task
pnpm preview:ui      # preview/out/ に light / dark × 広い / 狭いペインの PNG を出す
```

- `preview/fixture.tsx` のデータで issue 画面のヘッダーを描き、Chromium（Playwright）でスクリーンショットを撮る。`obsidian` は `preview/obsidian-mock.ts` に差し替える
- UI を変えたら、ライト / ダークと狭いペインの 4 枚を見てからコミットする。実行時のエラーがあると失敗する
- 新しい View を作ったら、fixture に足して同じように確認できるようにする
