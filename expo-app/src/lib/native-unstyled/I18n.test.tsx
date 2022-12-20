import { render, waitFor } from '@testing-library/react-native';
import { Text } from "./components";
import { Text as RNText } from "react-native";
import { I18nProvider } from './I18n';
import { FontsProvider } from './Fonts';

it("should i18n Text with no context", () => {

    const { getByTestId } = render(<Text _t="key" testID="eval" _tp={{ prop: "val", prop2: "val" }} />)
    expect(getByTestId("eval").children).toHaveLength(0);

})

it("should i18n Text", () => {

    const { getByTestId } = render((
        <I18nProvider translations={{ "en": { key: "hello" } }}>
            <Text testID="eval" _t="key" _tp={{ prop: "val", prop2: "val" }} />
        </I18nProvider>))
    expect(getByTestId("eval").children).toStrictEqual(["hello"]);

})

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
        IBMPlexSans_700Bold_Italic: 14

    }
    const { getByTestId, toJSON } = render((
        <FontsProvider fontModules={[mockFont]}><I18nProvider translations={{ "en": { key: "hello" } }}>
            <Text testID="eval" _t="key" _tp={{ prop: "val", prop2: "val" }} backgroundColor="red" />
        </I18nProvider></FontsProvider>))
    const { toJSON: toExpectedJson } = render(<RNText testID="eval" style={{ backgroundColor: "red" }}>hello</RNText>);

    expect(getByTestId("eval").children).toStrictEqual(["hello"]);
    expect(toJSON()).toStrictEqual(toExpectedJson());

})

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
        IBMPlexSans_700Bold_Italic: 14

    }
    const { getByTestId, toJSON } = render((
        <FontsProvider fontModules={[mockFont]}><I18nProvider translations={{ "en": { key: "hello" } }}>
            <Text testID="eval" _t="key" _tp={{ prop: "val", prop2: "val" }} backgroundColor="red" fontFamily="IBMPlexSans" />
        </I18nProvider></FontsProvider>))
    const { toJSON: toExpectedJson } = render(<RNText testID="eval" style={{ backgroundColor: "red", fontFamily: 'IBMPlexSans_400Regular' }}>hello</RNText>);

    expect(getByTestId("eval").children).toStrictEqual(["hello"]);
    await waitFor(() => expect(toJSON()).toStrictEqual(toExpectedJson()));

})