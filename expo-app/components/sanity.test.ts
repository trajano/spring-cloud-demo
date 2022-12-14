import { pickBy } from "lodash";
/**
 * tests for understanding of standard library
 */
it("should remove undefined", () => {
  const prop = { _a: "foo" };
  const prop2 = { _a: undefined, accessibilityLabel: "bar" };
  const combined = { ...prop, ...prop2 };
  expect(combined).toStrictEqual({ _a: undefined, accessibilityLabel: "bar" });
  const combinedPicked = pickBy(combined);
  expect(combinedPicked).toStrictEqual({ accessibilityLabel: "bar" });
});
