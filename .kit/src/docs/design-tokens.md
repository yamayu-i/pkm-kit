# デザイントークン一覧

<!-- 生成物。手で編集しない。正本は .kit/src/packages/design/tokens.json（pnpm --filter design build で作り直す） -->

ルールは [design.md](design.md)。ここは値の一覧で、`tokens.json` から生成している。
コントラスト比は、そのトークンに書いた面（`contrast.on`）の中で一番低いもの。半透明の面は下の面に重ねて測る（WCAG 2.2 の相対輝度）。

## 色

「Vault」の列: ○ は子の Vault が `.kit-local/theme.json` で上書きできる色、「追従」は上書きした元の色に合わせて変わる色（ADR-0121）。「から作る」は、子が元の色を変えてこの色を書かなかったときに、元の色から作る色（ADR-0129）。

| CSS 変数 | 役割 | Vault | ライト | ダーク | 基準 | 最低の比（ライト / ダーク） | 用途 | 根拠 |
|---|---|---|---|---|---|---|---|---|
| `--vt-surface` | 面 | ○ | `#f6f5f2` | `#1e1e1e` | — | — | 基本の面。Obsidian のエディタの背景と同じにする Obsidian: `--background-primary` | 目に優しくするため純白を避け、ごくわずかに暖かい白にする（ADR-0019） |
| `--vt-surface-container` | 面 | ○ | `#efeeea` | `#242424` | — | — | カードの面（surface より一段濃い） Obsidian: `--background-secondary` | M3 surface-container |
| `--vt-surface-container-high` | 面 | ○ | `#e8e7e2` | `#2b2b2b` | — | — | 一段強い面（日付ブロック、関係のチップ、件数、ノートのコード）（surface-container より一段濃い） Obsidian: `--code-background` | M3 surface-container-high。ノートのコードは、Obsidian の既定のままだと本文の面とほぼ同じ色（ライトでは本文より明るい）になるので、この面に固定する |
| `--vt-on-surface` | 文字 | ○ | `#2b2a28` | `#d0d0d0` | 7:1 | 10.06 / 7.39 | 本文の文字 Obsidian: `--text-normal` | M3 on-surface（標準のコントラストで 7:1） |
| `--vt-on-surface-variant` | 文字 | ○ | `#57564f` | `#b3b3b3` | 4.5:1 | 5.17 / 5.44 | 補助の文字、ラベル、アイコン、未入力の表示 Obsidian: `--text-muted` | M3 on-surface-variant |
| `--vt-outline` | 印 | ○ | `#7f7e76` | `#7a7a7a` | 3:1 | 3.29 / 3.29 | 編集できるものの枠線 | M3 outline（3:1） |
| `--vt-outline-variant` | 飾り | 追従（--vt-on-surface） | `#2b2a2824` | `#d0d0d024` | — | — | カード・リスト・区切り線の枠（飾り。面の違いでも見分けられる） | M3 outline-variant |
| `--vt-state-hover` | 状態 | 追従（--vt-on-surface） | `#2b2a2814` | `#d0d0d014` | — | — | ホバーで重ねる色（on-surface の 8%） | M3 hover state layer 0.08 |
| `--vt-state-press` | 状態 | 追従（--vt-on-surface） | `#2b2a281f` | `#d0d0d01f` | — | — | 押したときに重ねる色（on-surface の 12%） | M3 pressed state layer 0.12 |
| `--vt-primary` | 文字 | ○ | `#6750a4` | `#d0bcff` | 4.5:1 | 4.52 / 6.69 | アクセント（今のページ、テキストボタン、リンク） Obsidian: `--interactive-accent` `--text-accent` `--color-accent` | M3 baseline primary |
| `--vt-on-primary` | 文字 | ○（書かなければ --vt-primary から作る） | `#ffffff` | `#381e72` | 4.5:1 | 5.37 / 6.78 | primary の上の文字 Obsidian: `--text-on-accent` | M3 baseline on-primary |
| `--vt-primary-state-hover` | 状態 | 追従（--vt-primary） | `#6750a414` | `#d0bcff14` | — | — | テキストボタンのホバー（primary の 8%） | M3 hover state layer 0.08 |
| `--vt-on-primary-state-hover` | 状態 | 追従（--vt-on-primary） | `#ffffff14` | `#381e7214` | — | — | filled ボタンのホバー（on-primary の 8% を primary に重ねる） | M3 hover state layer 0.08 |
| `--vt-secondary-container` | 面 | ○（書かなければ --vt-primary から作る） | `#e8def8` | `#3d3749` | — | — | 選んでいるものの面（選んだ行、on の絞り込みチップ、今の段階、カードを落とせるグループ） | M3 baseline secondary-container。ダークは M3 の #4a4458 では文字が 7:1 に届かないので暗くした |
| `--vt-on-secondary-container` | 文字 | ○（書かなければ --vt-primary から作る） | `#1d192b` | `#e8def8` | 4.5:1 | 11.52 / 7.34 | secondary-container の上の文字 | M3 baseline on-secondary-container |
| `--vt-error` | 文字 | — | `#b3261e` | `#f2b8b5` | 4.5:1 | 5.27 / 8.29 | エラーの文字、削除ボタン Obsidian: `--text-error` | M3 baseline error |
| `--vt-focus-ring` | 印 | 追従（--vt-primary） | `#6750a4`（= --vt-primary） | `#d0bcff`（= --vt-primary） | 3:1 | 5.20 / 8.30 | キーボードで選んだときの枠 |  |
| `--vt-text-faint` | 文字 | ○ | `#696860` | `#949494` | 4.5:1 | 4.52 / 4.66 | Obsidian 本体の薄い文字。プラグインでは使わない（標準の値は 4.5:1 に届かないので上げる） （プラグインでは使わない） Obsidian: `--text-faint` | WCAG 1.4.3。ノートのコードの面（surface-container-high）にも載るので、ダークはその面で 4.5:1 になるまで上げる |
| `--vt-green-container` | 面 | — | `#c4eed0` | `#0f5223` | — | — | green の面（open、実行日、記録中の worklog） |  |
| `--vt-on-green-container` | 文字 | — | `#072711` | `#c4eed0` | 4.5:1 | 10.96 / 6.27 | green の面の上の文字 |  |
| `--vt-green` | 印 | — | `#1e8e3e` | `#6dd58c` | 3:1 | 3.30 / 5.12 | green の印（点・アイコン・枠） |  |
| `--vt-blue-container` | 面 | — | `#d3e3fd` | `#0842a0` | — | — | blue の面（in-progress、worklog の作業時間） |  |
| `--vt-on-blue-container` | 文字 | — | `#041e49` | `#d3e3fd` | 4.5:1 | 10.93 / 6.13 | blue の面の上の文字 |  |
| `--vt-blue` | 印 | — | `#0b57d0` | `#a8c7fa` | 3:1 | 4.91 / 5.31 | blue の印（点・アイコン・枠） |  |
| `--vt-purple-container` | 面 | — | `#eaddff` | `#4f378b` | — | — | purple の面（closed） |  |
| `--vt-on-purple-container` | 文字 | — | `#21005d` | `#eaddff` | 4.5:1 | 11.58 / 6.18 | purple の面の上の文字 |  |
| `--vt-purple` | 印 | — | `#6750a4` | `#d0bcff` | 3:1 | 4.99 / 5.47 | purple の印（点・アイコン・枠） |  |
| `--vt-gray-container` | 面 | — | `#e3e3e3` | `#444746` | — | — | gray の面（canceled、priority の chore） |  |
| `--vt-on-gray-container` | 文字 | — | `#1f1f1f` | `#e3e3e3` | 4.5:1 | 11.17 / 6.17 | gray の面の上の文字 |  |
| `--vt-gray` | 印 | — | `#747775` | `#c4c7c5` | 3:1 | 3.52 / 5.51 | gray の印（点・アイコン・枠） |  |
| `--vt-sky-container` | 面 | — | `#c2e7ff` | `#004a77` | — | — | sky の面（someday、priority の low） |  |
| `--vt-on-sky-container` | 文字 | — | `#001d35` | `#c2e7ff` | 4.5:1 | 11.46 / 6.20 | sky の面の上の文字 |  |
| `--vt-sky` | 印 | — | `#00639b` | `#7fcfff` | 3:1 | 4.96 / 5.46 | sky の印（点・アイコン・枠） |  |
| `--vt-pink-container` | 面 | — | `#ffd8e4` | `#8c1d4f` | — | — | pink の面（waiting、delegated） |  |
| `--vt-on-pink-container` | 文字 | — | `#3e001d` | `#ffd8e4` | 4.5:1 | 11.52 / 5.99 | pink の面の上の文字 |  |
| `--vt-pink` | 印 | — | `#c2185b` | `#ffb0c8` | 3:1 | 4.52 / 5.11 | pink の印（点・アイコン・枠） |  |
| `--vt-red-container` | 面 | — | `#f9dedc` | `#8c1d18` | — | — | red の面（priority の high、deadline の枠、期限切れ） |  |
| `--vt-on-red-container` | 文字 | — | `#410e0b` | `#f9dedc` | 4.5:1 | 11.11 / 6.38 | red の面の上の文字 |  |
| `--vt-red` | 印 | — | `#d93025` | `#f2b8b5` | 3:1 | 3.75 / 5.33 | red の印（点・アイコン・枠） |  |
| `--vt-amber-container` | 面 | — | `#ffecb3` | `#5c4300` | — | — | amber の面（priority の mid、soft_deadline の枠） |  |
| `--vt-on-amber-container` | 文字 | — | `#3a2a00` | `#ffecb3` | 4.5:1 | 10.28 / 6.74 | amber の面の上の文字 |  |
| `--vt-amber` | 印 | — | `#b06d00` | `#ffd54f` | 3:1 | 3.36 / 6.59 | amber の印（点・アイコン・枠） |  |
| `--vt-scheduled` | 面 | — | `#188038` | `#2e7d32` | — | — | 実行日の面 |  |
| `--vt-scheduled-hover` | 面 | — | `#137333` | `#296e2c` | — | — | 実行日のホバー |  |
| `--vt-on-scheduled` | 文字 | — | `#ffffff` | `#ffffff` | 4.5:1 | 5.01 / 5.12 | 実行日の文字 |  |
| `--vt-due-3` | 面 | — | `#fff8e1` | `#4a3f14` | — | — | 期限の 3 日前 |  |
| `--vt-due-2` | 面 | — | `#ffe082` | `#6b5300` | — | — | 期限の 2 日前 |  |
| `--vt-due-1` | 面 | — | `#ffb74d` | `#8a4b00` | — | — | 期限の前日 |  |
| `--vt-on-due` | 文字 | — | `#3a2a00` | `#fff3d6` | 4.5:1 | 7.04 / 5.44 | 期限（3〜1 日前）の文字 |  |
| `--vt-due-0` | 面 | — | `#d93025` | `#b3261e` | — | — | 期限の当日 |  |
| `--vt-on-due-0` | 文字 | — | `#ffffff` | `#ffffff` | 4.5:1 | 4.77 / 6.02 | 期限の当日の文字 |  |
| `--vt-on-label` | 文字 | — | `#1f1f1f` | `#1f1f1f` | 4.5:1 | — / — | label の文字。面はユーザーが labels.json に書いた色なので、task:lint で 4.5:1 以上かを調べる |  |

## radius

| CSS 変数 | 値 | 用途 | 根拠 |
|---|---|---|---|
| `--vt-radius-xs` | `4px` | リンクのホバー | M3 corner-extra-small |
| `--vt-radius-s` | `8px` | チップ、入力欄、小さいボタン | M3 corner-small |
| `--vt-radius-m` | `12px` | 日付の枠、期限、worklog のカード | M3 corner-medium |
| `--vt-radius-l` | `16px` | セクションのカード、工数のタイル | M3 corner-large |
| `--vt-radius-xl` | `28px` | Organize のカード | M3 corner-extra-large |
| `--vt-radius-full` | `9999px` | status、ID、丸いボタン | M3 corner-full |

## space

| CSS 変数 | 値 | 用途 | 根拠 |
|---|---|---|---|
| `--vt-space-2` | `2px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけ、64 / 96px は大きい領域（Organize のスワイプの余白）だけに使う |  |
| `--vt-space-4` | `4px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけ、64 / 96px は大きい領域（Organize のスワイプの余白）だけに使う |  |
| `--vt-space-8` | `8px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけ、64 / 96px は大きい領域（Organize のスワイプの余白）だけに使う |  |
| `--vt-space-12` | `12px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけ、64 / 96px は大きい領域（Organize のスワイプの余白）だけに使う |  |
| `--vt-space-16` | `16px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけ、64 / 96px は大きい領域（Organize のスワイプの余白）だけに使う |  |
| `--vt-space-20` | `20px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけ、64 / 96px は大きい領域（Organize のスワイプの余白）だけに使う |  |
| `--vt-space-24` | `24px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけ、64 / 96px は大きい領域（Organize のスワイプの余白）だけに使う |  |
| `--vt-space-32` | `32px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけ、64 / 96px は大きい領域（Organize のスワイプの余白）だけに使う |  |
| `--vt-space-40` | `40px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけ、64 / 96px は大きい領域（Organize のスワイプの余白）だけに使う |  |
| `--vt-space-48` | `48px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけ、64 / 96px は大きい領域（Organize のスワイプの余白）だけに使う |  |
| `--vt-space-64` | `64px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけ、64 / 96px は大きい領域（Organize のスワイプの余白）だけに使う |  |
| `--vt-space-96` | `96px` | 余白（padding / margin / gap / 位置）に使える値。4px 刻み。2px は細かい位置合わせだけ、64 / 96px は大きい領域（Organize のスワイプの余白）だけに使う |  |

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
| `--vt-breakpoint-pane-medium` | `720px` | これ以下で一覧の補助の列を隠し、ボードのグループを縦に積む |  |

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
| `--vt-duration-short4` | `200ms` | 大きいものの移動（Organize のカードが戻る） | M3 duration-short4 |
| `--vt-duration-pulse` | `1400ms` | 記録中の点の点滅の周期（飾り。動きを減らす設定では止める） |  |
| `--vt-duration-spin` | `4200ms` | in-progress のアイコンの中の半円が 1 周する時間（飾り。目が疲れないようにゆっくり。動きを減らす設定では止める。ADR-0031） |  |

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
| `--vt-elevation-4` | `0 4px 16px 0 #00000029` | 浮いている操作バー |  |
| `--vt-elevation-5` | `0 6px 24px 0 #00000024` | Organize のカード（持ち上げて動かすもの） |  |

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
| `--vt-scale-press-medium` | `0.97` | ボタンを押したとき |  |
| `--vt-scale-press-large` | `0.99` | カードを押したとき |  |
