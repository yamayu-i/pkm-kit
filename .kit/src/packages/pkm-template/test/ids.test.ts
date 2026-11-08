import { describe, expect, it } from "vitest";
import { idNumber, isIdPrefix, nextId } from "../src/core/ids";

describe("idNumber", () => {
	it("接頭辞が合い、1 以上の整数のときだけ番号を返す", () => {
		expect(idNumber("i-12", "i")).toBe(12);
		expect(idNumber("m-3", "m")).toBe(3);
		expect(idNumber("i-12", "r")).toBeNull();
		expect(idNumber("i-0", "i")).toBeNull();
		expect(idNumber("i-01", "i")).toBeNull();
		expect(idNumber("i-1a", "i")).toBeNull();
		expect(idNumber("note", "i")).toBeNull();
	});
});

describe("nextId", () => {
	it("既存の最大値 + 1 を返す。欠番は埋めない", () => {
		expect(nextId("i", ["i-1", "i-2", "i-7", "r-9", "daily", "m-20"])).toBe("i-8");
		expect(nextId("m", ["i-1", "m-20"])).toBe("m-21");
	});

	it("1 つもなければ 1 から始める", () => {
		expect(nextId("r", [])).toBe("r-1");
		expect(nextId("r", ["i-1", "note"])).toBe("r-1");
	});
});

describe("isIdPrefix", () => {
	it("i / r / m だけを接頭辞として認める", () => {
		expect(isIdPrefix("i")).toBe(true);
		expect(isIdPrefix("x")).toBe(false);
		expect(isIdPrefix("")).toBe(false);
	});
});
