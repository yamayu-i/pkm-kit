import { Icon } from "./Icon";

/** 表示するページ番号（多いときは先頭・末尾・前後だけ） */
export function pageItems(current: number, pages: number): (number | null)[] {
	if (pages <= 7) return Array.from({ length: pages }, (_, i) => i);
	const keep = new Set([0, pages - 1, current - 1, current, current + 1].filter((i) => i >= 0 && i < pages));
	const out: (number | null)[] = [];
	let prev = -1;
	for (const i of [...keep].sort((a, b) => a - b)) {
		if (i - prev > 1) out.push(null);
		out.push(i);
		prev = i;
	}
	return out;
}

export function Pager(props: { current: number; pages: number; onChange: (page: number) => void }) {
	const { current, pages, onChange } = props;
	return (
		<nav class="vt-pager" aria-label="ページ">
			<button class="vt-pager-step" disabled={current === 0} onClick={() => onChange(current - 1)} aria-label="新しい方へ">
				<Icon name="chevron-left" />
			</button>
			{pageItems(current, pages).map((i) =>
				i === null ? (
					<span class="vt-pager-gap">…</span>
				) : (
					<button class={`vt-pager-page${i === current ? " is-current" : ""}`} aria-current={i === current ? "page" : undefined} onClick={() => onChange(i)}>
						{i + 1}
					</button>
				),
			)}
			<button class="vt-pager-step" disabled={current >= pages - 1} onClick={() => onChange(current + 1)} aria-label="古い方へ">
				<Icon name="chevron-right" />
			</button>
		</nav>
	);
}

