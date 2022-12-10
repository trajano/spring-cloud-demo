import { render } from '@testing-library/react-native';
import { NativeText as Text } from './hoc';
import { I18nProvider } from './I18n';
import { markdownToTextElements } from './markdownToTextElements';

describe("markdownToTextElements", () => {
    it("empty string", () => {
        const { toJSON } = render(markdownToTextElements("")!)
        const { toJSON: expectedToJSON } = render(<I18nProvider><Text></Text></I18nProvider>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("simple string", () => {
        const { toJSON } = render(markdownToTextElements("simple string")!)
        const { toJSON: expectedToJSON } = render(<Text>simple string</Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("italic", () => {
        const { toJSON } = render(markdownToTextElements("*italic*")!)
        const { toJSON: expectedToJSON } = render(<Text style={{ fontStyle: "italic" }}>italic</Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("bold", () => {
        const { toJSON } = render(markdownToTextElements("**bold**")!)
        const { toJSON: expectedToJSON } = render(<Text style={{ fontWeight: "bold" }}>bold</Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("bold-italic", () => {
        const { toJSON } = render(markdownToTextElements("***bold-italic***")!)
        const { toJSON: expectedToJSON } = render(<Text style={{ fontStyle: "italic" }}><Text style={{ fontWeight: "bold" }}>bold-italic</Text></Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("complex", () => {
        const { toJSON } = render(markdownToTextElements("foo **bold _italic_** foo adf *asdf*")!)
        const { toJSON: expectedToJSON } = render(<Text>foo <Text style={{ "fontWeight": "bold" }}>bold <Text style={{ "fontStyle": "italic" }}>italic</Text></Text> foo adf <Text style={{ "fontStyle": "italic" }}>asdf</Text></Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })

    it("complex with code", () => {
        const { toJSON } = render(markdownToTextElements("foo **bold _italic_** foo `adf` *asdf*")!)
        const { toJSON: expectedToJSON } = render(<Text>foo <Text style={{ "fontWeight": "bold" }}>bold <Text style={{ "fontStyle": "italic" }}>italic</Text></Text> foo <Text style={{ fontFamily: "mono" }}>adf</Text> <Text style={{ "fontStyle": "italic" }}>asdf</Text></Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })

    it("code", () => {
        const { toJSON } = render(markdownToTextElements("`code`")!)
        const { toJSON: expectedToJSON } = render(<Text style={{ fontFamily: "mono" }}>code</Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })

})
