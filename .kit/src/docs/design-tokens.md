# デザイントークン一覧

<!-- 生成物。手で編集しない。正本は .plugin-src/packages/design/tokens.json（pnpm --filter design build で作り直す） -->

ルールは [design.md](design.md)。ここは値の一覧で、`tokens.json` から生成している。
コントラスト比は、そのトークンに書いた面（`contrast.on`）の中で一番低いもの。半透明の面は下の面に重ねて測る（WCAG 2.2 の相対輝度）。

## 色

| CSS 変数 | 役割 | ライト | ダーク | 基準 | 最低の比（ライト / ダーク） | 用途 | 根拠 |
|---|---|---|---|---|---|---|---|
| `--vt-surface` | 面 | `#ffffff` | `#1e1e1e` | — | — | 基本の面。Obsidian のエディタの背景と同じにする Obsidian: `--background-primary` | Obsidian の標準テーマ（color-base-00） |
| `--vt-surface-container` | 面 | `#f8f8f8` | `#242424` | — | — | カードの面（on-surface を 3% 重ねた色） | M3 surface-container |
| `--vt-surface-container-high` | 面 | `#f0f0f0` | `#2b2b2b` | — | — | 一段強い面（日付ブロック、関係のチップ、件数）（on-surface を 7% 重ねた色） | M3 surface-container-high |
| `--vt-on-surface` | 文字 | `#222222` | `#dadada` | 7:1 | 12.03 / 8.29 | 本文の文字 Obsidian: `--text-normal` | M3 on-surface（標準のコントラストで 7:1） |
| `--vt-on-surface-variant` | 文字 | `#5c5c5c` | `#b3b3b3` | 4.5:1 | 5.05 / 5.53 | 補助の文字、ラベル、アイコン、未入力の表示 Obsidian: `--text-muted` | M3 on-surface-variant |
| `--vt-outline` | 印 | `#858585` | `#7a7a7a` | 3:1 | 3.23 / 3.29 | 編集できるものの枠線 | M3 outline（3:1） |
| `--vt-outline-variant` | 飾り | `#22222224` | `#dadada24` | — | — | カード・リスト・区切り線の枠（飾り。面の違いでも見分けられる） | M3 outline-variant |
| `--vt-state-hover` | 状態 | `#22222214` | `#dadada14` | — | — | ホバーで重ねる色（on-surface の 8%） | M3 hover state layer 0.08 |
| `--vt-state-press` | 状態 | `#2222221f` | `#dadada1f` | — | — | 押したときに重ねる色（on-surface の 12%） | M3 pressed state layer 0.12 |
| `--vt-primary` | 文字 | `#6750a4` | `#d0bcff` | 4.5:1 | 4.87 / 6.80 | アクセント（今のページ、テキストボタン、リンク） Obsidian: `--interactive-accent` `--text-accent` `--color-accent` | M3 baseline primary |
| `--vt-on-primary` | 文字 | `#ffffff` | `#381e72` | 4.5:1 | 6.44 / 7.71 | primary の上の文字 Obsidian: `--text-on-accent` | M3 baseline on-primary |
| `--vt-primary-state-hover` | 状態 | `#6750a414` | `#d0bcff14` | — | — | テキストボタンのホバー（primary の 8%） | M3 hover state layer 0.08 |
| `--vt-error` | 文字 | `#b3261e` | `#f2b8b5` | 4.5:1 | 5.73 / 8.29 | エラーの文字、削除ボタン Obsidian: `--text-error` | M3 baseline error |
| `--vt-focus-ring` | 印 | `#6750a4`（= --vt-primary） | `#d0bcff`（= --vt-primary） | 3:1 | 5.65 / 8.30 | キーボードで選んだときの枠 |  |
| `--vt-text-faint` | 文字 | `#707070` | `#8c8c8c` | 4.5:1 | 4.95 / 4.95 | Obsidian 本体の薄い文字。プラグインでは使わない（標準の値は 4.5:1 に届かないので上げる） （プラグインでは使わない） Obsidian: `--text-faint` | WCAG 1.4.3 |
| `--vt-green-container` | 面 | `#c4eed0` | `#0f5223` | — | — | green の面（open、実行日、記録中の worklog） |  |
| `--vt-on-green-container` | 文字 | `#072711` | `#c4eed0` | 4.5:1 | 10.90 / 6.20 | green の面の上の文字 |  |
| `--vt-green` | 印 | `#1e8e3e` | `#6dd58c` | 3:1 | 3.30 / 5.12 | green の印（点・アイコン・枠） |  |
| `--vt-blue-container` | 面 | `#d3e3fd` | `#0842a0` | — | — | blue の面（in-progress、worklog の作業時間） |  |
| `--vt-on-blue-container` | 文字 | `#041e49` | `#d3e3fd` | 4.5:1 | 10.87 / 6.06 | blue の面の上の文字 |  |
| `--vt-blue` | 印 | `#0b57d0` | `#a8c7fa` | 3:1 | 4.91 / 5.31 | blue の印（点・アイコン・枠） |  |
| `--vt-purple-container` | 面 | `#eaddff` | `#4f378b` | — | — | purple の面（closed） |  |
| `--vt-on-purple-container` | 文字 | `#21005d` | `#eaddff` | 4.5:1 | 11.51 / 6.11 | purple の面の上の文字 |  |
| `--vt-purple` | 印 | `#6750a4` | `#d0bcff` | 3:1 | 4.99 / 5.47 | purple の印（点・アイコン・枠） |  |
| `--vt-gray-container` | 面 | `#e3e3e3` | `#444746` | — | — | gray の面（canceled、priority の chore） |  |
| `--vt-on-gray-container` | 文字 | `#1f1f1f` | `#e3e3e3` | 4.5:1 | 11.10 / 6.10 | gray の面の上の文字 |  |
| `--vt-gray` | 印 | `#747775` | `#c4c7c5` | 3:1 | 3.52 / 5.51 | gray の印（点・アイコン・枠） |  |
| `--vt-sky-container` | 面 | `#c2e7ff` | `#004a77` | — | — | sky の面（someday、priority の low） |  |
| `--vt-on-sky-container` | 文字 | `#001d35` | `#c2e7ff` | 4.5:1 | 11.39 / 6.12 | sky の面の上の文字 |  |
| `--vt-sky` | 印 | `#00639b` | `#7fcfff` | 3:1 | 4.96 / 5.46 | sky の印（点・アイコン・枠） |  |
| `--vt-pink-container` | 面 | `#ffd8e4` | `#8c1d4f` | — | — | pink の面（waiting、delegated） |  |
| `--vt-on-pink-container` | 文字 | `#3e001d` | `#ffd8e4` | 4.5:1 | 11.45 / 5.93 | pink の面の上の文字 |  |
| `--vt-pink` | 印 | `#c2185b` | `#ffb0c8` | 3:1 | 4.52 / 5.11 | pink の印（点・アイコン・枠） |  |
| `--vt-red-container` | 面 | `#f9dedc` | `#8c1d18` | — | — | red の面（priority の high、deadline の枠、期限切れ） |  |
| `--vt-on-red-container` | 文字 | `#410e0b` | `#f9dedc` | 4.5:1 | 11.04 / 6.32 | red の面の上の文字 |  |
| `--vt-red` | 印 | `#d93025` | `#f2b8b5` | 3:1 | 3.75 / 5.33 | red の印（点・アイコン・枠） |  |
| `--vt-amber-container` | 面 | `#ffecb3` | `#5c4300` | — | — | amber の面（priority の mid、mid_due の枠） |  |
| `--vt-on-amber-container` | 文字 | `#3a2a00` | `#ffecb3` | 4.5:1 | 10.21 / 6.66 | amber の面の上の文字 |  |
| `--vt-amber` | 印 | `#b06d00` | `#ffd54f` | 3:1 | 3.55 / 6.59 | amber の印（点・アイコン・枠） |  |
| `--vt-scheduled` | 面 | `#188038` | `#2e7d32` | — | — | 実行日の面 |  |
| `--vt-scheduled-hover` | 面 | `#137333` | `#296e2c` | — | — | 実行日のホバー |  |
| `--vt-on-scheduled` | 文字 | `#ffffff` | `#ffffff` | 4.5:1 | 5.01 / 5.12 | 実行日の文字 |  |
| `--vt-due-3` | 面 | `#fff8e1` | `#4a3f14` | — | — | 期限の 3 日前 |  |
| `--vt-due-2` | 面 | `#ffe082` | `#6b5300` | — | — | 期限の 2 日前 |  |
| `--vt-due-1` | 面 | `#ffb74d` | `#8a4b00` | — | — | 期限の前日 |  |
| `--vt-on-due` | 文字 | `#3a2a00` | `#fff3d6` | 4.5:1 | 6.99 / 5.38 | 期限（3〜1 日前）の文字 |  |
| `--vt-due-0` | 面 | `#d93025` | `#b3261e` | — | — | 期限の当日 |  |
| `--vt-on-due-0` | 文字 | `#ffffff` | `#ffffff` | 4.5:1 | 4.77 / 5.96 | 期限の当日の文字 |  |
| `--vt-on-label` | 文字 | `#1f1f1f` | `#1f1f1f` | 4.5:1 | — / — | label の文字。面はユーザーが labels.json に書いた色なので、task:lint で 4.5:1 以上かを調べる |  |

## radius

| CSS 変数 | 値 | 用途 | 根拠 |
|---|---|---|---|
| `--vt-radius-xs` | `4px` | リンクのホバー | M3 corner-extra-small |
| `--vt-radius-s` | `8px` | チップ、入力欄、小さいボタン | M3 corner-small |
| `--vt-radius-m` | `12px` | 日付の枠、期限、worklog のカード | M3 corner-medium |
| `--vt-radius-l` | `16px` | セクションのカード、工数のタイル | M3 corner-large |
| `--vt-radius-full` | `9999px` | status、ID、丸いボタン | M3 corner-full |

## space

| CSS 変数 | 値 | 用途 | 根拠 |
|---|---|---|---|
| `--vt-space-2` | `2px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけに使う |  |
| `--vt-space-4` | `4px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけに使う |  |
| `--vt-space-8` | `8px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけに使う |  |
| `--vt-space-12` | `12px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけに使う |  |
| `--vt-space-16` | `16px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけに使う |  |
| `--vt-space-20` | `20px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけに使う |  |
| `--vt-space-24` | `24px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけに使う |  |
| `--vt-space-32` | `32px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけに使う |  |
| `--vt-space-40` | `40px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけに使う |  |
| `--vt-space-48` | `48px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけに使う |  |

## size

| CSS 変数 | 値 | 用途 | 根拠 |
|---|---|---|---|
| `--vt-size-grid` | `4px` | 大きさ（width / height など）は grid の倍数にする | M3 の 4dp グリッド |
| `--vt-size-target-min` | `24px` | 押せるものの最小の大きさ | WCAG 2.5.8 Target Size (Minimum) |

## border-width

| CSS 変数 | 値 | 用途 | 根拠 |
|---|---|---|---|
| `--vt-border-width-thin` | `1px` | 枠線 |  |
| `--vt-border-width-thick` | `2px` | 強調した枠線、フォーカスの枠 |  |

## breakpoint

| CSS 変数 | 値 | 用途 | 根拠 |
|---|---|---|---|
| `--vt-breakpoint-pane-narrow` | `480px` | これ以下で横並びを縦並びにする |  |
| `--vt-breakpoint-pane-compact` | `300px` | これ以下で工数のタイルを 1 列にする |  |

## weight

| CSS 変数 | 値 | 用途 | 根拠 |
|---|---|---|---|
| `--vt-weight-regular` | `400` |  |  |
| `--vt-weight-medium` | `500` |  |  |
| `--vt-weight-semibold` | `600` |  |  |
| `--vt-weight-bold` | `700` |  |  |

## type

| CSS 変数 | 値 | 用途 | 根拠 |
|---|---|---|---|
| `--vt-type-headline-small-size` | `24px` | summary | M3 headline-small（24/32）。太さだけ 600 にする |
| `--vt-type-headline-small-line-height` | `1.3333` | summary | M3 headline-small（24/32）。太さだけ 600 にする |
| `--vt-type-headline-small-weight` | `600`（= --vt-weight-semibold） | summary | M3 headline-small（24/32）。太さだけ 600 にする |
| `--vt-type-headline-small-tracking` | `-0.24px` | summary | M3 headline-small（24/32）。太さだけ 600 にする |
| `--vt-type-title-large-size` | `20px` | 工数の数値 | M3 title-large（22/28）より 2px 小さい |
| `--vt-type-title-large-line-height` | `1.4` | 工数の数値 | M3 title-large（22/28）より 2px 小さい |
| `--vt-type-title-large-weight` | `600`（= --vt-weight-semibold） | 工数の数値 | M3 title-large（22/28）より 2px 小さい |
| `--vt-type-title-large-tracking` | `0` | 工数の数値 | M3 title-large（22/28）より 2px 小さい |
| `--vt-type-title-medium-size` | `16px` | status、狭いペインの工数 | M3 title-medium（16/24、0.15px） |
| `--vt-type-title-medium-line-height` | `1.5` | status、狭いペインの工数 | M3 title-medium（16/24、0.15px） |
| `--vt-type-title-medium-weight` | `600`（= --vt-weight-semibold） | status、狭いペインの工数 | M3 title-medium（16/24、0.15px） |
| `--vt-type-title-medium-tracking` | `0.15px` | status、狭いペインの工数 | M3 title-medium（16/24、0.15px） |
| `--vt-type-body-medium-size` | `15px` | 本文 | Obsidian --font-ui-medium（15px） |
| `--vt-type-body-medium-line-height` | `1.5` | 本文 | Obsidian --font-ui-medium（15px） |
| `--vt-type-body-medium-weight` | `400`（= --vt-weight-regular） | 本文 | Obsidian --font-ui-medium（15px） |
| `--vt-type-body-medium-tracking` | `0` | 本文 | Obsidian --font-ui-medium（15px） |
| `--vt-type-body-small-size` | `13px` | 補助の本文 | Obsidian --font-ui-small（13px） |
| `--vt-type-body-small-line-height` | `1.5` | 補助の本文 | Obsidian --font-ui-small（13px） |
| `--vt-type-body-small-weight` | `400`（= --vt-weight-regular） | 補助の本文 | Obsidian --font-ui-small（13px） |
| `--vt-type-body-small-tracking` | `0` | 補助の本文 | Obsidian --font-ui-small（13px） |
| `--vt-type-label-medium-size` | `12px` | バッジ、テキストボタン、時間 | M3 label-medium（12/16、0.5px） |
| `--vt-type-label-medium-line-height` | `1.3333` | バッジ、テキストボタン、時間 | M3 label-medium（12/16、0.5px） |
| `--vt-type-label-medium-weight` | `500`（= --vt-weight-medium） | バッジ、テキストボタン、時間 | M3 label-medium（12/16、0.5px） |
| `--vt-type-label-medium-tracking` | `0.5px` | バッジ、テキストボタン、時間 | M3 label-medium（12/16、0.5px） |
| `--vt-type-label-small-size` | `11px` | 欄の名前（大文字）、曜日、件数、created / updated | M3 label-small（11/16、0.5px） |
| `--vt-type-label-small-line-height` | `1.4545` | 欄の名前（大文字）、曜日、件数、created / updated | M3 label-small（11/16、0.5px） |
| `--vt-type-label-small-weight` | `500`（= --vt-weight-medium） | 欄の名前（大文字）、曜日、件数、created / updated | M3 label-small（11/16、0.5px） |
| `--vt-type-label-small-tracking` | `0.5px` | 欄の名前（大文字）、曜日、件数、created / updated | M3 label-small（11/16、0.5px） |

## duration

| CSS 変数 | 値 | 用途 | 根拠 |
|---|---|---|---|
| `--vt-duration-short2` | `100ms` | 押したときの縮み | M3 duration-short2 |
| `--vt-duration-short3` | `150ms` | ホバーの色・影・不透明度 | M3 duration-short3 |
| `--vt-duration-pulse` | `1400ms` | 記録中の点の点滅の周期（飾り。動きを減らす設定では止める） |  |

## easing

| CSS 変数 | 値 | 用途 | 根拠 |
|---|---|---|---|
| `--vt-easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` |  | M3 easing-standard |

## elevation

| CSS 変数 | 値 | 用途 | 根拠 |
|---|---|---|---|
| `--vt-elevation-1` | `0 1px 2px 0 #0000000f` | 押せるカード |  |
| `--vt-elevation-2` | `0 1px 3px 0 #0000001f` | 編集できるタイルのホバー |  |
| `--vt-elevation-3` | `0 2px 8px 0 #0000001f` | 押せるカードのホバー |  |

## opacity

| CSS 変数 | 値 | 用途 | 根拠 |
|---|---|---|---|
| `--vt-opacity-disabled` | `0.38` | 無効なもの | M3 disabled content opacity |
| `--vt-opacity-state-hover` | `0.08` | currentColor で state layer を作るとき（ホバー） | M3 hover state layer |
| `--vt-opacity-state-press` | `0.12` | currentColor で state layer を作るとき（押下） | M3 pressed state layer |

## scale

| CSS 変数 | 値 | 用途 | 根拠 |
|---|---|---|---|
| `--vt-scale-press-small` | `0.92` | 40px 以下の丸いボタン・日付を押したとき |  |
| `--vt-scale-press-large` | `0.99` | カードを押したとき |  |
