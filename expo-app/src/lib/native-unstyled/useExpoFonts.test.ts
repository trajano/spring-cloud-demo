import { FontAwesome } from "@expo/vector-icons";
import * as NotoSans from "@expo-google-fonts/noto-sans";
import * as NotoSansMono from "@expo-google-fonts/noto-sans-mono";
import { act, renderHook } from "@testing-library/react-native";

import { useExpoFonts } from "./useExpoFonts";
it("should work", async () => {
  const { result, unmount } = renderHook(
    ({ fontModules }) => useExpoFonts(fontModules),
    {
      initialProps: {
        fontModules: [NotoSans, NotoSansMono, FontAwesome.font],
      },
    }
  );
  await act(() => Promise.resolve());
  expect(result.current).toStrictEqual([
    true,
    {
      "NotoSans:100:italic": "NotoSans_100Thin_Italic",
      "NotoSans:100:normal": "NotoSans_100Thin",
      "NotoSans:200:italic": "NotoSans_200ExtraLight_Italic",
      "NotoSans:200:normal": "NotoSans_200ExtraLight",
      "NotoSans:300:italic": "NotoSans_300Light_Italic",
      "NotoSans:300:normal": "NotoSans_300Light",
      "NotoSans:400:normal": "NotoSans_400Regular",
      "NotoSans:normal:normal": "NotoSans_400Regular",
      "NotoSans:400:italic": "NotoSans_400Regular_Italic",
      "NotoSans:normal:italic": "NotoSans_400Regular_Italic",
      "NotoSans:500:italic": "NotoSans_500Medium_Italic",
      "NotoSans:500:normal": "NotoSans_500Medium",
      "NotoSans:600:italic": "NotoSans_600SemiBold_Italic",
      "NotoSans:600:normal": "NotoSans_600SemiBold",
      "NotoSans:700:normal": "NotoSans_700Bold",
      "NotoSans:bold:normal": "NotoSans_700Bold",
      "NotoSans:700:italic": "NotoSans_700Bold_Italic",
      "NotoSans:bold:italic": "NotoSans_700Bold_Italic",
      "NotoSans:800:italic": "NotoSans_800ExtraBold_Italic",
      "NotoSans:800:normal": "NotoSans_800ExtraBold",
      "NotoSans:900:italic": "NotoSans_900Black_Italic",
      "NotoSans:900:normal": "NotoSans_900Black",
      "NotoSansMono:100:normal": "NotoSansMono_100Thin",
      "NotoSansMono:200:normal": "NotoSansMono_200ExtraLight",
      "NotoSansMono:300:normal": "NotoSansMono_300Light",
      "NotoSansMono:400:normal": "NotoSansMono_400Regular",
      "NotoSansMono:normal:normal": "NotoSansMono_400Regular",
      "NotoSansMono:500:normal": "NotoSansMono_500Medium",
      "NotoSansMono:600:normal": "NotoSansMono_600SemiBold",
      "NotoSansMono:700:normal": "NotoSansMono_700Bold",
      "NotoSansMono:bold:normal": "NotoSansMono_700Bold",
      "NotoSansMono:800:normal": "NotoSansMono_800ExtraBold",
      "NotoSansMono:900:normal": "NotoSansMono_900Black",
      "FontAwesome:normal:normal": "FontAwesome",
    },
  ]);
  unmount();
});
