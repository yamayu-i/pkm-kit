## 変更の要約

- Organize に出すのを、Inbox と revisit を迎えた Someday だけにした。revisit のない Someday、revisit が先の Someday は出さない。サイドバーの Organize の件数も同じ（ADR-0212）
- Organize で revisit を迎えた Someday に「To Someday」を選ぶと、revisit を消す（今までは残り、開くたびにまた出てきた）
- Someday の一覧に「Reviewed」を足した（選んだものの reviewed を今日にするだけ）。週次レビューで、reviewed が古い順に見直す場にする。「Review in Organize」のボタンはなくした
- task-coach の週次の手順に、Someday の見直しを足した
- 子への影響: 移行なし（frontmatter と md の形は変えない）。revisit のない Someday は Organize に出なくなるので、Someday の一覧か task-coach の週次で見直す
