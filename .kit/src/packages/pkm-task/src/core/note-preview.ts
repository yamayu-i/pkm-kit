/** 空行で区切った段落。コードフェンスの内側の空行は区切らない。選択中の段落は編集用に残す。 */
export function notePreviewBlocks(text: string, selection: readonly { from: number; to: number }[]): { from: number; to: number }[] {
	const blocks: { from: number; to: number }[] = [];
	let start = 0;
	let offset = 0;
	let fence: { char: string; length: number } | null = null;
	const add = (to: number) => {
		if (text.slice(start, to).trim() && !selection.some((s) => s.from <= to && s.to >= start)) blocks.push({ from: start, to });
	};
	for (const line of text.split("\n")) {
		const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
		if (marker) {
			if (!fence) fence = { char: marker[1]![0]!, length: marker[1]!.length };
			else if (marker[1]![0] === fence.char && marker[1]!.length >= fence.length && !marker[2]!.trim()) fence = null;
		}
		if (!fence && !line.trim()) { add(Math.max(start, offset - 1)); start = offset + line.length + 1; }
		offset += line.length + 1;
	}
	add(text.length);
	return blocks;
}
