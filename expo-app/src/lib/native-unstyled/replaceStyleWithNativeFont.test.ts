import { replaceStyleWithNativeFont } from "./replaceStyleWithNativeFont";

const loadedFonts = {
  "IBMPlexSans:100:normal": "IBMPlexSans_100Thin",
  "IBMPlexSans:100:italic": "IBMPlexSans_100Thin_Italic",
  "IBMPlexSans:200:normal": "IBMPlexSans_200ExtraLight",
  "IBMPlexSans:200:italic": "IBMPlexSans_200ExtraLight_Italic",
  "IBMPlexSans:300:normal": "IBMPlexSans_300Light",
  "IBMPlexSans:300:italic": "IBMPlexSans_300Light_Italic",
  "IBMPlexSans:400:normal": "IBMPlexSans_400Regular",
  "IBMPlexSans:normal:normal": "IBMPlexSans_400Regular",
  "IBMPlexSans:400:italic": "IBMPlexSans_400Regular_Italic",
  "IBMPlexSans:normal:italic": "IBMPlexSans_400Regular_Italic",
  "IBMPlexSans:500:normal": "IBMPlexSans_500Medium",
  "IBMPlexSans:500:italic": "IBMPlexSans_500Medium_Italic",
  "IBMPlexSans:600:normal": "IBMPlexSans_600SemiBold",
  "IBMPlexSans:600:italic": "IBMPlexSans_600SemiBold_Italic",
  "IBMPlexSans:700:normal": "IBMPlexSans_700Bold",
  "IBMPlexSans:bold:normal": "IBMPlexSans_700Bold",
  "IBMPlexSans:700:italic": "IBMPlexSans_700Bold_Italic",
  "IBMPlexSans:bold:italic": "IBMPlexSans_700Bold_Italic",
};

it("full style", () => {
  const style = replaceStyleWithNativeFont(
    {
      fontFamily: "IBMPlexSans",
      fontWeight: "400",
      fontStyle: "normal",
    },
    loadedFonts
  );
  expect(style).toStrictEqual({ fontFamily: "IBMPlexSans_400Regular" });
});

it("no style", () => {
  const style = replaceStyleWithNativeFont(
    {
      fontFamily: "IBMPlexSans",
      fontWeight: "400",
    },
    loadedFonts
  );
  expect(style).toStrictEqual({ fontFamily: "IBMPlexSans_400Regular" });
});
it("no font", () => {
  const style = replaceStyleWithNativeFont(
    {
      backgroundColor: "red",
      flex: 1,
    },
    loadedFonts
  );
  expect(style).toStrictEqual({
    backgroundColor: "red",
    flex: 1,
  });
});

it("preserve other styles", () => {
  const style = replaceStyleWithNativeFont(
    {
      fontFamily: "IBMPlexSans",
      fontWeight: "400",
      fontStyle: "normal",
      fontSize: 30,
      aspectRatio: 32.23,
    },
    loadedFonts
  );
  expect(style).toStrictEqual({
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 30,
    aspectRatio: 32.23,
  });
});

it("just font face", () => {
  const style = replaceStyleWithNativeFont(
    {
      fontFamily: "IBMPlexSans",
      fontSize: 30,
    },
    loadedFonts
  );
  expect(style).toStrictEqual({
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 30,
  });
});

it("just bold should look up", () => {
  const style = replaceStyleWithNativeFont(
    {
      fontFamily: "IBMPlexSans",
      fontWeight: "bold",
      fontSize: 30,
    },
    loadedFonts
  );
  expect(style).toStrictEqual({
    fontFamily: "IBMPlexSans_700Bold",
    fontSize: 30,
  });
});

it("just bold and italic should look up", () => {
  const style = replaceStyleWithNativeFont(
    {
      fontFamily: "IBMPlexSans",
      fontWeight: "bold",
      fontStyle: "italic",
      fontSize: 30,
    },
    loadedFonts
  );
  expect(style).toStrictEqual({
    fontFamily: "IBMPlexSans_700Bold_Italic",
    fontSize: 30,
  });
});

it("just italic should look up", () => {
  const style = replaceStyleWithNativeFont(
    {
      fontFamily: "IBMPlexSans",
      fontStyle: "italic",
      fontSize: 30,
    },
    loadedFonts
  );
  expect(style).toStrictEqual({
    fontFamily: "IBMPlexSans_400Regular_Italic",
    fontSize: 30,
  });
});

it("just italic should look up", () => {
  const style = replaceStyleWithNativeFont(
    {
      fontFamily: "IBMPlexSans",
      fontWeight: "100",
      fontStyle: "italic",
      fontSize: 30,
    },
    loadedFonts
  );
  expect(style).toStrictEqual({
    fontFamily: "IBMPlexSans_100Thin_Italic",
    fontSize: 30,
  });
});
