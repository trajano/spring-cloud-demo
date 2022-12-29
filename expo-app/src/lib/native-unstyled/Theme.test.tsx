import { fireEvent, render, waitFor } from "@testing-library/react-native";
import {
  Text as RNText,
  View as RNView
} from "react-native";

import { Text, TextInput, View } from "./components";
import { defaultDarkColorSchemeColors } from "./defaultColorSchemes/defaultDarkColorSchemeColors";
import { ThemeProvider } from "./ThemeContext";

it("should i18n Text and preseve other styles and remap font", async () => {
  const mockFont = {
    useFonts: jest.fn(),

    __metadata__: {},
    IBMPlexSans_100Thin: 1,
    IBMPlexSans_100Thin_Italic: 2,
    IBMPlexSans_200ExtraLight: 3,
    IBMPlexSans_200ExtraLight_Italic: 4,
    IBMPlexSans_300Light: 5,
    IBMPlexSans_300Light_Italic: 6,
    IBMPlexSans_400Regular: 7,
    IBMPlexSans_400Regular_Italic: 8,
    IBMPlexSans_500Medium: 9,
    IBMPlexSans_500Medium_Italic: 10,
    IBMPlexSans_600SemiBold: 11,
    IBMPlexSans_600SemiBold_Italic: 12,
    IBMPlexSans_700Bold: 13,
    IBMPlexSans_700Bold_Italic: 14,
  };
  const { getByTestId, toJSON, unmount } = render(
    <ThemeProvider
      defaultColorScheme="dark"
      colorScheme="dark"
      fontModules={[mockFont]}
      translations={{ en: { key: "hello" } }}
    >
      <Text
        testID="eval"
        _t="key"
        _tp={{ prop: "val", prop2: "val" }}
        backgroundColor="red"
        fontFamily="IBMPlexSans"
      />
    </ThemeProvider>
  );
  const { toJSON: toExpectedJson } = render(
    <RNText
      testID="eval"
      style={{
        backgroundColor: "red",
        fontFamily: "IBMPlexSans_400Regular",
        color: defaultDarkColorSchemeColors.default[0],
      }}
    >
      hello
    </RNText>
  );

  await waitFor(() => expect(toJSON()).toStrictEqual(toExpectedJson()));
  expect(getByTestId("eval").children).toStrictEqual(["hello"]);
  unmount();
});

it("should i18n Text and preserve other styles and remap font while wrapped in a view", async () => {
  const mockFont = {
    useFonts: jest.fn(),

    __metadata__: {},
    IBMPlexSans_100Thin: 1,
    IBMPlexSans_100Thin_Italic: 2,
    IBMPlexSans_200ExtraLight: 3,
    IBMPlexSans_200ExtraLight_Italic: 4,
    IBMPlexSans_300Light: 5,
    IBMPlexSans_300Light_Italic: 6,
    IBMPlexSans_400Regular: 7,
    IBMPlexSans_400Regular_Italic: 8,
    IBMPlexSans_500Medium: 9,
    IBMPlexSans_500Medium_Italic: 10,
    IBMPlexSans_600SemiBold: 11,
    IBMPlexSans_600SemiBold_Italic: 12,
    IBMPlexSans_700Bold: 13,
    IBMPlexSans_700Bold_Italic: 14,
  };
  const { getByTestId, toJSON, unmount } = render(
    <ThemeProvider
      defaultColorScheme="dark"
      colorScheme="dark"
      fontModules={[mockFont]}
      translations={{ en: { key: "hello" } }}
    >
      <View backgroundColor="red">
        <Text
          testID="eval"
          fontFamily="IBMPlexSans"
          _t="key"
          _tp={{ prop: "val", prop2: "val" }}
        />
      </View>
    </ThemeProvider>
  );
  const { toJSON: toExpectedJson } = render(
    <RNView style={{ backgroundColor: "red" }}>
      <RNText
        testID="eval"
        style={{
          color: defaultDarkColorSchemeColors.default[0],
          fontFamily: "IBMPlexSans_400Regular",
        }}
      >
        hello
      </RNText>
    </RNView>
  );

  await waitFor(() => expect(toJSON()).toStrictEqual(toExpectedJson()));
  expect(getByTestId("eval").children).toStrictEqual(["hello"]);
  unmount();
});

it("should provide a TextInput that is configured to match theme", async () => {
  const { getByTestId, unmount } = render(
    <ThemeProvider defaultColorScheme="dark" colorScheme="dark">
      <TextInput testID="input" />
    </ThemeProvider>
  );
  await waitFor(() =>
    expect(getByTestId("input").props.style).toStrictEqual({
      color: defaultDarkColorSchemeColors.input.default[0],
      backgroundColor: defaultDarkColorSchemeColors.input.default[1],
      borderColor: defaultDarkColorSchemeColors.input.border.default,
    })
  );
  expect(getByTestId("input").props.selectionColor).toStrictEqual(
    defaultDarkColorSchemeColors.input.selection
  );
  expect(getByTestId("input").props.placeholderTextColor).toStrictEqual(
    defaultDarkColorSchemeColors.input.placeholderText.default
  );
  expect(getByTestId("input").props.onBlur).toBeTruthy();
  expect(getByTestId("input").props.onFocus).toBeTruthy();

  fireEvent(getByTestId("input"), "focus");
  await waitFor(() =>
    expect(getByTestId("input").props.style).toStrictEqual({
      color: defaultDarkColorSchemeColors.input.enabled[0],
      backgroundColor: defaultDarkColorSchemeColors.input.enabled[1],
      borderColor: defaultDarkColorSchemeColors.input.border.enabled,
    })
  );
  fireEvent(getByTestId("input"), "blur");
  await waitFor(() =>
    expect(getByTestId("input").props.style).toStrictEqual({
      color: defaultDarkColorSchemeColors.input.default[0],
      backgroundColor: defaultDarkColorSchemeColors.input.default[1],
      borderColor: defaultDarkColorSchemeColors.input.border.default,
    })
  );
  unmount();
});

it("should provide a disabled TextInput that is configured to match theme", async () => {
  const { getByTestId, unmount } = render(
    <ThemeProvider defaultColorScheme="dark" colorScheme="dark">
      <TextInput testID="input" editable={false} />
    </ThemeProvider>
  );
  await waitFor(() =>
    expect(getByTestId("input").props.style).toStrictEqual({
      color: defaultDarkColorSchemeColors.input.disabled[0],
      backgroundColor: defaultDarkColorSchemeColors.input.disabled[1],
      borderColor: defaultDarkColorSchemeColors.input.border.disabled,
    })
  );
  expect(getByTestId("input").props.selectionColor).toStrictEqual(
    defaultDarkColorSchemeColors.input.selection
  );
  expect(getByTestId("input").props.placeholderTextColor).toStrictEqual(
    defaultDarkColorSchemeColors.input.placeholderText.disabled
  );
  expect(getByTestId("input").props.onBlur).toBeTruthy();
  expect(getByTestId("input").props.onFocus).toBeTruthy();

  fireEvent(getByTestId("input"), "focus");
  await waitFor(() =>
    expect(getByTestId("input").props.style).toStrictEqual({
      color: defaultDarkColorSchemeColors.input.disabled[0],
      backgroundColor: defaultDarkColorSchemeColors.input.disabled[1],
      borderColor: defaultDarkColorSchemeColors.input.border.disabled,
    })
  );
  fireEvent(getByTestId("input"), "blur");
  await waitFor(() =>
    expect(getByTestId("input").props.style).toStrictEqual({
      color: defaultDarkColorSchemeColors.input.disabled[0],
      backgroundColor: defaultDarkColorSchemeColors.input.disabled[1],
      borderColor: defaultDarkColorSchemeColors.input.border.disabled,
    })
  );
  unmount();
});
