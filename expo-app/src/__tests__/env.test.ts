import { BASE_URL } from "@env";
test("validate typing", () => {
  const baseUrlUndefined = BASE_URL === undefined;
  const baseUrlDefined = BASE_URL !== undefined;
  expect(baseUrlUndefined || baseUrlDefined).toBeTruthy();
});
