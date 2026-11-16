## 変更の要約

- pkm-task: issue のプリセット（サブイシューの題の一覧と本文のひとまとめ）を足した。1 件を `preset/p-N.md` の md で持つ（type `preset`。ADR-0186）
- pkm-task: プリセットの一覧の View「Presets」を足した。左サイドバーの Labels の下と、コマンド「Open Presets」から開き、「Create preset」で作る
- pkm-task: `preset/*.md` を開くと、issue と同じくページの上に画面を差し込む。名前とサブの題をそこで直し、本文はふつうのエディタで書く
- pkm-task: issue 画面の「Sub-issues」の見出しの右に「Apply preset」を足した。プリセットを選ぶと、そのサブが末尾に追加され、プリセットの本文が既存の本文の末尾に追記される
- テンプレートの既定に `preset.md` を足した（テンプレートの一覧には出さない）。`node .kit/bin/lint.mjs .` が preset の書けない題・本文も検査する

子への影響: 移行なし。`preset/` は最初のプリセットを作ったときにできる。モバイルでは、プリセットの画面の題の入力欄と、Apply preset のメニューが押しやすいかを確かめる
