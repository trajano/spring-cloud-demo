import { render } from '@testing-library/react-native';
import { Text } from "./components";
import { I18nProvider } from './I18n';

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