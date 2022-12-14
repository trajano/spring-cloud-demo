import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { FontsProvider, useFonts } from './Fonts';
describe("replaceWithNativeFont", () => {
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
})