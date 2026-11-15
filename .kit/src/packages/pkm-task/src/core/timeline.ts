import { addDays, diffDays, weekdayOf, type LocalDate } from "./dates";

/** ガントチャートの目盛り（ADR-0143）。週は日曜始まり */
export type TimelineScale = "day" | "week";

/** 1 日の幅（px）。Week は全期間を見渡すために細くする */
export const DAY_PX: Record<TimelineScale, number> = { day: 28, week: 8 };

/** 前後に足す日数と、最低の長さ */
const PAD_DAYS = 2;
const MIN_DAYS = 14;
const MIN_WEEKS = 8;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** 図に出すサブの項目 */
export interface TimelineSub {
	id: string;
	start: LocalDate | null;
	end: LocalDate | null;
	scheduled: LocalDate[];
	softDeadline: LocalDate | null;
	deadline: LocalDate | null;
	dependsOn: string[];
}

/** 図の範囲: from から days 日（from を含む） */
export interface TimelineRange {
	from: LocalDate;
	days: number;
}

export interface TimelineColumn {
	/** Day はその日、Week はその週の日曜 */
	date: LocalDate;
	/** Day は日（`15`）、Week は日曜の月日（`11/15`） */
	label: string;
	/** 範囲の始まりと、月が変わった列にだけ月の名前 */
	month: string | null;
	/** 土日（Day だけ） */
	weekend: boolean;
	/** 週の始まり（日曜）。区切りの線を引く */
	weekStart: boolean;
	/** 列の日数 */
	span: number;
}

const minDate = (dates: LocalDate[]) => dates.reduce((a, b) => (b < a ? b : a));
const maxDate = (dates: LocalDate[]) => dates.reduce((a, b) => (b > a ? b : a));

/** 図の範囲（ADR-0143）: サブの日付と今日を含み、前後 2 日。Day は最低 14 日、Week は日曜〜土曜に広げて最低 8 週 */
export function timelineRange(subs: readonly TimelineSub[], today: LocalDate, scale: TimelineScale): TimelineRange {
	const dates = [today];
	for (const s of subs) {
		for (const d of [s.start, s.end, s.softDeadline, s.deadline, ...s.scheduled]) if (d) dates.push(d);
	}
	let from = addDays(minDate(dates), -PAD_DAYS);
	let to = addDays(maxDate(dates), PAD_DAYS);
	if (scale === "week") {
		from = addDays(from, -weekdayOf(from));
		to = addDays(to, 6 - weekdayOf(to));
	}
	const days = Math.max(diffDays(to, from) + 1, scale === "week" ? MIN_WEEKS * 7 : MIN_DAYS);
	return { from, days };
}

/** 列の見出し */
export function timelineColumns(range: TimelineRange, scale: TimelineScale): TimelineColumn[] {
	const out: TimelineColumn[] = [];
	const step = scale === "week" ? 7 : 1;
	let prevMonth = -1;
	for (let i = 0; i < range.days; i += step) {
		const date = addDays(range.from, i);
		const month = Number(date.slice(5, 7)) - 1;
		const day = Number(date.slice(8, 10));
		const wd = weekdayOf(date);
		const showMonth = i === 0 || (scale === "day" ? day === 1 : month !== prevMonth);
		out.push({
			date,
			label: scale === "week" ? `${month + 1}/${day}` : String(day),
			month: showMonth ? MONTHS[month]! : null,
			weekend: scale === "day" && (wd === 0 || wd === 6),
			weekStart: wd === 0,
			span: Math.min(step, range.days - i),
		});
		prevMonth = month;
	}
	return out;
}

/** 範囲の始まりからの日数 */
export function dayOffset(range: TimelineRange, date: LocalDate): number {
	return diffDays(date, range.from);
}

/** x 座標（図の左端から px）の日付。範囲の外は端の日にする */
export function dateAtX(range: TimelineRange, x: number, scale: TimelineScale): LocalDate {
	const i = Math.min(range.days - 1, Math.max(0, Math.floor(x / DAY_PX[scale])));
	return addDays(range.from, i);
}

/** 棒（両端の日を含む）。片方だけなら 1 日、逆なら入れ替える。期間がなければ null */
export function barOf(sub: Pick<TimelineSub, "start" | "end">): { start: LocalDate; end: LocalDate } | null {
	const a = sub.start ?? sub.end;
	const b = sub.end ?? sub.start;
	if (a === null || b === null) return null;
	return a <= b ? { start: a, end: b } : { start: b, end: a };
}

export type DragMode = "move" | "start" | "end";

/** ドラッグの結果: move は丸ごとずらす、start / end は片方だけ。start は end を越えない */
export function dragBar(bar: { start: LocalDate; end: LocalDate }, mode: DragMode, delta: number): { start: LocalDate; end: LocalDate } {
	if (mode === "move") return { start: addDays(bar.start, delta), end: addDays(bar.end, delta) };
	if (mode === "start") {
		const start = addDays(bar.start, delta);
		return { start: start > bar.end ? bar.end : start, end: bar.end };
	}
	const end = addDays(bar.end, delta);
	return { start: bar.start, end: end < bar.start ? bar.start : end };
}

/** 依存の矢印: 依存先とそのサブの両方に棒があるときだけ。依存先の end より前に始まると遅れ（lint の start-before-dependency と同じ） */
export function dependencyArrows(subs: readonly TimelineSub[]): { from: string; to: string; late: boolean }[] {
	const bars = new Map(subs.map((s) => [s.id, barOf(s)]));
	const out: { from: string; to: string; late: boolean }[] = [];
	for (const s of subs) {
		const to = bars.get(s.id);
		if (!to) continue;
		for (const dep of s.dependsOn) {
			const from = bars.get(dep);
			if (!from || dep === s.id) continue;
			out.push({ from: dep, to: s.id, late: to.start < from.end });
		}
	}
	return out;
}

/** 矢印の折れの余白（px）、縦の通り道のずらし幅、行の間の隙間でのずらし幅（棒の上下の空きは 8px） */
const ARROW_GAP = 8;
const LANE_V = 4;
const BAND_OFFSETS = [0, -3, 3, -6, 6];
/** 棒のまわりに空ける幅（縦の通り道がこれより近づかない） */
const BAR_CLEAR = 4;

/** 行ごとの棒の左右（px）。棒がなければ null */
export type BarSpan = { x0: number; x1: number } | null;

type Point = [number, number];

/**
 * 依存の矢印の経路（ADR-0143）。どれも依存先の棒の右端から出て、依存するサブの棒の左端に左から入る。
 * - 横に動くのは、出る行と入る行の中（棒の外側）と、行と行の間の隙間（棒の上下の空き）だけ
 * - 縦に動くのは、途中の行に棒のない通り道だけ（入り組んでも途中の棒を横切らない）
 * - 縦の通り道どうし、隙間の横の線どうしは、重なるときだけずらす
 */
export function routeArrows(arrows: readonly { fromRow: number; toRow: number }[], bars: readonly BarSpan[], rowHeight: number): Point[][] {
	const mid = (row: number) => row * rowHeight + rowHeight / 2;
	const maxX = Math.max(0, ...bars.map((b) => b?.x1 ?? 0)) + ARROW_GAP * 4;
	/** 引いた縦の線。from / to は、その矢印の出る行・入る行（同じ棒から出る・入る線は、出口・入口を共有してよい） */
	const verticals: { x: number; y0: number; y1: number; from: number; to: number }[] = [];
	const bands: { y: number; x0: number; x1: number }[] = [];
	/** rowA と rowB の間（両端の行を除く）の行に、x を覆う棒がない */
	const columnFree = (x: number, rowA: number, rowB: number) => {
		for (let r = Math.min(rowA, rowB) + 1; r < Math.max(rowA, rowB); r++) {
			const b = bars[r];
			if (b && x > b.x0 - BAR_CLEAR && x < b.x1 + BAR_CLEAR) return false;
		}
		return true;
	};
	const verticalFree = (x: number, y0: number, y1: number, share: (v: { from: number; to: number }) => boolean) =>
		!verticals.some((v) => !share(v) && Math.abs(v.x - x) < 3 && Math.min(v.y1, Math.max(y0, y1)) - Math.max(v.y0, Math.min(y0, y1)) > 1);
	/** ideal に近い順に、[lo, hi] の中で通れる x を探す。なければ ideal（lo〜hi に収める） */
	const pickX = (ideal: number, lo: number, hi: number, rowA: number, rowB: number, y0: number, y1: number, share: (v: { from: number; to: number }) => boolean = () => false) => {
		const limit = Math.max(ideal - lo, hi - ideal);
		for (let d = 0; d <= limit; d += LANE_V) {
			for (const x of d === 0 ? [ideal] : [ideal - d, ideal + d]) {
				if (x < lo || x > hi) continue;
				if (columnFree(x, rowA, rowB) && verticalFree(x, y0, y1, share)) return x;
			}
		}
		return null;
	};
	/** 行の境目（boundary 番目の行の上端）の隙間で、[x0, x1] が空いている y */
	const pickBand = (boundary: number, xa: number, xb: number) => {
		const base = boundary * rowHeight;
		const [x0, x1] = [Math.min(xa, xb), Math.max(xa, xb)];
		for (const off of BAND_OFFSETS) {
			const y = base + off;
			if (!bands.some((b) => Math.abs(b.y - y) < 2 && Math.min(b.x1, x1) - Math.max(b.x0, x0) > 1)) return y;
		}
		return base;
	};
	const record = (points: Point[], from: number, to: number) => {
		for (let i = 1; i < points.length; i++) {
			const [ax, ay] = points[i - 1]!;
			const [bx, by] = points[i]!;
			if (ax === bx) verticals.push({ x: ax, y0: Math.min(ay, by), y1: Math.max(ay, by), from, to });
			else if (Math.abs(ay - Math.round(ay / rowHeight) * rowHeight) <= 8 && ay === by) bands.push({ y: ay, x0: Math.min(ax, bx), x1: Math.max(ax, bx) });
		}
	};

	return arrows.map(({ fromRow, toRow }) => {
		const src = bars[fromRow]!;
		const dst = bars[toRow]!;
		const x1 = src.x1;
		const y1 = mid(fromRow);
		const x2 = dst.x0;
		const y2 = mid(toRow);
		const down = toRow > fromRow;
		// 1. 間が空いていれば、依存するサブの棒の手前で 1 回だけ縦に折れる
		if (x2 - x1 >= ARROW_GAP * 2) {
			// 同じ棒に入る線は、入口の縦の線を共有する
			const xv = pickX(x2 - ARROW_GAP, x1 + BAR_CLEAR, x2 - BAR_CLEAR, fromRow, toRow, y1, y2, (v) => v.to === toRow);
			if (xv !== null) {
				const points: Point[] = [[x1, y1], [xv, y1], [xv, y2], [x2, y2]];
				record(points, fromRow, toRow);
				return points;
			}
		}
		// 2. それ以外は、出る行の隙間 → 通れる縦の通り道 → 入る行の隙間、を通る
		const srcBoundary = down ? fromRow + 1 : fromRow;
		const dstBoundary = down ? toRow : toRow + 1;
		const ySrcBand = srcBoundary * rowHeight;
		const yDstBand = dstBoundary * rowHeight;
		// 同じ棒から出る線は出口を、同じ棒に入る線は入口を共有する（枝分かれの形にする）
		const xa = pickX(x1 + ARROW_GAP, x1 + BAR_CLEAR, x1 + ARROW_GAP * 4, fromRow, fromRow, y1, ySrcBand, (v) => v.from === fromRow) ?? x1 + ARROW_GAP;
		const xb = pickX(x2 - ARROW_GAP, x2 - ARROW_GAP * 4, x2 - BAR_CLEAR, toRow, toRow, yDstBand, y2, (v) => v.to === toRow) ?? x2 - ARROW_GAP;
		let points: Point[];
		if (srcBoundary === dstBoundary) {
			const yb = pickBand(srcBoundary, xa, xb);
			points = [[x1, y1], [xa, y1], [xa, yb], [xb, yb], [xb, y2], [x2, y2]];
		} else {
			// 縦の通り道は、図の左端からいちばん右の棒の少し先までの中で、入る棒の手前に近い順に探す
			const xc = pickX(xb, 0, maxX, fromRow, toRow, ySrcBand, yDstBand) ?? xb;
			const ys = pickBand(srcBoundary, xa, xc);
			const yt = pickBand(dstBoundary, xc, xb);
			points = [[x1, y1], [xa, y1], [xa, ys], [xc, ys], [xc, yt], [xb, yt], [xb, y2], [x2, y2]];
		}
		points = simplify(points);
		record(points, fromRow, toRow);
		return points;
	});
}

/** 同じ点と、一直線に並んだ真ん中の点を除く */
function simplify(points: Point[]): Point[] {
	const out: Point[] = [];
	for (const p of points) {
		const last = out[out.length - 1];
		if (last && last[0] === p[0] && last[1] === p[1]) continue;
		const prev = out[out.length - 2];
		if (prev && last && ((prev[0] === last[0] && last[0] === p[0]) || (prev[1] === last[1] && last[1] === p[1]))) out[out.length - 1] = p;
		else out.push(p);
	}
	return out;
}

const num = (n: number) => String(Math.round(n * 100) / 100);

/** 折れ線を、角を丸めた SVG の path にする。丸めは前後の区間の半分まで */
export function roundedPath(points: readonly [number, number][], radius: number): string {
	if (points.length === 0) return "";
	let d = `M${num(points[0]![0])} ${num(points[0]![1])}`;
	for (let i = 1; i < points.length - 1; i++) {
		const [px, py] = points[i - 1]!;
		const [cx, cy] = points[i]!;
		const [nx, ny] = points[i + 1]!;
		const lenPrev = Math.hypot(cx - px, cy - py);
		const lenNext = Math.hypot(nx - cx, ny - cy);
		const r = Math.min(radius, lenPrev / 2, lenNext / 2);
		const ax = cx - ((cx - px) / (lenPrev || 1)) * r;
		const ay = cy - ((cy - py) / (lenPrev || 1)) * r;
		const bx = cx + ((nx - cx) / (lenNext || 1)) * r;
		const by = cy + ((ny - cy) / (lenNext || 1)) * r;
		d += ` L${num(ax)} ${num(ay)} Q${num(cx)} ${num(cy)} ${num(bx)} ${num(by)}`;
	}
	const last = points[points.length - 1]!;
	return `${d} L${num(last[0])} ${num(last[1])}`;
}
