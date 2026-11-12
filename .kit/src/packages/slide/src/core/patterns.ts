/**
 * パターンの一覧（ADR-0117）。id は deck.html の data-pattern、CSS（src/style/patterns.css）、
 * スキルの patterns/<id>.md と揃える（テストで照合する）
 */
export interface Pattern {
	id: string;
	/** 逆引きの分類 */
	group: string;
	name: string;
	/** 伝えたいこと（逆引きの 1 文） */
	use: string;
	/** この部品がなければ、パターンの取り違えとみなす（CSS セレクタ） */
	requires?: string;
	/** 見出しのまとまりだけで 1 枚にする（本文を置かない） */
	headOnly?: boolean;
	/** 文字の量の目安を当てはめない（話すためではなく、見せる・引くためのもの） */
	dense?: boolean;
	/** 1 つのリストに置ける項目の数（既定は MAX_ITEMS。グラフや格子は、数そのものが図になる） */
	maxItems?: number;
}

export const PATTERNS: readonly Pattern[] = [
	{ id: "cover", group: "構成", name: "表紙", use: "何の話かを 1 行で言い、誰がいつ話すかを示す", headOnly: true },
	{ id: "agenda", group: "構成", name: "道筋", use: "これから話す順を先に見せる。途中で今どこかを示す", requires: ".agenda" },
	{ id: "section", group: "構成", name: "区切り", use: "話が次のまとまりに移ることを知らせる", headOnly: true },
	{ id: "summary", group: "構成", name: "まとめ", use: "持ち帰ってほしいことを最後に言い直す", requires: ".takeaways" },
	{ id: "next-steps", group: "構成", name: "次にすること", use: "誰が何をいつまでにするかを決める", requires: ".actions" },
	{ id: "closing", group: "構成", name: "結び", use: "最後に残す 1 文と連絡先を出す", headOnly: true },
	{ id: "appendix", group: "構成", name: "付録", use: "聞かれたら見せる細かい資料を置く", dense: true },
	{ id: "cover-image", group: "構成", name: "写真の表紙", use: "写真を全面に敷いて、何の話かを印象とともに示す", requires: "figure.bleed" },
	{ id: "profile", group: "構成", name: "人の紹介", use: "話し手やチームの人を、写真・名前・役割で紹介する", requires: "img.avatar" },
	{ id: "assertion-evidence", group: "主張する", name: "主張と根拠", use: "言いたいことを、図・写真・グラフで支える（基本の形）", requires: "figure" },
	{ id: "statement", group: "主張する", name: "一文", use: "1 つの文だけを強く残す", headOnly: true },
	{ id: "big-number", group: "主張する", name: "大きい数字", use: "1 つの数字で驚かせる・納得させる", requires: ".big" },
	{ id: "quote", group: "主張する", name: "引用", use: "誰かの言葉で裏付ける（利用者の声、識者の言葉）", requires: "blockquote" },
	{ id: "image-statement", group: "主張する", name: "写真と一文", use: "全面の写真の上に 1 文を載せて、印象で残す", requires: "figure.bleed" },
	{ id: "two-numbers", group: "主張する", name: "2 つの数字", use: "2 つの数字を並べて差を見せる（前と後、目標と実績）", requires: ".big" },
	{ id: "question", group: "主張する", name: "問い", use: "問いを投げて、聞き手に考えさせる", headOnly: true },
	{ id: "myth-fact", group: "主張する", name: "思い込みと実際", use: "よくある思い込みと、実際を対にして正す", requires: ".pairs" },
	{ id: "comparison", group: "比べる", name: "2 つを並べる", use: "A と B の違いを同じ観点で並べる", requires: ".cols" },
	{ id: "before-after", group: "比べる", name: "前と後", use: "変える前と後で、何が変わるかを見せる", requires: ".cols" },
	{ id: "pros-cons", group: "比べる", name: "良い点と悪い点", use: "1 つの案の良い点と悪い点を並べる", requires: ".cols" },
	{ id: "decision-table", group: "比べる", name: "選択肢の表", use: "3 つ以上の案を同じ評価軸で比べ、選んだ案を示す", requires: "table", dense: true },
	{ id: "matrix-2x2", group: "比べる", name: "2 軸の 4 象限", use: "2 つの軸で分類し、どこに当たるかを見せる", requires: ".matrix" },
	{ id: "options", group: "比べる", name: "案の並び", use: "2〜3 つの案を同じ形で並べ、勧める 1 つを示す", requires: ".card.pick" },
	{ id: "spectrum", group: "比べる", name: "1 本の軸", use: "2 つの極の間のどこに当たるかを、1 本の軸で見せる", requires: ".spectrum" },
	{ id: "venn", group: "比べる", name: "重なり", use: "2〜3 つの重なりと、その真ん中を見せる", requires: ".venn" },
	{ id: "cards", group: "構造を見せる", name: "並ぶ要素", use: "同じ重さの 2〜4 個の要素（柱、理由、特長）を並べる", requires: ".cols" },
	{ id: "layers", group: "構造を見せる", name: "層", use: "上下に重なる層（構成、抽象度）を見せる", requires: ".layers" },
	{ id: "tree", group: "構造を見せる", name: "木", use: "全体を部分に分ける（内訳、組織、論点の分解）", requires: ".tree" },
	{ id: "definition", group: "構造を見せる", name: "定義", use: "言葉の意味を決め、例と例でないものを示す", requires: "dl" },
	{ id: "split-image", group: "構造を見せる", name: "写真と文の左右", use: "写真と文を左右半分ずつに置く", requires: "figure.left, figure.right" },
	{ id: "grid", group: "構造を見せる", name: "格子", use: "5〜9 個の小さな要素を格子に並べ、全体を見渡させる", requires: ".grid", maxItems: 9 },
	{ id: "hub", group: "構造を見せる", name: "中心と周り", use: "中心の 1 つと、それを囲む 2〜6 つの関係を見せる", requires: ".hub", maxItems: 6 },
	{ id: "pyramid", group: "構造を見せる", name: "積み上げ", use: "土台から頂点へ積み上がる段（優先度、成熟度）を見せる", requires: ".pyramid" },
	{ id: "process", group: "流れを見せる", name: "手順", use: "順に進む 2〜4 の手順を見せる", requires: ".steps" },
	{ id: "timeline", group: "流れを見せる", name: "年表・予定", use: "いつ何が起きるか（経緯、ロードマップ）を見せる", requires: ".timeline" },
	{ id: "cycle", group: "流れを見せる", name: "循環", use: "回り続ける 4 つの段階を見せる", requires: ".cycle" },
	{ id: "funnel", group: "流れを見せる", name: "絞り込み", use: "段階ごとに減っていく量を見せる", requires: ".funnel" },
	{ id: "roadmap", group: "流れを見せる", name: "ロードマップ", use: "期間 × 流れ（チーム・テーマ）の上に、いつ何をするかを置く", requires: ".roadmap", maxItems: 8 },
	{ id: "journey", group: "流れを見せる", name: "体験の旅", use: "利用者の段階ごとの行動と、気持ちの上下を見せる", requires: ".journey", maxItems: 6 },
	{ id: "flow", group: "流れを見せる", name: "分かれ道", use: "はい / いいえで分かれる判断の流れを見せる", requires: ".flow" },
	{ id: "chart-bar", group: "データを見せる", name: "棒グラフ", use: "項目どうしの量を比べ、1 つを目立たせる", requires: ".bars" },
	{ id: "chart-line", group: "データを見せる", name: "折れ線グラフ", use: "時間に沿った変化と、その転換点を見せる", requires: "svg" },
	{ id: "chart-share", group: "データを見せる", name: "内訳", use: "全体に占める割合を見せる", requires: ".share" },
	{ id: "table", group: "データを見せる", name: "表", use: "正確な値を、行と列で引けるようにする", requires: "table", dense: true },
	{ id: "kpi", group: "データを見せる", name: "指標", use: "2〜4 個の指標の今の値と変化を見せる", requires: ".kpi" },
	{ id: "chart-column", group: "データを見せる", name: "縦棒グラフ", use: "期間ごとの量の移り変わりを縦棒で見せ、1 本を目立たせる", requires: ".columns", maxItems: 12 },
	{ id: "progress", group: "データを見せる", name: "進み具合", use: "目標に対する進み具合を、項目ごとに見せる", requires: ".progress" },
	{ id: "chart-waterfall", group: "データを見せる", name: "増減の内訳", use: "始まりから終わりまでの増減を、段ごとに分けて見せる", requires: ".waterfall", maxItems: 8 },
	{ id: "heatmap", group: "データを見せる", name: "濃淡の表", use: "2 つの軸の交わりの多い少ないを、濃淡で見せる", requires: "table.heat", dense: true },
	{ id: "image", group: "物を見せる", name: "写真", use: "実物・現場・雰囲気を写真で見せる", requires: "img" },
	{ id: "screenshot", group: "物を見せる", name: "画面", use: "画面のどこを見るかを指して説明する", requires: "img" },
	{ id: "code", group: "物を見せる", name: "コード", use: "短いコードの、見てほしい行を示す", requires: "pre", dense: true },
	{ id: "diagram", group: "物を見せる", name: "図", use: "仕組み・構成・関係を図で見せる", requires: "figure" },
	{ id: "gallery", group: "物を見せる", name: "写真の並び", use: "2〜6 枚の写真を並べて見せる", requires: ".gallery", maxItems: 6 },
	{ id: "screenshot-compare", group: "物を見せる", name: "画面の前と後", use: "変える前と後の画面を並べる", requires: ".cols figure" },
	{ id: "problem-solution", group: "話の型", name: "課題と解決", use: "困っていることと、その解き方を対にする", requires: ".cols" },
	{ id: "risks", group: "話の型", name: "リスクと対策", use: "起こりうることと備えを対にし、大きさを示す", requires: ".risks" },
	{ id: "ask", group: "話の型", name: "お願い", use: "聞き手に決めてほしいこと・してほしいことを、期限とともに示す", requires: ".asks" },
	{ id: "retro", group: "話の型", name: "振り返り", use: "続けること・困ったこと・次に試すことを並べる", requires: ".retro" },
	{ id: "scr", group: "話の型", name: "状況・問題・解決", use: "状況・問題・解決の 3 段で、話の全体を 1 枚で見せる", requires: ".cols.arrow" },
	{ id: "faq", group: "話の型", name: "よくある問い", use: "よく聞かれる問いと答えを 2〜4 組並べる", requires: ".faq" },
];

export const PATTERN_IDS: ReadonlySet<string> = new Set(PATTERNS.map((p) => p.id));

export function findPattern(id: string): Pattern | undefined {
	return PATTERNS.find((p) => p.id === id);
}
