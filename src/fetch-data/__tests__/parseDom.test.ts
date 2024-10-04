import fs from "fs";
import { JSDOM } from "jsdom";
import path from "path";

import { parseDom } from "../parseDom";

const sample = fs.readFileSync(path.join(__dirname, "article.html")).toString();

const sampleNoSection = fs
  .readFileSync(path.join(__dirname, "article-no-section.html"))
  .toString();

const sampleSectionsNoId = fs
  .readFileSync(path.join(__dirname, "article-sections-no-id.html"))
  .toString();

const pictureHtml = fs
  .readFileSync(path.join(__dirname, "article-picture.html"))
  .toString();

const imgWithPictureHtml = fs
  .readFileSync(path.join(__dirname, "article-img-within-picture.html"))
  .toString();

const pictureHtmlSimple = fs
  .readFileSync(path.join(__dirname, "article-picture-simple.html"))
  .toString();

const videoHtml = fs
  .readFileSync(path.join(__dirname, "article-video.html"))
  .toString();

describe("parseDom", () => {
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
  });

  test("should parse HTML with intro section and 6 sections without id", () => {
    const dom = new JSDOM(sampleSectionsNoId);
    const parsed = parseDom(dom, "article112763", "url-with-sections-no-id");
    expect(parsed.sections.length).toBe(7);
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

  test("should work with picture", () => {
    const dom = new JSDOM(pictureHtmlSimple);
    const parsed = parseDom(dom, "article377828", "simple-picture-html");
    // console.log("parsed", JSON.stringify(parsed));
    expect(parsed.sections.length).toBe(5);
    expect(parsed.intro).toContain(
      '<img src="https://travail-emploi.gouv.fr/sites/travail-emploi/files/styles/w_1200/public/2024-08/logo-activite-partielle.jpg.webp" width="800" height="450" alt="Activité partielle" loading="lazy" typeof="foaf:Image" class="fr-fluid-img">'
    );
    expect(parsed.sections[2].html).toContain(
      '<img src="https://travail-emploi.gouv.fr/sites/travail-emploi/files/styles/w_1200/public/files-spip/png/ap_3.png.webp" width="450" height="187" alt="png/ap_3.png" loading="lazy" typeof="foaf:Image" class="fr-fluid-img">'
    );
    expect(parsed).toMatchSnapshot();
  });

  test("should work with picture more complex", () => {
    const dom = new JSDOM(pictureHtml);
    const parsed = parseDom(dom, "article375435", "picture-html");
    expect(parsed.sections.length).toBe(4);
    expect(parsed.intro).toContain(
      "https://travail-emploi.gouv.fr/sites/travail-emploi/files/styles/w_1200/public/files-spip/jpg/creche_vip.jpg.webp"
    );
    expect(parsed).toMatchSnapshot();
  });

  test("should keep image within picture if it has a source", () => {
    const dom = new JSDOM(imgWithPictureHtml);
    const parsed = parseDom(
      dom,
      "article377333",
      "article-img-within-picture.html"
    );
    expect(parsed.sections.length).toBe(1);
    expect(parsed.intro).toContain(
      `<img src="https://travail-emploi.gouv.fr/sites/travail-emploi/files/styles/w_1200/public/2024-05/Vignette-Guide-Op%C3%A9rations-de-modification-des-machines-.png.webp" width="800" height="500" alt="Guide technique relatif aux opérations de modification des machines ou des ensembles de machine en service" loading="lazy" typeof="foaf:Image" class="fr-fluid-img">`
    );
    expect(parsed).toMatchSnapshot();
  });
});

test("should parse correctly article with video", () => {
  const dom = new JSDOM(videoHtml);
  const parsed = parseDom(dom, "article100976", "article-video.html");
  expect(parsed.sections.length).toBe(7);
  expect(parsed).toMatchSnapshot();
});
