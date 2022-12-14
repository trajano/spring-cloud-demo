import { render } from '@testing-library/react-native';
import { View, ViewProps } from 'react-native';
/**
 * tests for understanding of standard library
 */
it("should remove undefined", () => {

  const prop: ViewProps = { accessibilityLabel: "foo" };
  const { getByTestId } = render(
    <View>
      <View testID="f" accessibilityLabel={undefined}  {...prop}></View>
      <View testID="g" {...prop} accessibilityLabel={undefined} ></View>
    </View>
  )
  expect(getByTestId("f").props).toStrictEqual({ testID: "f", accessibilityLabel: "foo", children: undefined });
  expect(getByTestId("g").props).toStrictEqual({ testID: "g", children: undefined });
});
