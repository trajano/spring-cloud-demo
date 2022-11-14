import { defaultLightColorSchemeColors } from "../lib/native-unstyled/defaultLightColorSchemeColors";
import { lookupColor } from "./lookupColor";
describe("lookupColor", () => {
  it("should lookup by layer", () => {
    expect(lookupColor("primary:f", defaultLightColorSchemeColors)).toBe(
      defaultLightColorSchemeColors.layers.primary[0]
    );
  });
});
