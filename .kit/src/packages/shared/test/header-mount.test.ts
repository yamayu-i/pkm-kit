import { describe, expect, it } from "vitest";
import { keepFirst, placeHeaders, type ElementLike } from "../src/header-mount.ts";

/** テスト用の最小の要素（DOM の環境を足さずに、差し込みの規則だけを確かめる） */
class FakeElement implements ElementLike {
	parent: FakeElement | null = null;
	readonly kids: FakeElement[] = [];
	className: string;
	constructor(className = "") {
		this.className = className;
	}
	get parentElement(): FakeElement | null {
		return this.parent;
	}
	get children(): FakeElement[] {
		return this.kids;
	}
	get firstElementChild(): FakeElement | null {
		return this.kids[0] ?? null;
	}
	prepend(el: FakeElement): void {
		el.remove();
		el.parent = this;
		this.kids.unshift(el);
	}
	append(el: FakeElement): void {
		el.remove();
		el.parent = this;
		this.kids.push(el);
	}
	remove(): void {
		if (!this.parent) return;
		const i = this.parent.kids.indexOf(this);
		if (i >= 0) this.parent.kids.splice(i, 1);
		this.parent = null;
	}
}

const HOST = "vt-header vt-ui";

function sizer(...classes: string[]): FakeElement {
	const s = new FakeElement("cm-sizer");
	for (const c of classes) s.append(new FakeElement(c));
	return s;
}

const create = () => new FakeElement(HOST);

describe("placeHeaders", () => {
	it("対象のノートでは、各 sizer の先頭に 1 つずつ差し込む", () => {
		const a = sizer("inline-title", "metadata-container");
		const b = sizer("mod-header");
		const { hosts, removed } = placeHeaders([a, b], HOST, true, create);
		expect(hosts).toHaveLength(2);
		expect(removed).toHaveLength(0);
		expect(a.firstElementChild?.className).toBe(HOST);
		expect(b.firstElementChild?.className).toBe(HOST);
	});

	it("すでにあれば二重に足さず、同じ要素を返す", () => {
		const a = sizer("metadata-container");
		const first = placeHeaders([a], HOST, true, create).hosts[0];
		const second = placeHeaders([a], HOST, true, create).hosts[0];
		expect(second).toBe(first);
		expect(a.children.filter((c) => c.className === HOST)).toHaveLength(1);
	});

	it("先頭からずれていたら、先頭に戻す", () => {
		const a = sizer("metadata-container");
		const host = placeHeaders([a], HOST, true, create).hosts[0]!;
		a.prepend(new FakeElement("inline-title"));
		placeHeaders([a], HOST, true, create);
		expect(a.firstElementChild).toBe(host);
	});

	it("対象でなくなったら外し、外したものを返す", () => {
		const a = sizer("metadata-container");
		const host = placeHeaders([a], HOST, true, create).hosts[0];
		const { hosts, removed } = placeHeaders([a], HOST, false, create);
		expect(hosts).toHaveLength(0);
		expect(removed).toEqual([host]);
		expect(a.children.map((c) => c.className)).toEqual(["metadata-container"]);
	});

	it("ほかのプラグインのヘッダーには触れない", () => {
		const a = sizer("vt-tpl-note-header", "metadata-container");
		placeHeaders([a], HOST, false, create);
		expect(a.children.map((c) => c.className)).toEqual(["vt-tpl-note-header", "metadata-container"]);
	});
});

describe("keepFirst", () => {
	it("Obsidian が描き直して外れたヘッダーを、同じ要素のまま先頭に戻す", () => {
		const a = sizer("metadata-container");
		const host = placeHeaders([a], HOST, true, create).hosts[0]!;
		host.remove();
		expect(keepFirst(a, host)).toBe(true);
		expect(a.firstElementChild).toBe(host);
	});

	it("先頭にあるときは何もしない（自分の差し込みで繰り返さない）", () => {
		const a = sizer("metadata-container");
		const host = placeHeaders([a], HOST, true, create).hosts[0]!;
		expect(keepFirst(a, host)).toBe(false);
	});
});
