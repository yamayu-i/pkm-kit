import { FuzzySuggestModal, Modal, SuggestModal, prepareFuzzySearch, type App } from "obsidian";
import { h, render, type ComponentChild } from "preact";
import { memberExactly, memberLabel, memberMatches, memberQuery, sortMembers } from "../core/member";
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
		// vt-ui: 入力欄などの共通の見た目の範囲（#32）
		this.modalEl.addClass("vt-ui");
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

/** 委任先を alias / nickname / name / ID で検索するか、新しく作る（ADR-0007, 0035）。候補は `@alias - nickname (name)` */
export class MemberSuggestModal extends SuggestModal<MemberChoice> {
	constructor(
		app: App,
		private readonly members: Member[],
		private readonly onChoose: (choice: MemberChoice) => void,
	) {
		super(app);
		this.setPlaceholder("委任先を @alias・呼び名・名前で検索。なければ名前を入力して新規作成");
	}

	getSuggestions(query: string): MemberChoice[] {
		const hits: MemberChoice[] = sortMembers(this.members)
			.filter((m) => memberMatches(m, query))
			.map((member) => ({ kind: "member", member }));
		const name = query.trim().replace(/^@+/, "").trim();
		if (memberQuery(query) && !this.members.some((m) => memberExactly(m, query))) hits.push({ kind: "create", name });
		return hits;
	}

	renderSuggestion(choice: MemberChoice, el: HTMLElement): void {
		if (choice.kind === "member") el.createEl("div", { text: memberLabel(choice.member) });
		else el.createEl("div", { text: `＋「${choice.name}」を新しく作る` });
	}

	onChooseSuggestion(choice: MemberChoice): void {
		this.onChoose(choice);
	}
}
