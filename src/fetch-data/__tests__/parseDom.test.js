import fs from "fs";
import { JSDOM } from "jsdom";
import path from "path";

const { parseDom } = require("../index");

const sample = fs.readFileSync(path.join(__dirname, "article.html")).toString();
const acd = fs
  .readFileSync(path.join(__dirname, "agents-chimiques-dangereux-acd.html"))
  .toString();

test("should parse HTML section", () => {
  const dom = new JSDOM(sample);
  const parsed = parseDom(dom);
  expect(parsed).toMatchSnapshot();
});

test("should remove whitespace in HTML section", () => {
  const dom = new JSDOM(acd);
  const parsed = parseDom(dom);
  expect(parsed).toMatchSnapshot();
  parsed.sections.forEach((section) => {
    expect(/\n/g.test(section.html)).toBe(false);
    expect(/\n/g.test(section.description)).toBe(false);
  });
});
