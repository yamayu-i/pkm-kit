# 根拠

このスキルの規則の根拠。各ファイルは `E1` などの ID でここを指す。調査の経緯と判断は [ADR-0013](../../../.kit/harness/docs/adr/0013-output-by-reader-and-stage.md) にある。

確かめ方の列は、根拠の強さを表す。

- 原本: 本文を読んだ
- 要約: 検索結果の要約だけを読んだ。本文は読んでいない
- 既知: 広く知られた文献で、今回は本文を確かめていない

規則を足す・変えるときは、ここに根拠を足し、ID で引く。記録の集計（[記録](recording.md)）から分かったことも、根拠として足してよい。

| ID | 出典 | 使っている知見 | 確かめ方 | 使っている所 |
|---|---|---|---|---|
| E1 | [stop-slop](https://github.com/hardikpandya/stop-slop) | 決まり文句・前置き・演出を削る規則と、5 つの観点の採点。英語向けの規則（em dash など）を含む | 原本 | 文体 |
| E2 | [writing-clearly-and-concisely](https://github.com/softaworks/agent-toolkit)、Wikipedia の「Signs of AI writing」 | Strunk の規則と、AI らしい言い回し（誇張、空の「-ing」句、宣伝の形容詞）の一覧 | 原本（Wikipedia は要約） | 文体 |
| E3 | [concise-output](https://github.com/NTCoding/claude-skillz) | 読み手の能力を信頼する。短くするもの（README、状況報告）と詳しくするもの（障害の分析、トレードオフ）を分ける | 原本 | 段階 1・4・5、文体 |
| E4 | 結論を先に書く・判断に使える要約（[実務の指針](https://www.userintuition.ai/reference-guides/consumer-insights-report-structure-what-executives-read/)） | 要約は単独で判断に使えるようにし、詳細は後ろか付録に置く | 要約 | 段階 2・3、読み手（両方） |
| E5 | 段階的な開示の利用者調査（[IUI 2026](https://aianik.github.io/project-iui2026.html)） | 詳細 ＋ 段階的な開示は、要約だけと同じくらいの認知負荷で、最もよい成果。情報を減らさず、届け方を変えたことが効いた | 要約 | 段階 3・4、段階の選び方、読み手（両方） |
| E6 | [Chain of Density](https://arxiv.org/abs/2309.04269) | 長さを固定して要素を足すと、人が書いた要約に近い密度が好まれ、詰めすぎると読みにくくなる | 要約 | 段階 2 |
| E7 | 欠落の検出（[MED-OMIT](https://huggingface.co/papers/2311.08303)、[CARE](https://arxiv.org/html/2606.08969)） | 元の資料から事実を抜き出し、要約に残っているかを突き合わせる。欠落は出力に跡が残らず、誤りより見つけにくい | 要約 | 棚卸しと突き合わせ、段階 2・4 |
| E8 | Anthropic の [doc-coauthoring](https://github.com/anthropics/skills) | 文脈を持たない別のインスタンスが、読み手の質問に答えられるかで仕上がりを確かめる。どの文も要るかを見る。詳細は付録に置く | 原本 | 段階 3、読み手（LLM だけ） |
| E9 | Anthropic の[プロンプトの手引き](https://platform.claude.com/en/docs/build-with-claude/prompt-engineering/claude-prompting-best-practices) | 最近のモデルは既定の応答が長めで、簡潔さは明示して指示する。禁止より「こう書く」で指示する。並列でない内容を箇条書きにしない。道具を使った作業の後は短い要約を求める | 要約 | 段階 1・2、文体 |
| E10 | OpenAI の [verbosity パラメータ](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_new_params_and_tools) | 長さを、プロンプトの内容とは別のつまみで制御する | 要約 | 段階の選び方（段階を、内容とは別のつまみとして扱う） |
| E11 | [YapBench](https://arxiv.org/abs/2601.00624)、LLM の判定の長さの偏り | 短くてよい問いへの余計な長さは、得るものなく費用を生む。LLM の判定は長い答えを好む | 要約 | 段階 1、段階の選び方、文体 |
| E12 | Anthropic の [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 望む結果を得るのに足りる、最小の情報量の多いトークンを渡す。トークンが増えるほど注意の予算が減る | 要約 | 読み手（LLM だけ） |
| E13 | Chroma の [Context Rot](https://research.trychroma.com/context-rot) | 入力が長くなるほど、モデルの性能は不安定になる | 要約 | 読み手（LLM だけ） |
| E14 | Cowan (2001) [The magical number 4 in short-term memory](https://pubmed.ncbi.nlm.nih.gov/11515286/) | 人が一度に頭に置けるのは 3〜5 個ほど | 要約 | 段階 2 |
| E15 | [Diátaxis の参照](https://diataxis.fr/reference/) | 参照用の文書は中立に、簡潔に書き、対象の構造に合わせ、一貫した形にする。読まれるのではなく引かれる | 要約 | 段階 5、読み手（両方） |
| E16 | Nielsen Norman Group の [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) と [Inverted Pyramid](https://www.nngroup.com/articles/inverted-pyramid/) | 最も大事なことを先頭に置き、詳細は求められたときに出す | 既知 | 段階 1・3・5、段階の選び方 |
| E17 | Minto『The Pyramid Principle』 | 結論を先に置き、それを支える理由を下にまとめて並べる | 既知 | 段階 2・3 |
