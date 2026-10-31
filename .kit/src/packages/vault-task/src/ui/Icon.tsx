import { setIcon } from "obsidian";
import { useEffect, useRef } from "preact/hooks";

/** Obsidian が持っている Lucide のアイコン */
export function Icon(props: { name: string; class?: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	useEffect(() => {
		if (!ref.current) return;
		ref.current.replaceChildren();
		setIcon(ref.current, props.name);
	}, [props.name]);
	return <span ref={ref} class={`vt-icon ${props.class ?? ""}`} aria-hidden="true" />;
}
