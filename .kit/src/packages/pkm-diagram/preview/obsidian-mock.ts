/** preview 用の obsidian のモック。pkm-diagram が使う形だけ（Chromium で Obsidian なしに動かす） */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Obsidian が HTMLElement に足している関数
const proto = HTMLElement.prototype as any;
proto.createEl = function (tag: string, o: { cls?: string; text?: string; attr?: Record<string, string> } = {}) {
	const el = this.ownerDocument.createElement(tag);
	if (o.cls) el.className = o.cls;
	if (o.text) el.textContent = o.text;
	for (const [k, v] of Object.entries(o.attr ?? {})) el.setAttribute(k, v);
	this.appendChild(el);
	return el;
};
proto.createDiv = function (o: any = {}) {
	return this.createEl("div", o);
};
proto.createSpan = function (o: any = {}) {
	return this.createEl("span", o);
};
proto.addClass = function (c: string) {
	this.classList.add(c);
};
proto.removeClass = function (c: string) {
	this.classList.remove(c);
};
proto.empty = function () {
	this.replaceChildren();
};
proto.setText = function (t: string) {
	this.textContent = t;
};

export function setIcon(el: HTMLElement, name: string): void {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("class", "svg-icon");
	svg.setAttribute("viewBox", "0 0 24 24");
	svg.dataset.icon = name;
	svg.innerHTML = '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>';
	el.prepend(svg);
}

export class Notice {
	constructor(message: string) {
		((window as any).__notices ??= []).push(message);
	}
}

export class TFile {
	constructor(public path: string) {}
	get basename(): string {
		const name = this.path.split("/").pop() ?? "";
		return name.slice(0, name.lastIndexOf("."));
	}
}

export class Modal {
	containerEl = document.createElement("div");
	modalEl = document.createElement("div");
	titleEl = document.createElement("div");
	contentEl = document.createElement("div");
	scope = { register: (_m: string[], key: string, fn: () => unknown) => document.addEventListener("keydown", (e) => e.key === key && fn()) };
	constructor(public app: any) {
		this.containerEl.className = "modal-container";
		this.modalEl.className = "modal";
		this.titleEl.className = "modal-title";
		this.contentEl.className = "modal-content";
		this.modalEl.append(this.titleEl, this.contentEl);
		this.containerEl.append(this.modalEl);
	}
	setTitle(t: string): this {
		this.titleEl.textContent = t;
		return this;
	}
	open(): void {
		document.body.append(this.containerEl);
		(this as any).onOpen?.();
	}
	close(): void {
		(this as any).onClose?.();
		this.containerEl.remove();
	}
}

export class Setting {
	el: HTMLElement;
	constructor(parent: HTMLElement) {
		this.el = (parent as any).createDiv({ cls: "setting-item" });
	}
	setName(): this {
		return this;
	}
	setDesc(): this {
		return this;
	}
	addButton(cb: (b: any) => void): this {
		const button = (this.el as any).createEl("button");
		const b = {
			setButtonText: (t: string) => ((button.textContent = t), b),
			onClick: (f: () => void) => (button.addEventListener("click", f), b),
			setCta: () => (button.classList.add("mod-cta"), b),
			setWarning: () => (button.classList.add("mod-warning"), b),
		};
		cb(b);
		return this;
	}
	addText(cb: (t: any) => void): this {
		const input = (this.el as any).createEl("input");
		const t = { inputEl: input, setValue: (v: string) => ((input.value = v), t), onChange: (f: (v: string) => void) => (input.addEventListener("input", () => f(input.value)), t) };
		cb(t);
		return this;
	}
}

export class SuggestModal<T> extends Modal {
	setPlaceholder(): void {}
	getSuggestions(_q: string): T[] {
		return [];
	}
}

export class Menu {}
export class Plugin {}
export class MarkdownView {}
