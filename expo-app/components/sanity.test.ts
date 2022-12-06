import pickBy from "lodash.pickby";
/**
 * tests for understanding of standard library
 */
it("should remove undefined", () => {
  const prop = { _a: "foo" };
  const prop2 = { _a: undefined, accessibilityLabel: "bar" };
  const combined = pickBy({ ...prop, ...prop2 }, (v) => v !== undefined);
  expect(combined).toStrictEqual({ accessibilityLabel: "bar" });
});
