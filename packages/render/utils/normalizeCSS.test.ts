import { expect, test } from "vitest";
import normalizeCSS from "./normalizeCSS";

test("字符串 类名", () => {
  expect(normalizeCSS("a")).toBe("a");
});

test("对象 类名", () => {
  expect(normalizeCSS({ a: true, b: false, c: true })).toBe("a c");
});

test("数组 类名", () => {
  expect(
    normalizeCSS([{ a: true, b: false, c: true }, "q w", { d: true }])
  ).toBe("a c q w d");
});
