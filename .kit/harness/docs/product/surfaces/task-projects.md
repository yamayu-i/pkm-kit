# Projects

- 種類: View
- 開き方: [Tasks サイドバー](task-sidebar.md)、コマンド「Open Projects」
- 場面: [週の見直し](../jobs/task-review-week.md)、[朝の計画](../jobs/task-plan-day.md)

## 今の振る舞い

- サブを持つ issue（Project）のうち、closed・canceled でないものを 1 ページのタイムラインに並べる。Project の行の下に、そのサブの行が続く
- Project の並びは、親の期限（deadline、なければ soft deadline）の早い順 → 閉じていないサブの end のいちばん早い順 → ID の順
- Project の行には、出しているサブの期間をまとめた棒（読むだけ）と、親の deadline（赤）・soft deadline（黄）の印を出す。題を押すと issue 画面を開く
- サブの行は、issue 画面の Timeline と同じ（棒・Calendar の点・依存の矢印・今日の線）。題を押すと issue のノートを開き、そのサブのカードを上端に出す
- 日付の見出しの下の行「Load」に、列ごと（Day は 1 日、Week は 1 週）の見積もりの合計を時間で出す。使える時間（設定）を超えた列は赤い面になる。見積もりのないサブがかかる列は `?` を付ける（ツールチップに件数）。見積もりのない delegated のサブは他人の作業なので、負荷にも `?` にも数えない（ADR-0247）
- サブに見積もりがなければ、親の estimated の残りを、見積もりのない閉じていないサブ（delegated を除く）で等分して数える。estimated が 0 のサブは見積もり済み
- 見積もりがなく（delegated を除く）、期間が今日から 14 日のうちにかかるサブには、棒の右に「Estimate」の印を出す。見出しにその件数（No estimate N）を出す
- 親に estimated がなく、その「Estimate」の印のサブを持つ Project の行には「Budget」の印を出す。押すと親の estimated の入力欄が開く
- closed・canceled のサブは既定で隠し、見出しの「Show N closed」で出す。目盛りの既定は Week

## 入力と制約

使える時間は端末ごとの設定（平日・土日。既定は 6h・0h）です。負荷は期間を持つ閉じていないサブだけを数え、実績は引きません。依存は同じ Project のサブの間だけ引けます。

## 操作と保存

棒のドラッグ・両端のつまみ・矢印キーで期間を直し、指を離したときに 1 回だけ保存します。棒の右端から別の棒へドラッグして依存を引き、矢印を選んで × か Delete で消します。「Estimate」を押すと S（30m）・M（2h）・L（4h）から選んで、そのサブの estimated に保存します。

## 失敗時と戻し方

Inbox（未整理）の Project のサブは動かせず、理由を出します。Tickler より前に始まる期間も置けません。動かし間違いは棒を戻します。

## 端末の違い

PC はドラッグ・キーボード、スマホは指でドラッグします。狭い画面では題の列を細くし、日の列を横にスクロールします。

## 使う概念

[estimated と実績](../concepts/task-estimate.md)、[deadline と soft deadline](../concepts/task-deadline.md)、[Tickler](../concepts/task-tickler.md)

## 根拠

[ADR-0231](../../../../src/docs/adr/0231-projects-timeline-and-load.md)、[ADR-0143](../../../../src/docs/adr/0143-sub-issue-timeline.md)、[ADR-0210](../../../../src/docs/adr/0210-gtd-list-badge-and-project-rules.md)
