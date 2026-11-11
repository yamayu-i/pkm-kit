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
}

export const PATTERNS: readonly Pattern[] = [
	{ id: "cover", group: "構成", name: "表紙", use: "何の話かを 1 行で言い、誰がいつ話すかを示す", headOnly: true },
	{ id: "agenda", group: "構成", name: "道筋", use: "これから話す順を先に見せる。途中で今どこかを示す", requires: ".agenda" },
	{ id: "section", group: "構成", name: "区切り", use: "話が次のまとまりに移ることを知らせる", headOnly: true },
	{ id: "summary", group: "構成", name: "まとめ", use: "持ち帰ってほしいことを最後に言い直す", requires: ".takeaways" },
	{ id: "next-steps", group: "構成", name: "次にすること", use: "誰が何をいつまでにするかを決める", requires: ".actions" },
	{ id: "closing", group: "構成", name: "結び", use: "最後に残す 1 文と連絡先を出す", headOnly: true },
	{ id: "appendix", group: "構成", name: "付録", use: "聞かれたら見せる細かい資料を置く", dense: true },
	{ id: "assertion-evidence", group: "主張する", name: "主張と根拠", use: "言いたいことを、図・写真・グラフで支える（基本の形）", requires: "figure" },
	{ id: "statement", group: "主張する", name: "一文", use: "1 つの文だけを強く残す", headOnly: true },
	{ id: "big-number", group: "主張する", name: "大きい数字", use: "1 つの数字で驚かせる・納得させる", requires: ".big" },
	{ id: "quote", group: "主張する", name: "引用", use: "誰かの言葉で裏付ける（利用者の声、識者の言葉）", requires: "blockquote" },
	{ id: "comparison", group: "比べる", name: "2 つを並べる", use: "A と B の違いを同じ観点で並べる", requires: ".cols" },
	{ id: "before-after", group: "比べる", name: "前と後", use: "変える前と後で、何が変わるかを見せる", requires: ".cols" },
	{ id: "pros-cons", group: "比べる", name: "良い点と悪い点", use: "1 つの案の良い点と悪い点を並べる", requires: ".cols" },
	{ id: "decision-table", group: "比べる", name: "選択肢の表", use: "3 つ以上の案を同じ評価軸で比べ、選んだ案を示す", requires: "table", dense: true },
	{ id: "matrix-2x2", group: "比べる", name: "2 軸の 4 象限", use: "2 つの軸で分類し、どこに当たるかを見せる", requires: ".matrix" },
	{ id: "cards", group: "構造を見せる", name: "並ぶ要素", use: "同じ重さの 2〜4 個の要素（柱、理由、特長）を並べる", requires: ".cols" },
	{ id: "layers", group: "構造を見せる", name: "層", use: "上下に重なる層（構成、抽象度）を見せる", requires: ".layers" },
	{ id: "tree", group: "構造を見せる", name: "木", use: "全体を部分に分ける（内訳、組織、論点の分解）", requires: ".tree" },
	{ id: "definition", group: "構造を見せる", name: "定義", use: "言葉の意味を決め、例と例でないものを示す", requires: "dl" },
	{ id: "process", group: "流れを見せる", name: "手順", use: "順に進む 2〜4 の手順を見せる", requires: ".steps" },
	{ id: "timeline", group: "流れを見せる", name: "年表・予定", use: "いつ何が起きるか（経緯、ロードマップ）を見せる", requires: ".timeline" },
	{ id: "cycle", group: "流れを見せる", name: "循環", use: "回り続ける 4 つの段階を見せる", requires: ".cycle" },
	{ id: "funnel", group: "流れを見せる", name: "絞り込み", use: "段階ごとに減っていく量を見せる", requires: ".funnel" },
	{ id: "chart-bar", group: "データを見せる", name: "棒グラフ", use: "項目どうしの量を比べ、1 つを目立たせる", requires: ".bars" },
	{ id: "chart-line", group: "データを見せる", name: "折れ線グラフ", use: "時間に沿った変化と、その転換点を見せる", requires: "svg" },
	{ id: "chart-share", group: "データを見せる", name: "内訳", use: "全体に占める割合を見せる", requires: ".share" },
	{ id: "table", group: "データを見せる", name: "表", use: "正確な値を、行と列で引けるようにする", requires: "table", dense: true },
	{ id: "kpi", group: "データを見せる", name: "指標", use: "2〜4 個の指標の今の値と変化を見せる", requires: ".kpi" },
	{ id: "image", group: "物を見せる", name: "写真", use: "実物・現場・雰囲気を写真で見せる", requires: "img" },
	{ id: "screenshot", group: "物を見せる", name: "画面", use: "画面のどこを見るかを指して説明する", requires: "img" },
	{ id: "code", group: "物を見せる", name: "コード", use: "短いコードの、見てほしい行を示す", requires: "pre", dense: true },
	{ id: "diagram", group: "物を見せる", name: "図", use: "仕組み・構成・関係を図で見せる", requires: "figure" },
	{ id: "problem-solution", group: "話の型", name: "課題と解決", use: "困っていることと、その解き方を対にする", requires: ".cols" },
];

export const PATTERN_IDS: ReadonlySet<string> = new Set(PATTERNS.map((p) => p.id));

export function findPattern(id: string): Pattern | undefined {
	return PATTERNS.find((p) => p.id === id);
}
