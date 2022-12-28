import { render, waitFor } from "@testing-library/react-native";
import { Text as RNText, View as RNView } from "react-native";

import { ThemeProvider } from "./ThemeContext";
import { Text, View } from "./components";

it("should i18n Text with no context", () => {
  const { getByTestId, unmount } = render(
    <Text _t="key" testID="eval" _tp={{ prop: "val", prop2: "val" }} />
  );
  expect(getByTestId("eval").children).toHaveLength(0);
  unmount();
});

it("should i18n Text", () => {
  const { getByTestId, unmount } = render(
    <ThemeProvider translations={{ en: { key: "hello" } }}>
      <Text testID="eval" _t="key" _tp={{ prop: "val", prop2: "val" }} />
    </ThemeProvider>
  );
  expect(getByTestId("eval").children).toStrictEqual(["hello"]);
  unmount();
});

it("should i18n Text and preseve other styles", () => {
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
    <RNText testID="eval" style={{ backgroundColor: "red", color: "#000000" }}>
      hello
    </RNText>
  );

  expect(getByTestId("eval").children).toStrictEqual(["hello"]);
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
  const { getByTestId, toJSON, unmount } = render(
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
        color: "#000000",
      }}
    >
      hello
    </RNText>
  );

  expect(getByTestId("eval").children).toStrictEqual(["hello"]);
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
  const { getByTestId, toJSON, unmount } = render(
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
        style={{ fontFamily: "IBMPlexSans_400Regular", color: "#000000" }}
      >
        hello
      </RNText>
    </RNView>
  );

  expect(getByTestId("eval").children).toStrictEqual(["hello"]);
  await waitFor(() => expect(toJSON()).toStrictEqual(toExpectedJson()));
  unmount();
});
