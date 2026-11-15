# 2026-11-15 Pick と Issue のタイマー

## 訂正

- 起きたこと: Pick と再生の大きさが違い、Issue 側の操作が見当たらないと指摘された。Pick は 24px の汎用アイコンボタンで、再生は 36px。Issue だけ isActive によって Someday も除外し、サブの表示条件と違っていた。
- 改善: Pick と再生で同じボタンの部品を使い、表示の判断も共通にした。未 Pick・Pick 済み・記録中・Someday・closed の Issue を表示検査に含めた。
