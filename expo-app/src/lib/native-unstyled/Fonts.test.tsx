import { act, render, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';
import { FontsProvider, useFonts } from './Fonts';
describe("replaceWithNativeFont", () => {
    beforeEach(() => { jest.useFakeTimers(); });
    it("should return empty", () => {
        function MyComponent() {
            const { replaceWithNativeFont } = useFonts();
            const style = replaceWithNativeFont({});
            return <View testID="blah" style={style} />
        }
        const { getByTestId } = render(<FontsProvider><MyComponent /></FontsProvider>)
        expect(getByTestId("blah").props.style).toBeFalsy();
    });

    it("should render fonts", () => {
        function MyComponent() {
            const { replaceWithNativeFont } = useFonts();
            const style = replaceWithNativeFont({ fontFamily: "something", fontWeight: "300" });
            return <View testID="blah" style={style} />
        }
        const { getByTestId } = render(<FontsProvider><MyComponent /></FontsProvider>)
        expect(getByTestId("blah").props.style).toStrictEqual({ fontFamily: "something", fontWeight: "300" });
    });

    it("should render fonts provided", () => {
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
        function MyComponent() {
            const { replaceWithNativeFont } = useFonts();
            const style = replaceWithNativeFont({ fontFamily: "IBMPlexSans", fontWeight: "300" });
            return <View testID="blah" style={style} />
        }

        const { getByTestId } = render(<FontsProvider fontModules={[mockFont]}><MyComponent /></FontsProvider>)
        act(() => { jest.runAllTicks() })
        expect(getByTestId("blah").props.style).toStrictEqual({ fontFamily: "IBMPlexSans_300Light" });
    });
})