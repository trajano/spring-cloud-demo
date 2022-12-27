import MarkdownIT from "markdown-it";
import Token from "markdown-it/lib/token";
import { createElement, Fragment } from "react";
import { Text } from "react-native";

import { withReplacedWithNativeFonts } from "./withReplacedWithNativeFonts";

type TextNode = {
  type: "text";
  parent?: FormatNode;
  isCode: boolean;
  content: string;
};
type FormatNode = {
  parent?: FormatNode;
  type: "format";
  format: "" | string;
  children: Node[];
};
type Node = TextNode | FormatNode;

/**
 * This uses React Native Text with the withReplacedWithNativeFonts HoC so that
 * it will handle custom fonts.
 */
const FontSubsitutedText = withReplacedWithNativeFonts(Text);

/**
 * Converts a limitted markdown string into text components.  The input is limited to
 * be a single line (no block support), bold and italic only.
 * @param s markdown string.
 * @param markdownIt parser.  If not specified, one will be provided.
 * @returns
 */
export function inlineMarkdownToTextElements(
  s: string,
  markdownIt: MarkdownIT = new MarkdownIT()
): JSX.Element {
  const tokens: Token[] = markdownIt.parseInline(s, null)[0].children || [];

  const tree: Node = {
    type: "format",
    format: "",
    children: [],
  };
  let stackPtr: FormatNode = tree;
  for (const token of tokens) {
    const openMatchArray = token.type.match("(.+)_open$");
    const closeMatchArray = token.type.match("(.+)_close$");
    if (token.type === "text" && token.content !== "") {
      stackPtr.children.push({
        type: "text",
        isCode: false,
        content: token.content,
        parent: stackPtr,
      });
    } else if (token.type === "code_inline" && token.content !== "") {
      stackPtr.children.push({
        type: "text",
        isCode: true,
        content: token.content,
        parent: stackPtr,
      });
    } else if (openMatchArray) {
      const newNode: FormatNode = {
        type: "format",
        format: openMatchArray[1],
        children: [],
        parent: stackPtr,
      };
      stackPtr.children.push(newNode);
      stackPtr = newNode;
    } else if (closeMatchArray) {
      // verify
      stackPtr = stackPtr.parent!;
    } else if (__DEV__ && token.type !== "text") {
      throw new Error("Unexpected token: " + JSON.stringify(token));
    }
  }

  function convertTreeToElements(node: Node, index?: number): JSX.Element {
    if (node.type === "text" && node.isCode) {
      return createElement(
        FontSubsitutedText,
        { key: `.${index}`, style: { fontFamily: "mono" } },
        node.content
      );
    } else if (node.type === "text") {
      return createElement(Fragment, { key: `.${index}` }, node.content);
    } else if (
      !node.parent &&
      node.children.length === 1 &&
      node.children[0].type === "text" &&
      node.children[0].isCode
    ) {
      // if root node with only one child element just return the child element and it is a text node and is code
      return createElement(
        FontSubsitutedText,
        { style: { fontFamily: "mono" } },
        node.children[0].content
      );
    } else if (
      !node.parent &&
      node.children.length === 1 &&
      node.children[0].type === "text"
    ) {
      // if root node with only one child element just return the child element and it is a text node
      return createElement(FontSubsitutedText, {}, node.children[0].content);
    } else if (!node.parent && node.children.length === 1) {
      // if root node with only one child element just return the child element
      return convertTreeToElements(node.children[0]);
    } else {
      const children = node.children.map((child, childIndex) =>
        convertTreeToElements(child, childIndex)
      );
      if (node.format === "em") {
        return createElement(
          FontSubsitutedText,
          { key: `.${index}`, style: { fontStyle: "italic" } },
          children
        );
      } else if (node.format === "strong") {
        return createElement(
          FontSubsitutedText,
          { key: `.${index}`, style: { fontWeight: "bold" } },
          children
        );
      } else {
        return createElement(
          FontSubsitutedText,
          { key: `.${index}` },
          children
        );
      }
    }
  }

  return convertTreeToElements(tree);
}
