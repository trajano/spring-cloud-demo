import "@testing-library/jest-native/extend-expect";
import { act, render, renderHook, screen } from "@testing-library/react-native";
import { FontSource } from "expo-font";
import { View } from "react-native";

import { ThemeProvider } from "./ThemeContext";
import { useReplaceWithNativeFontCallback } from "./replaceStyleWithNativeFont";
import { useExpoFonts } from "./useExpoFonts";

describe("useReplaceWithNativeFontCallback", () => {
  it("should return undefined", async () => {
    const { result } = renderHook(() => {
      const [loaded, loadedFonts] = useExpoFonts([]);
      return useReplaceWithNativeFontCallback(loaded, loadedFonts);
    }, {});

    const replaceWithNativeFont0 = result.current;
    expect(replaceWithNativeFont0({})).toBeUndefined();
    await act(() => Promise.resolve());
    const replaceWithNativeFont1 = result.current;
    expect(replaceWithNativeFont1({})).toBeUndefined();
  });
});
describe("replaceWithNativeFont", () => {
  it("should return empty", async () => {
    function MyComponent() {
      const [loaded, loadedFonts] = useExpoFonts([]);
      const replaceWithNativeFont = useReplaceWithNativeFontCallback(
        loaded,
        loadedFonts
      );
      const style = replaceWithNativeFont({});
      return <View testID="blah" style={style} />;
    }
    const { unmount } = render(
      <ThemeProvider>
        <MyComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId("blah")).not.toHaveProp("style");
    await act(() => Promise.resolve());
    expect(screen.getByTestId("blah")).not.toHaveProp("style");
    unmount();
  });

  it("should render fonts", async () => {
    function MyComponent() {
      const [loaded, loadedFonts] = useExpoFonts([]);
      const replaceWithNativeFont = useReplaceWithNativeFontCallback(
        loaded,
        loadedFonts
      );
      const style = replaceWithNativeFont({
        fontFamily: "something",
        fontWeight: "300",
      });
      return <View testID="blah" style={style} />;
    }
    const { unmount } = render(
      <ThemeProvider>
        <MyComponent />
      </ThemeProvider>
    );

    await act(() => Promise.resolve());
    expect(screen.getByTestId("blah").props.style).toStrictEqual({
      fontFamily: "something",
      fontWeight: "300",
    });
    unmount();
  });

  it("should render fonts with default colors", async () => {
    function MyComponent() {
      const [loaded, loadedFonts] = useExpoFonts([]);
      const replaceWithNativeFont = useReplaceWithNativeFontCallback(
        loaded,
        loadedFonts
      );
      const style = replaceWithNativeFont(
        { fontFamily: "something", fontWeight: "300" },
        { color: "pink" }
      );
      return <View testID="blah" style={style} />;
    }
    const { unmount } = render(
      <ThemeProvider>
        <MyComponent />
      </ThemeProvider>
    );

    await act(() => Promise.resolve());
    expect(screen.getByTestId("blah").props.style).toStrictEqual({
      color: "pink",
      fontFamily: "something",
      fontWeight: "300",
    });
    unmount();
  });

  it("should render fonts overriding default colors", async () => {
    function MyComponent() {
      const [loaded, loadedFonts] = useExpoFonts([]);
      const replaceWithNativeFont = useReplaceWithNativeFontCallback(
        loaded,
        loadedFonts
      );
      const style = replaceWithNativeFont(
        { fontFamily: "something", fontWeight: "300", color: "yellow" },
        { color: "pink" }
      );
      return <View testID="blah" style={style} />;
    }
    const { unmount } = render(
      <ThemeProvider>
        <MyComponent />
      </ThemeProvider>
    );

    await act(() => Promise.resolve());
    expect(screen.getByTestId("blah").props.style).toStrictEqual({
      color: "yellow",
      fontFamily: "something",
      fontWeight: "300",
    });
    unmount();
  });

  it("should render fonts provided", async () => {
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
    function MyComponent() {
      const [loaded, loadedFonts] = useExpoFonts([mockFont]);
      const replaceWithNativeFont = useReplaceWithNativeFontCallback(
        loaded,
        loadedFonts
      );
      const style = replaceWithNativeFont({
        fontFamily: "IBMPlexSans",
        fontWeight: "300",
      });
      return <View testID="blah" style={style} />;
    }

    const { unmount } = render(
      <ThemeProvider fontModules={[mockFont]}>
        <MyComponent />
      </ThemeProvider>
    );
    await act(() => Promise.resolve());
    expect(screen.getByTestId("blah").props.style).toStrictEqual({
      fontFamily: "IBMPlexSans_300Light",
    });
    unmount();
  });
});
