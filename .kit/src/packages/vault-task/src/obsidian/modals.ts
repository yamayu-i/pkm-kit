import { FuzzySuggestModal, Modal, SuggestModal, type App } from "obsidian";
import { h, render, type ComponentChild } from "preact";
import type { Issue, Member } from "../core/schema";

/** preact の部品を中身にするモーダル */
export class PreactModal extends Modal {
	constructor(
		app: App,
		private readonly title: string,
		private readonly view: (close: () => void) => ComponentChild,
	) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle(this.title);
		render(h(() => this.view(() => this.close()) as never, {}), this.contentEl);
	}

	override onClose(): void {
		render(null, this.contentEl);
	}
}

/** issue を ID と summary であいまい検索して選ぶ（ADR-0012） */
export class IssueSuggestModal extends FuzzySuggestModal<Issue> {
	constructor(
		app: App,
		private readonly items: Issue[],
		private readonly onChoose: (issue: Issue) => void,
		placeholder = "issue を検索（ID / summary）",
	) {
		super(app);
		this.setPlaceholder(placeholder);
	}

	getItems(): Issue[] {
		return this.items;
	}

	getItemText(issue: Issue): string {
		return `${issue.id} ${issue.summary}`;
	}

	onChooseItem(issue: Issue): void {
		this.onChoose(issue);
	}
}

type MemberChoice = { kind: "member"; member: Member } | { kind: "create"; name: string };

/** 委任先を名前で検索するか、新しく作る（ADR-0007） */
export class MemberSuggestModal extends SuggestModal<MemberChoice> {
	constructor(
		app: App,
		private readonly members: Member[],
		private readonly onChoose: (choice: MemberChoice) => void,
	) {
		super(app);
		this.setPlaceholder("委任先を名前で検索。なければ名前を入力して新規作成");
	}

	getSuggestions(query: string): MemberChoice[] {
		const q = query.trim().toLowerCase();
		const hits: MemberChoice[] = this.members
			.filter((m) => m.name.toLowerCase().includes(q))
			.map((member) => ({ kind: "member", member }));
		if (q && !this.members.some((m) => m.name.toLowerCase() === q)) hits.push({ kind: "create", name: query.trim() });
		return hits;
	}

	renderSuggestion(choice: MemberChoice, el: HTMLElement): void {
		if (choice.kind === "member") el.createEl("div", { text: choice.member.name });
		else el.createEl("div", { text: `＋「${choice.name}」を新しく作る` });
	}

	onChooseSuggestion(choice: MemberChoice): void {
		this.onChoose(choice);
	}
}
