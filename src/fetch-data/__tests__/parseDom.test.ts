import fs from "fs";
import { JSDOM } from "jsdom";
import path from "path";

import { parseDom } from "../parseDom";

const sample = fs.readFileSync(path.join(__dirname, "article.html")).toString();

describe("parseDom", () => {
  test("should parse HTML section", () => {
    const dom = new JSDOM(sample);
    const parsed = parseDom(dom, "article375531", "url-sample");
    expect(parsed).toMatchSnapshot();
  });

  test("should throw if there is no main element", () => {
    const dom = new JSDOM("<html><body><h1>test</h1></body></html>");
    expect(() => {
      parseDom(dom, "http://nomain");
    }).toThrowError();
  });

  test("should throw if there is no h1 element", () => {
    const dom = new JSDOM("<html><body><main>test</main></body></html>");
    expect(() => {
      parseDom(dom, "noid", "http://nomain");
    }).toThrowError();
  });

  test("should throw if there is no id pass", () => {
    const dom = new JSDOM(
      `<html class="page_article"><body><main><h1>test</h1></main></body></html>`
    );
    expect(() => {
      parseDom(dom, null, "http://nomain");
    }).toThrowError();
  });

  test("should throw if there is no section detected", () => {
    const dom = new JSDOM(
      `<html class="page_article"><body><main><h1 class="article-titre-377050">test</h1></main></body></html>`
    );
    expect(() => {
      parseDom(dom, "http://nomain");
    }).toThrowError();
  });
});
