# Routines

- 種類: View
- 開き方: [Tasks サイドバー](task-sidebar.md)、コマンド
- 場面: [朝の計画](../jobs/task-plan-day.md)

## 今の振る舞い

- routine の一覧と作成のフォーム（summary、くり返し、estimated）。estimated は単位付きで入れられる。ほかの項目は routine 画面で入れる
- 一時停止（active）を切り替えられる。行を押すと [routine 画面](task-routine-screen.md) を開く

## 使う概念

[routine](../concepts/task-routine.md)

## 根拠

[ADR-0010](../../../../src/docs/adr/0010-routine.md)、[ADR-0034](../../../../src/docs/adr/0034-duration-input-auto-board-sticky-groups.md)

## 入力と制約

作成時は summary・繰り返し・任意の estimated を入力します。時間は 30m・1h30m のように入れます。

## 操作と保存

作成は routine ノートを増やし、有効／無効は active を変更します。繰り返しの実績は当日の board に残り、無効化しても履歴は消しません。

## 失敗時と戻し方

作成後に見えない場合は通知とファイル一覧を確認します。意図しない予定は繰り返し条件や開始・終了日を開いて直し、一時的には active を無効にします。

## 端末の違い

PC は行・ボタン・キーボード、スマホはタップで開きます。スマホの画面では一覧とノートを同時に並べません。
