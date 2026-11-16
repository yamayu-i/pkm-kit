import { useEffect, useState } from "preact/hooks";

/** 本文（Reading）の「Show N closed / Hide closed」（ADR-0181）。状態は保存しない（ヘッダーと同じ） */
export function ClosedToggle(props: { count: number; shown: () => boolean; subscribe: (fn: () => void) => () => void; onToggle: () => void }) {
	const [, tick] = useState(0);
	useEffect(() => props.subscribe(() => tick((n) => n + 1)), []);
	return (
		<button type="button" class="vt-text-button vt-sub-closed-toggle" onClick={props.onToggle}>
			{closedLabel(props.count, props.shown())}
		</button>
	);
}

/** ボタンの文言 */
export function closedLabel(count: number, shown: boolean): string {
	return shown ? "Hide closed" : `Show ${count} closed`;
}
