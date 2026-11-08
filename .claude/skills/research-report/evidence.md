# 根拠

型の規則の根拠。各ファイルは `R1` などの ID でここを指す。内容の取捨と文体の根拠は、write-for-reader の [根拠](../write-for-reader/evidence.md)（`E1` など）にあり、型のファイルからも引いてよい。経緯と判断は [ADR-0092](../../../.kit/harness/docs/adr/0092-research-report-types.md)。

確かめ方は write-for-reader と同じ（原本・要約・既知）。ここにあるものは今のところすべて「既知」で、本文を今回は確かめていない。使いながら、原本を確かめたものと記録の集計から分かったことを足す。

| ID | 出典 | 使っている知見 | 確かめ方 | 使っている所 |
|---|---|---|---|---|
| R1 | [MADR](https://adr.github.io/madr/)（Markdown Architectural Decision Records） | 決定の要因（decision drivers）を先に挙げ、検討した選択肢を同じ要因で比べ、選んだ理由と結果を書く | 既知 | tech-selection、migration |
| R2 | NASA の Technology Readiness Level | 技術がどこまで実証されたか（机上・試作・実環境）を段階で表す。「できるはず」と「確かめた」を分ける | 既知 | feasibility |
| R3 | Simon Brown の [C4 model](https://c4model.com/) | 構成を、文脈・コンテナ・コンポーネント・コードの粒度に分け、1 枚の図に 1 つの粒度を描く | 既知 | codebase-map |
| R4 | Google の『Site Reliability Engineering』の Postmortem Culture | 影響、時系列、根本原因、引き金、対応を分け、責める言葉を使わずに書く | 既知 | root-cause |
| R5 | Bohner と Arnold の『Software Change Impact Analysis』（1996） | 変更の起点から依存をたどって影響する集合を出し、その推定の範囲と方法を示す | 既知 | impact-analysis |
| R6 | [PRISMA](https://www.prisma-statement.org/)（系統的レビューの報告の指針） | 調べた情報源・期間・検索の条件・含めた基準と除いた基準を書き、何件を見て何件を残したかを示す | 既知 | landscape、audit |
| R7 | [Semantic Versioning](https://semver.org/) と [Keep a Changelog](https://keepachangelog.com/) | 互換性を壊す変更・追加・修正・非推奨を分けて書く | 既知 | migration |
| R8 | FIRST の [CVSS](https://www.first.org/cvss/) | 重さを、悪用のしやすさと影響の大きさから、決まった基準で付ける | 既知 | audit |
| R9 | Brendan Gregg の [USE Method](https://www.brendangregg.com/usemethod.html) | 資源ごとに使用率・飽和・エラーを測ってから、ボトルネックを決める | 既知 | performance-cost |
| R10 | [Diátaxis の説明](https://diataxis.fr/explanation/) | 説明の文書は、理解を目的にし、背景・理由・別の見方・関連を扱う。手順と参照を混ぜない | 既知 | concept |
| R11 | ISO 24495-1（平易な言葉）、[plainlanguage.gov](https://www.plainlanguage.gov/) | 読み手が誰で何を知りたいかから書き、読み手の言葉と単位を使い、専門用語を減らす | 既知 | 語彙の層 |
| R12 | Anthropic の [How we built our multi-agent research system](https://www.anthropic.com/engineering/built-multi-agent-research-system) | サブエージェントへの依頼には、目的・出力の形・使う道具と情報源・作業の境界を明示する。曖昧な依頼は重複と抜けを生む | 既知 | handoff |
| R13 | 米軍の文書作成の BLUF（Bottom Line Up Front） | 答えを最初の文に置き、根拠をその後に置く | 既知 | fact-check |
