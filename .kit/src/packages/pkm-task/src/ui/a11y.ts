/**
 * マウスで押せるものを、キーボードでも選んで押せるようにする（docs/design.md「状態と動き」、WCAG 2.1.1）。
 * button を使えない場所（行の中のリンクなど）で使う
 */
export function linkProps(open: (e: MouseEvent | KeyboardEvent) => void) {
	return {
		role: "link" as const,
		tabIndex: 0,
		onClick: (e: MouseEvent) => open(e),
		onKeyDown: (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				open(e);
			}
		},
	};
}
