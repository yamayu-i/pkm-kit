import type { RefObject } from "preact";
import { useEffect, useRef } from "preact/hooks";

/** つまみの最小の幅（px）。styles.css の .vt-scroll-rail-thumb と同じ */
const MIN_THUMB = 24;

/** つまみの左端と幅（px）。横にはみ出していなければ null */
export function railThumb(scrollLeft: number, scrollWidth: number, clientWidth: number, track: number): { left: number; width: number } | null {
	if (scrollWidth <= clientWidth || track <= 0) return null;
	const width = Math.min(track, Math.max(MIN_THUMB, (clientWidth / scrollWidth) * track));
	const max = scrollWidth - clientWidth;
	const left = (Math.min(max, Math.max(0, scrollLeft)) / max) * (track - width);
	return { left, width };
}

/** つまみを dx（px）動かしたときの scrollLeft */
export function railScrollFor(startScroll: number, dx: number, scrollWidth: number, clientWidth: number, track: number, thumb: number): number {
	const room = track - thumb;
	if (room <= 0) return startScroll;
	return startScroll + (dx / room) * (scrollWidth - clientWidth);
}

/**
 * 自前で描く横のスクロールバー。target の横スクロールに合わせてつまみを動かし、つまみのドラッグ・溝の押下・ホイールで target を動かす。
 * OS のスクロールバー（macOS の「スクロール時に表示」など）に頼らず、いつも見えて押せるようにする。
 * 置き場所（画面の下端への sticky など）は呼ぶ側の class で決める
 */
export function ScrollRail(props: { target: RefObject<HTMLElement>; class?: string; contentWidth: number }) {
	const rail = useRef<HTMLDivElement>(null);
	const thumb = useRef<HTMLDivElement>(null);
	const drag = useRef<{ x: number; scroll: number } | null>(null);

	const update = () => {
		const el = props.target.current;
		const r = rail.current;
		const t = thumb.current;
		if (!el || !r || !t) return;
		const v = railThumb(el.scrollLeft, el.scrollWidth, el.clientWidth, r.clientWidth);
		r.classList.toggle("is-idle", v === null);
		if (v) {
			t.style.left = `${v.left}px`;
			t.style.width = `${v.width}px`;
		}
	};

	useEffect(() => {
		const el = props.target.current;
		if (!el) return;
		update();
		el.addEventListener("scroll", update, { passive: true });
		const ro = new ResizeObserver(update);
		ro.observe(el);
		if (rail.current) ro.observe(rail.current);
		return () => {
			el.removeEventListener("scroll", update);
			ro.disconnect();
		};
	}, []);
	// 中身の幅（目盛りの切り替えなど）が変わったら、つまみを合わせ直す
	useEffect(update, [props.contentWidth]);

	const onThumbDown = (e: PointerEvent) => {
		const el = props.target.current;
		if (!el) return;
		e.preventDefault();
		e.stopPropagation();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		drag.current = { x: e.clientX, scroll: el.scrollLeft };
		rail.current?.classList.add("is-dragging");
	};
	const onThumbMove = (e: PointerEvent) => {
		const el = props.target.current;
		const d = drag.current;
		if (!el || !d || !rail.current || !thumb.current) return;
		el.scrollLeft = railScrollFor(d.scroll, e.clientX - d.x, el.scrollWidth, el.clientWidth, rail.current.clientWidth, thumb.current.offsetWidth);
	};
	const onThumbUp = () => {
		drag.current = null;
		rail.current?.classList.remove("is-dragging");
	};
	// 溝を押したら、その位置につまみの中心が来るように動かす
	const onTrackDown = (e: PointerEvent) => {
		const el = props.target.current;
		const r = rail.current;
		const t = thumb.current;
		if (!el || !r || !t) return;
		const x = e.clientX - r.getBoundingClientRect().left - t.offsetWidth / 2;
		el.scrollLeft = railScrollFor(0, x, el.scrollWidth, el.clientWidth, r.clientWidth, t.offsetWidth);
	};
	// 溝の上の縦のホイールは横スクロールにする
	const onWheel = (e: WheelEvent) => {
		const el = props.target.current;
		if (!el) return;
		e.preventDefault();
		el.scrollLeft += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
	};

	return (
		<div class={`vt-scroll-rail${props.class ? ` ${props.class}` : ""}`} ref={rail} onPointerDown={onTrackDown} onWheel={onWheel} aria-hidden="true">
			<div class="vt-scroll-rail-thumb" ref={thumb} onPointerDown={onThumbDown} onPointerMove={onThumbMove} onPointerUp={onThumbUp} onPointerCancel={onThumbUp} />
		</div>
	);
}
