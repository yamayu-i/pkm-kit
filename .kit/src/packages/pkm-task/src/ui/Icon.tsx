import { setIcon } from "obsidian";
import { useEffect, useRef } from "preact/hooks";

/** Obsidian が持っている Lucide のアイコン。名前がない版の Obsidian のために、別名（fallback）を渡せる */
export function Icon(props: { name: string; fallback?: string; class?: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	useEffect(() => {
		if (!ref.current) return;
		ref.current.replaceChildren();
		setIcon(ref.current, props.name);
		if (!ref.current.firstChild && props.fallback) setIcon(ref.current, props.fallback);
	}, [props.name, props.fallback]);
	return <span ref={ref} class={`vt-icon ${props.class ?? ""}`} aria-hidden="true" />;
}
