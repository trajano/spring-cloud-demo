import { render, screen } from "@testing-library/react-native";
import { View, ViewProps } from "react-native";
/**
 * tests for understanding of standard library with JSX
 */
it("should remove undefined", () => {
  const prop: ViewProps = { accessibilityLabel: "foo" };
  render(
    <View>
      <View testID="f" accessibilityLabel={undefined} {...prop} />
      <View testID="g" {...prop} accessibilityLabel={undefined} />
    </View>
  );
  expect(screen.getByTestId("f").props).toStrictEqual({
    testID: "f",
    accessibilityLabel: "foo",
    children: undefined,
  });
  expect(screen.getByTestId("g").props).toStrictEqual({
    testID: "g",
    children: undefined,
  });
});
