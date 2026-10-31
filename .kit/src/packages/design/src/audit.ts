/**
 * 描画した画面の検査（preview で Chromium に読み込ませて使う）。
 * 静的な検査（css-lint）では分からない、実際の色の重なり・押せる大きさ・フォーカスの見え方を見る
 */

export const RUNTIME_RULES = {
	"run/contrast": "描画された文字と、その下の面（半透明の重なりと opacity を含む）のコントラスト比が 4.5:1（大きい文字は 3:1）以上",
	"run/target-size": "押せるものは 24×24px 以上。小さいときは、中心から 24px の範囲に他の押せるものがない",
	"run/focus-visible": "Tab で選んだものに 2px 以上の outline が出る",
	"run/keyboard": "マウスで押せるもの（cursor: pointer）は Tab で選べる",
} as const;

export type RuntimeRuleId = keyof typeof RUNTIME_RULES;

export interface AuditProblem {
	rule: RuntimeRuleId;
	where: string;
	message: string;
}

/**
 * ブラウザの中で動かす関数。依存を持たないこと（page.evaluate でそのまま渡す）。
 * root の中の要素を調べる
 */
export function auditInPage({ rootSelector, targetMin }: { rootSelector: string; targetMin: number }): AuditProblem[] {
	type C = { r: number; g: number; b: number; a: number };
	const problems: AuditProblem[] = [];
	const root = document.querySelector(rootSelector);
	if (!root) return [{ rule: "run/contrast", where: rootSelector, message: "要素がありません" }];

	const parse = (s: string): C => {
		const m = /rgba?\(([^)]+)\)/.exec(s);
		if (!m) return { r: 0, g: 0, b: 0, a: 0 };
		const p = (m[1] as string).split(/[\s,/]+/).filter(Boolean).map(Number);
		return { r: p[0] ?? 0, g: p[1] ?? 0, b: p[2] ?? 0, a: p[3] ?? 1 };
	};
	const over = (t: C, b: C): C => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
	const lum = (c: C) => {
		const ch = (v: number) => {
			const s = v / 255;
			return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
		};
		return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
	};
	const ratio = (a: C, b: C) => {
		const x = lum(a);
		const y = lum(b);
		return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
	};
	const describe = (el: Element) => {
		const cls = [...el.classList].filter((c) => c.startsWith("vt-") || c.startsWith("is-")).join(".");
		const text = (el.textContent ?? "").trim().slice(0, 20);
		return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""}「${text}」`;
	};
	const isDisabled = (el: Element) => el.closest(":disabled, [aria-disabled='true']") !== null;
	const visible = (el: Element) => {
		const r = el.getBoundingClientRect();
		const s = getComputedStyle(el);
		return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
	};

	/** el の下にある面（祖先の背景を下から重ねる。opacity も掛ける） */
	const background = (el: Element): { color: C; opacity: number } => {
		const layers: C[] = [];
		let opacity = 1;
		for (let n: Element | null = el; n; n = n.parentElement) {
			const s = getComputedStyle(n);
			opacity *= Number(s.opacity);
			const bg = parse(s.backgroundColor);
			if (bg.a > 0) layers.push(bg);
			if (bg.a >= 1) break;
		}
		let color: C = { r: 255, g: 255, b: 255, a: 1 };
		for (let i = layers.length - 1; i >= 0; i--) color = over(layers[i] as C, color);
		return { color, opacity };
	};

	// 文字のコントラスト
	for (const el of root.querySelectorAll("*")) {
		const own = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim() !== "");
		if (!own || !visible(el) || isDisabled(el) || el.closest("[aria-hidden='true']")) continue;
		const s = getComputedStyle(el);
		const fg = parse(s.color);
		const { color: bg, opacity } = background(el);
		// 自分と祖先の opacity は文字にも面にも掛かるが、さらに下（ページ）の白と混ざるので文字の側に掛けて近似する
		const text = over({ ...fg, a: fg.a * opacity }, bg);
		const size = Number.parseFloat(s.fontSize);
		const weight = Number(s.fontWeight);
		const large = size >= 24 || (size >= 18.66 && weight >= 700);
		const min = large ? 3 : 4.5;
		const r = ratio(text, bg);
		if (r < min) problems.push({ rule: "run/contrast", where: describe(el), message: `${r.toFixed(2)} < ${min}` });
	}

	// 押せる大きさ
	const targets = [...root.querySelectorAll("button, a[href], input, select, textarea, [role='button'], [tabindex]:not([tabindex='-1'])")].filter(
		(el) => visible(el) && !isDisabled(el),
	);
	const rects = targets.map((el) => el.getBoundingClientRect());
	targets.forEach((el, i) => {
		const r = rects[i] as DOMRect;
		if (r.width >= targetMin && r.height >= targetMin) return;
		// 例外（WCAG 2.5.8 の spacing）: 中心の targetMin 四方が他の押せるものと重ならない
		const cx = r.left + r.width / 2;
		const cy = r.top + r.height / 2;
		const h = targetMin / 2;
		const hit = rects.some((o, j) => j !== i && !targets[j]?.contains(el) && !el.contains(targets[j] as Element) && o.left < cx + h && o.right > cx - h && o.top < cy + h && o.bottom > cy - h);
		if (hit) problems.push({ rule: "run/target-size", where: describe(el), message: `${r.width.toFixed(0)}×${r.height.toFixed(0)}px` });
	});

	// キーボードで選べるか（WCAG 2.1.1）
	for (const el of root.querySelectorAll("*")) {
		if (!visible(el) || isDisabled(el) || getComputedStyle(el).cursor !== "pointer") continue;
		// 親から cursor を継承しているだけの子は数えない（押せる範囲の一番外側だけを見る）
		if (el.parentElement && getComputedStyle(el.parentElement).cursor === "pointer") continue;
		if ((el as HTMLElement).tabIndex >= 0 || el.closest("button, a[href], label, input, select, textarea") !== null) continue;
		problems.push({ rule: "run/keyboard", where: describe(el), message: "Tab で選べません（button にするか、tabindex と Enter の処理を付ける）" });
	}
	return problems;
}

/** いまフォーカスのある要素に、見える枠があるか（Tab を押したあとに呼ぶ） */
export function focusRingInPage(minWidth: number): { where: string; ok: boolean } | null {
	const el = document.activeElement;
	if (!el || el === document.body) return null;
	const s = getComputedStyle(el);
	const ok = s.outlineStyle !== "none" && Number.parseFloat(s.outlineWidth) >= minWidth;
	const cls = [...el.classList].filter((c) => c.startsWith("vt-")).join(".");
	return { where: `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""}「${(el.textContent ?? "").trim().slice(0, 20)}」`, ok };
}
