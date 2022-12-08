import fs from "fs";
import { JSDOM } from "jsdom";
import path from "path";

const { parseDom } = require("../parseDom");

const sample = fs.readFileSync(path.join(__dirname, "article.html")).toString();

const sampleNoSection = fs
  .readFileSync(path.join(__dirname, "article-no-section.html"))
  .toString();

const sampleSectionsWithId = fs
  .readFileSync(path.join(__dirname, "article-sections-with-id.html"))
  .toString();

const sampleSectionsNoId = fs
  .readFileSync(path.join(__dirname, "article-sections-no-id.html"))
  .toString();

const acd = fs
  .readFileSync(path.join(__dirname, "agents-chimiques-dangereux-acd.html"))
  .toString();

const pictureHtml = fs
  .readFileSync(path.join(__dirname, "article-picture.html"))
  .toString();

const pictureHtmlSimple = fs
  .readFileSync(path.join(__dirname, "article-picture-simple.html"))
  .toString();


test("should parse HTML section", () => {
  const dom = new JSDOM(sample);
  const parsed = parseDom(dom, "article375531", "url-sample");
  expect(parsed).toMatchSnapshot();
});

test("should parse HTML with no section", () => {
  const dom = new JSDOM(sampleNoSection);
  const parsed = parseDom(dom, "article377849", "url-no-section");
  expect(parsed).toMatchSnapshot();
  expect(parsed.sections.length).toBe(1);
  expect(parsed.sections[0].anchor).toBe("");
});

test("should parse HTML with 4 sections with id", () => {
  const dom = new JSDOM(sampleSectionsWithId);
  const parsed = parseDom(dom, "article376806", "url-with-sections");
  expect(parsed).toMatchSnapshot();
  expect(parsed.sections.length).toBe(4);
  parsed.sections.forEach((section) => {
    expect(section.anchor).toBeTruthy();
  });
});

test("should parse HTML with intro section and 6 sections without id", () => {
  const dom = new JSDOM(sampleSectionsNoId);
  const parsed = parseDom(dom, "article112763", "url-with-sections-no-id");
  expect(parsed).toMatchSnapshot();
  expect(parsed.sections.length).toBe(7);
});

test("should remove whitespace in HTML section", () => {
  const dom = new JSDOM(acd);
  const parsed = parseDom(dom, "article200993", "url-acd");
  expect(parsed).toMatchSnapshot();
  parsed.sections.forEach((section) => {
    expect(/\n/g.test(section.html)).toBe(false);
    expect(/\n/g.test(section.description)).toBe(false);
  });
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

test("should work with picture", () => {
  const dom = new JSDOM(pictureHtmlSimple);
  const parsed = parseDom(dom, "article377828", "simple-picture-html");
  expect(parsed.sections.length).toBe(4);
  expect(JSON.stringify(parsed)).toContain("https://travail-emploi.gouv.fr/local/adapt-img/1024/10x/IMG/png/tableau-taux1.png?1667570454");
  expect(parsed).toMatchSnapshot();
});

test("should work with picture more complex", () => {
  const dom = new JSDOM(pictureHtml);
  const parsed = parseDom(dom, "article375435", "picture-html");
  expect(parsed.sections.length).toBe(4);
  expect(JSON.stringify(parsed)).toContain("https://travail-emploi.gouv.fr/local/adapt-img/1024/10x/IMG/jpg/creche_vip.jpg?1669818837");
  expect(parsed).toMatchSnapshot();
});
