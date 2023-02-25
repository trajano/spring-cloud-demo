import "@testing-library/jest-native/extend-expect";
import { render, screen, waitFor } from "@testing-library/react-native";
import { Text as RNText, View as RNView } from "react-native";

import { ThemeProvider } from "./ThemeContext";
import { Text, View } from "./components";
import { defaultLightColorSchemeColors } from "./defaultColorSchemes/defaultLightColorSchemeColors";

it("should i18n Text with no context", () => {
  const { unmount } = render(
    <Text _t="key" testID="eval" _tp={{ prop: "val", prop2: "val" }} />
  );
  expect(screen.getByTestId("eval")).toHaveTextContent("");
  unmount();
});

it("should i18n Text", () => {
  const { unmount } = render(
    <ThemeProvider translations={{ en: { key: "hello" } }}>
      <Text testID="eval" _t="key" _tp={{ prop: "val", prop2: "val" }} />
    </ThemeProvider>
  );
  expect(screen.getByTestId("eval")).toHaveTextContent("hello");
  unmount();
});


it("should i18n Text and handle bold with the system font", () => {
  const { toJSON, unmount } = render(
    <ThemeProvider
      translations={{ en: { key: "hello" } }}
    >
      <Text
        testID="eval"
        _t="key"
        _tp={{ prop: "val", prop2: "val" }}
        bold
        backgroundColor="red"
      />
    </ThemeProvider>
  );
  const { toJSON: toExpectedJson } = render(
    <RNText
      testID="eval"
      style={{
        backgroundColor: "red",
        color: defaultLightColorSchemeColors.default[0],
        fontWeight: "bold",
      }}
    >
      hello
    </RNText>
  );

  expect(screen.getByTestId("eval")).toHaveTextContent("hello");
  expect(toJSON()).toStrictEqual(toExpectedJson());
  unmount();
});

it("should i18n Text and preserve other styles", () => {
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
  const { toJSON, unmount } = render(
    <ThemeProvider
      fontModules={[mockFont]}
      translations={{ en: { key: "hello" } }}
    >
      <Text
        testID="eval"
        _t="key"
        _tp={{ prop: "val", prop2: "val" }}
        backgroundColor="red"
      />
    </ThemeProvider>
  );
  const { toJSON: toExpectedJson } = render(
    <RNText
      testID="eval"
      style={{
        backgroundColor: "red",
        color: defaultLightColorSchemeColors.default[0],
      }}
    >
      hello
    </RNText>
  );

  expect(screen.getByTestId("eval")).toHaveTextContent("hello");
  expect(toJSON()).toStrictEqual(toExpectedJson());
  unmount();
});

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
  const { toJSON, unmount } = render(
    <ThemeProvider
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
        color: defaultLightColorSchemeColors.default[0],
      }}
    >
      hello
    </RNText>
  );

  expect(screen.getByTestId("eval")).toHaveTextContent("hello");
  await waitFor(() => expect(toJSON()).toStrictEqual(toExpectedJson()));
  unmount();
});

it("should i18n Text and preseve other styles and remap font while wrapped in a view", async () => {
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
  const { toJSON, unmount } = render(
    <ThemeProvider
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
          fontFamily: "IBMPlexSans_400Regular",
          color: defaultLightColorSchemeColors.default[0],
        }}
      >
        hello
      </RNText>
    </RNView>
  );

  expect(screen.getByTestId("eval")).toHaveTextContent("hello");
  await waitFor(() => expect(toJSON()).toStrictEqual(toExpectedJson()));
  unmount();
});
