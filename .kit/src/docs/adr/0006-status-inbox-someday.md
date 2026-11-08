# ADR-0006: status の定義、Inbox と Someday

- 状態: 承認（一部置換: 0032）
- 日付: 2026-10-31

## 決定

### status

| 値 | 色 |
|---|---|
| `open` | 緑 |
| `in-progress` | 青 |
| `waiting` | ピンク |
| `delegated` | ピンク |
| `someday` | 薄い水色 |
| `closed` | 紫 |
| `canceled` | グレー |

### Inbox

- status としては持たない。「`open` で、`scheduled`・`mid_due`・`deadline` がどれもないもの」を Inbox と見なす
- 各 View の「Inbox」アクションは、`status: open` にして `scheduled`・`mid_due`・`deadline` をクリアする

### Someday

- 「いつかやるかもしれないが、今は考えたくない」ものは `status: someday` にする
- someday にするとき、`scheduled`・`mid_due`・`deadline` をクリアする
- 任意で `revisit: 日付` を持てる。その日を過ぎたら Organize に再び出てくる
- someday の issue は、Daily / Caution / Dead / Scheduled の各 View と、Issue List の既定の表示から外す

### 期限の色

- mid_due / deadline の背景は、3 日前から 薄い黄色 → 黄色 → オレンジ → 赤（当日）と変わる
- 期限を過ぎたものは赤い枠を残す（グレーにすると一番目立たなくなるため）
- closed / canceled / someday の issue は色を付けない

## 却下した案

- **Inbox を status にする**：「open で予定も期限もない」状態と二重になる
- **`someday: true` を status とは別のフラグにする**：「waiting かつ someday」のような組み合わせが作れてしまい、意味がぼやける
- **`issue/someday/` フォルダに移す**：平らなディレクトリでなくなり、リンクも壊れる
