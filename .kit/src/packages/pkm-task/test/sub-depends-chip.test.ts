import { describe, expect, it } from "vitest";
import { dependsChip, toggleDepends } from "../src/core/sub-issue";

const subs = [
	{ id: "aaaaaa", summary: "見積もりを出す" },
	{ id: "bbbbbb", summary: "経理に確認してもらう" },
	{ id: "cccccc", summary: "結果を共有する" },
];

describe("Depends on のボタンの文言", () => {
	it("選んでいないときは None", () => {
		expect(dependsChip(subs, [])).toEqual({ text: "None", title: null, empty: true });
	});
	it("1 件のときはその題", () => {
		expect(dependsChip(subs, ["bbbbbb"])).toEqual({ text: "経理に確認してもらう", title: "経理に確認してもらう", empty: false });
	});
	it("2 件以上は件数で、題はツールチップに並べる（候補の順）", () => {
		expect(dependsChip(subs, ["cccccc", "aaaaaa"])).toEqual({ text: "2 sub-issues", title: "見積もりを出す\n結果を共有する", empty: false });
	});
	it("候補にない ID は数えない", () => {
		expect(dependsChip(subs, ["zzzzzz"])).toEqual({ text: "None", title: null, empty: true });
	});
});

describe("Depends on の付け外し", () => {
	it("付いていなければ足し、付いていれば外す", () => {
		expect(toggleDepends(["aaaaaa"], "bbbbbb")).toEqual(["aaaaaa", "bbbbbb"]);
		expect(toggleDepends(["aaaaaa", "bbbbbb"], "aaaaaa")).toEqual(["bbbbbb"]);
	});
});
