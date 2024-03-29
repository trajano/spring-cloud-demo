import { BASE_URL } from "@env";
import isEmpty from "lodash/isEmpty";
import pickBy from "lodash/pickBy";
/** Tests for understanding of standard library */
it("should remove undefined", () => {
  const prop = { _a: "foo" };
  const prop2 = { _a: undefined, accessibilityLabel: "bar" };
  const combined = { ...prop, ...prop2 };
  expect(combined).toStrictEqual({ _a: undefined, accessibilityLabel: "bar" });
  const combinedPicked = pickBy(combined);
  expect(combinedPicked).toStrictEqual({ accessibilityLabel: "bar" });
});

it("should not crash importing BASE_URL whether it has a value or not", () => {
  expect(BASE_URL ?? "a").toBeTruthy();
});

it("isEmpty", () => {
  expect(isEmpty(undefined)).toBeTruthy();
  expect(isEmpty("")).toBeTruthy();
  expect(isEmpty([])).toBeTruthy();
  expect(isEmpty({})).toBeTruthy();
});
