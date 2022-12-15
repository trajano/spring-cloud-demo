import { render } from '@testing-library/react-native';
import { Text } from '../native-unstyled';
import { inlineMarkdownToTextElements } from './markdownToTextElements';

describe("markdownToTextElements", () => {

    it("empty string", () => {
        const { toJSON: expectedToJSON } = render(<Text></Text>);
        const { toJSON } = render(inlineMarkdownToTextElements("")!)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("simple string", () => {
        const { toJSON } = render(inlineMarkdownToTextElements("simple string")!)
        const { toJSON: expectedToJSON } = render(<Text>simple string</Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("italic", () => {
        const { toJSON } = render(inlineMarkdownToTextElements("*italic*")!)
        const { toJSON: expectedToJSON } = render(<Text style={{ fontStyle: "italic" }}>italic</Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("bold", () => {
        const { toJSON } = render(inlineMarkdownToTextElements("**bold**")!)
        const { toJSON: expectedToJSON } = render(<Text style={{ fontWeight: "bold" }}>bold</Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("bold-italic", () => {
        const { toJSON } = render(inlineMarkdownToTextElements("***bold-italic***")!)
        const { toJSON: expectedToJSON } = render(<Text style={{ fontStyle: "italic" }}><Text style={{ fontWeight: "bold" }}>bold-italic</Text></Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("complex", () => {
        const { toJSON } = render(inlineMarkdownToTextElements("foo **bold _italic_** foo adf *asdf*")!)
        const { toJSON: expectedToJSON } = render(<Text>foo <Text style={{ "fontWeight": "bold" }}>bold <Text style={{ "fontStyle": "italic" }}>italic</Text></Text> foo adf <Text style={{ "fontStyle": "italic" }}>asdf</Text></Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })

    it("complex with code", () => {
        const { toJSON } = render(inlineMarkdownToTextElements("foo **bold _italic_** foo `adf` *asdf*")!)
        const { toJSON: expectedToJSON } = render(<Text>foo <Text style={{ "fontWeight": "bold" }}>bold <Text style={{ "fontStyle": "italic" }}>italic</Text></Text> foo <Text style={{ fontFamily: "mono" }}>adf</Text> <Text style={{ "fontStyle": "italic" }}>asdf</Text></Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })

    it("code", () => {
        const { toJSON } = render(inlineMarkdownToTextElements("`code`")!)
        const { toJSON: expectedToJSON } = render(<Text style={{ fontFamily: "mono" }}>code</Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })

})
