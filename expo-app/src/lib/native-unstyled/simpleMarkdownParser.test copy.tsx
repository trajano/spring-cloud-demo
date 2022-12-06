/**
 * js
 */
import MarkdownIT from "markdown-it";
import Token from 'markdown-it/lib/token';
import { createElement, Fragment } from 'react';
import { Text as RNText } from 'react-native';

import { render } from '@testing-library/react-native';

type TextNode = {
    type: "text",
    parent?: FormatNode;
    isCode: boolean;
    content: string;
}
type FormatNode = {
    parent?: FormatNode;
    type: "format";
    format: "" | string;
    children: Node[];
}
type Node = TextNode | FormatNode;

function parseToTexts(s: string) {

    const markdownIt = new MarkdownIT();
    const tokens: Token[] = markdownIt.parseInline(s, null)[0].children || [];

    const tree: Node = {
        type: "format",
        format: "",
        children: []
    };
    let stackPtr: FormatNode = tree;
    for (const token of tokens) {
        const openMatchArray = token.type.match("(.+)_open$");
        const closeMatchArray = token.type.match("(.+)_close$")
        if (token.type === "text" && token.content !== "") {
            stackPtr.children.push({
                type: "text",
                isCode: false,
                content: token.content,
                parent: stackPtr,
            })
        } else if (token.type === "code_inline" && token.content !== "") {
            stackPtr.children.push({
                type: "text",
                isCode: true,
                content: token.content,
                parent: stackPtr,
            })
        } else if (openMatchArray) {
            const newNode: FormatNode = {
                type: "format",
                format: openMatchArray[1],
                children: [],
                parent: stackPtr,
            }
            stackPtr.children.push(newNode);
            stackPtr = newNode;
        } else if (closeMatchArray) {
            // verify
            stackPtr = stackPtr.parent!;
        } else if (token.type !== "text") {
            throw new Error("Unexpected token: " + JSON.stringify(token));
        }
    }

    function convertTreeToElements(node: Node, index?: number): JSX.Element {
        if (node.type === "text" && node.isCode) {
            return createElement(RNText, { key: `.${index}`, style: { fontFamily: 'mono' } }, node.content)
        } else if (node.type === "text") {
            return createElement(Fragment, { key: `.${index}` }, node.content)
        } else if (!node.parent && node.children.length === 1 && node.children[0].type === "text" && node.children[0].isCode) {
            // if root node with only one child element just return the child element and it is a text node and is code
            return createElement(RNText, { style: { fontFamily: 'mono' } }, node.children[0].content);
        } else if (!node.parent && node.children.length === 1 && node.children[0].type === "text") {
            // if root node with only one child element just return the child element and it is a text node
            return createElement(RNText, {}, node.children[0].content);
        } else if (!node.parent && node.children.length === 1) {
            // if root node with only one child element just return the child element
            return convertTreeToElements(node.children[0]);
        } else {
            const children = node.children.map((child, index) => convertTreeToElements(child, index))
            if (node.format === "em") {
                return createElement(RNText, { key: `.${index}`, style: { fontStyle: "italic" } }, children);
            } else if (node.format === "strong") {
                return createElement(RNText, { key: `.${index}`, style: { fontWeight: "bold" } }, children);
            } else {
                return createElement(RNText, { key: `.${index}` }, children);
            }
        }
    }

    return convertTreeToElements(tree);

}

describe("simpleMarkdownParser", () => {
    it("empty string", () => {
        const { toJSON } = render(parseToTexts("")!)
        const { toJSON: expectedToJSON } = render(<RNText></RNText>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("simple string", () => {
        const { toJSON } = render(parseToTexts("simple string")!)
        const { toJSON: expectedToJSON } = render(<RNText>simple string</RNText>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("italic", () => {
        const { toJSON } = render(parseToTexts("*italic*")!)
        const { toJSON: expectedToJSON } = render(<RNText style={{ fontStyle: "italic" }}>italic</RNText>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("bold", () => {
        const { toJSON } = render(parseToTexts("**bold**")!)
        const { toJSON: expectedToJSON } = render(<RNText style={{ fontWeight: "bold" }}>bold</RNText>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("bold-italic", () => {
        const { toJSON } = render(parseToTexts("***bold-italic***")!)
        const { toJSON: expectedToJSON } = render(<RNText style={{ fontStyle: "italic" }}><RNText style={{ fontWeight: "bold" }}>bold-italic</RNText></RNText>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })
    it("complex", () => {
        const { toJSON } = render(parseToTexts("foo **bold _italic_** foo adf *asdf*")!)
        const { toJSON: expectedToJSON } = render(<RNText>foo <RNText style={{ "fontWeight": "bold" }}>bold <RNText style={{ "fontStyle": "italic" }}>italic</RNText></RNText> foo adf <RNText style={{ "fontStyle": "italic" }}>asdf</RNText></RNText>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })

    it("complex with code", () => {
        const { toJSON } = render(parseToTexts("foo **bold _italic_** foo `adf` *asdf*")!)
        const { toJSON: expectedToJSON } = render(<RNText>foo <RNText style={{ "fontWeight": "bold" }}>bold <RNText style={{ "fontStyle": "italic" }}>italic</RNText></RNText> foo <RNText style={{ fontFamily: "mono" }}>adf</RNText> <RNText style={{ "fontStyle": "italic" }}>asdf</RNText></RNText>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })

    it("code", () => {
        const { toJSON } = render(parseToTexts("`code`")!)
        const { toJSON: expectedToJSON } = render(<RNText style={{ fontFamily: "mono" }}>code</RNText>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    })

})
