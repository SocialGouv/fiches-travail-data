import fs from "fs";
import { JSDOM } from "jsdom";
import path from "path";

const { parseDom } = require("../index");

const sample = fs.readFileSync(path.join(__dirname, "article.html")).toString();

test("should parse HTML section", () => {
  const dom = new JSDOM(sample);
  const parsed = parseDom(dom);
  expect(parsed).toMatchSnapshot();
});
