import { setIcon } from "obsidian";
import { useEffect, useRef } from "preact/hooks";

/** Obsidian のアイコン（Lucide）。文字の記号でアイコンを代用しない（docs/design.md） */
export function Icon({ name }: { name: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	useEffect(() => {
		if (ref.current) setIcon(ref.current, name);
	}, [name]);
	return <span class="vt-tpl-icon" ref={ref} aria-hidden="true" />;
}
