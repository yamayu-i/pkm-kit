import { FuzzySuggestModal, Modal, SuggestModal, prepareFuzzySearch, type App } from "obsidian";
import { h, render, type ComponentChild } from "preact";
import { memberExactly, memberLabel, memberMatches, memberQuery, sortMembers } from "../core/member";
import type { Issue, Member } from "../core/schema";
import type { SubIssue } from "../core/sub-issue";

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
		placeholder = "Search issues (ID / summary)",
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

export type BoardChoice = { kind: "issue"; issue: Issue } | { kind: "sub"; sub: SubIssue } | { kind: "create"; summary: string };

/** 候補の文字（サブは `i-12 › 題`。ADR-0137） */
export function boardChoiceText(choice: Exclude<BoardChoice, { kind: "create" }>): string {
	return choice.kind === "issue" ? `${choice.issue.id} ${choice.issue.summary}` : `${choice.sub.parent} › ${choice.sub.summary}`;
}

/** 候補を絞る。空なら全部、そうでなければ曖昧検索の点の順。作る候補は常に最後 */
export function boardSuggestions(items: readonly Exclude<BoardChoice, { kind: "create" }>[], query: string, match: (q: string) => (text: string) => { score: number } | null): BoardChoice[] {
	const summary = query.trim();
	if (!summary) return [...items];
	const test = match(summary);
	const hits = items
		.map((item) => ({ item, result: test(boardChoiceText(item)) }))
		.filter((h) => h.result !== null)
		.sort((a, b) => b.result!.score - a.result!.score)
		.map(({ item }): BoardChoice => item);
	// 似た issue があっても新しく作れるように、常に最後に出す
	return [...hits, { kind: "create", summary }];
}

/** ボードに載せる issue かサブを検索するか、入力した summary で新しく作る */
export class BoardIssueModal extends SuggestModal<BoardChoice> {
	constructor(
		app: App,
		private readonly items: Exclude<BoardChoice, { kind: "create" }>[],
		private readonly onChoose: (choice: BoardChoice) => void,
	) {
		super(app);
		this.setPlaceholder("Search issues and sub-issues, or type a summary to create one");
	}

	getSuggestions(query: string): BoardChoice[] {
		return boardSuggestions(this.items, query, prepareFuzzySearch);
	}

	renderSuggestion(choice: BoardChoice, el: HTMLElement): void {
		if (choice.kind === "create") el.createEl("div", { text: `+ Create "${choice.summary}" and add it to the board` });
		else el.createEl("div", { text: boardChoiceText(choice) });
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
		this.setPlaceholder("Search delegates by @alias, nickname or name, or type a name to create one");
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
		else el.createEl("div", { text: `+ Create "${choice.name}"` });
	}

	onChooseSuggestion(choice: MemberChoice): void {
		this.onChoose(choice);
	}
}
