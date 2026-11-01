import { FuzzySuggestModal, Modal, SuggestModal, prepareFuzzySearch, type App } from "obsidian";
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

type BoardChoice = { kind: "issue"; issue: Issue } | { kind: "create"; summary: string };

/** ボードに載せる issue を検索するか、入力した summary で新しく作る */
export class BoardIssueModal extends SuggestModal<BoardChoice> {
	constructor(
		app: App,
		private readonly items: Issue[],
		private readonly onChoose: (choice: BoardChoice) => void,
	) {
		super(app);
		this.setPlaceholder("issue を検索。なければ summary を入力して新規作成");
	}

	getSuggestions(query: string): BoardChoice[] {
		const summary = query.trim();
		if (!summary) return this.items.map((issue) => ({ kind: "issue", issue }));
		const match = prepareFuzzySearch(summary);
		const hits = this.items
			.map((issue) => ({ issue, result: match(`${issue.id} ${issue.summary}`) }))
			.filter((h) => h.result !== null)
			.sort((a, b) => b.result!.score - a.result!.score)
			.map(({ issue }): BoardChoice => ({ kind: "issue", issue }));
		// 似た issue があっても新しく作れるように、常に最後に出す
		return [...hits, { kind: "create", summary }];
	}

	renderSuggestion(choice: BoardChoice, el: HTMLElement): void {
		if (choice.kind === "issue") el.createEl("div", { text: `${choice.issue.id} ${choice.issue.summary}` });
		else el.createEl("div", { text: `＋「${choice.summary}」を作成してボードに載せる` });
	}

	onChooseSuggestion(choice: BoardChoice): void {
		this.onChoose(choice);
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
