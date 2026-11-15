import { describe, expect, it } from "vitest";
import { adoptValue } from "../src/core/draft";

const trim = (v: string) => v.trim();

describe("入力中の下書きと、保存して戻ってきた値（ADR-0161）", () => {
	it("保存で整形された値が戻っても、入力中の欄は上書きしない（末尾の空白を消さない）", () => {
		expect(adoptValue({ draft: "foo ", dirty: true }, "foo", trim)).toEqual({ draft: "foo ", dirty: false });
		expect(adoptValue({ draft: "foo ", dirty: false }, "foo", trim)).toEqual({ draft: "foo ", dirty: false });
	});
	it("入力が進んでいるときに古い値が戻っても、入力を残す", () => {
		expect(adoptValue({ draft: "foo bar", dirty: true }, "foo", trim)).toEqual({ draft: "foo bar", dirty: true });
	});
	it("入力中でなければ、ほかで変わった値を取り込む", () => {
		expect(adoptValue({ draft: "foo", dirty: false }, "bar", trim)).toEqual({ draft: "bar", dirty: false });
	});
	it("同じ値なら入力済みの扱いにする", () => {
		expect(adoptValue({ draft: "foo", dirty: true }, "foo", (v) => v)).toEqual({ draft: "foo", dirty: false });
	});
});
