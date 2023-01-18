import { renderHook } from "@testing-library/react-native";
import { useColorScheme } from "react-native";
/** Tests for understanding of standard library */
it("should remove undefined", () => {
  const { result } = renderHook(() => useColorScheme(), {});
  expect(result.current).toBe("light");
});
