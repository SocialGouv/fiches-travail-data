import fs from "fs";
import {JSDOM} from "jsdom";
import path from "path";

import {parseDom} from "../parseDom";

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

const imgWithPictureHtml = fs
  .readFileSync(path.join(__dirname, "article-img-within-picture.html"))
  .toString();

const pictureHtmlSimple = fs
  .readFileSync(path.join(__dirname, "article-picture-simple.html"))
  .toString();

const articleError = fs
  .readFileSync(path.join(__dirname, "article-error.html"))
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
    expect(parsed.sections[0].html).toContain(
      '<img src="https://travail-emploi.gouv.fr/IMG/png/message-alerte3.png" width="189" height="91" alt="">'
    );
    expect(parsed.sections[3].html).toContain(
      '<img src="https://travail-emploi.gouv.fr/local/adapt-img/1024/10x/IMG/png/tableau-taux1.png" style="width:100%;height:auto;">'
    );
    expect(parsed).toMatchSnapshot();
  });

  test("should work with picture more complex", () => {
    const dom = new JSDOM(pictureHtml);
    const parsed = parseDom(dom, "article375435", "picture-html");
    expect(parsed.sections.length).toBe(4);
    expect(parsed.sections[0].html).toContain(
      "https://travail-emploi.gouv.fr/local/adapt-img/1024/10x/IMG/jpg/creche_vip.jpg"
    );
    expect(parsed).toMatchSnapshot();
  });

  test("should keep image within picture if it has a source", () => {
    const dom = new JSDOM(imgWithPictureHtml);
    const parsed = parseDom(dom, "article377333", "article-img-within-picture.html");
    expect(parsed.sections.length).toBe(1);
    expect(parsed.sections[0].html).toContain(
      `<img src="https://travail-emploi.gouv.fr/local/adapt-img/1000/10x/IMG/jpg/shutterstock_702099169_2_.jpg" width="1000" height="563" alt="" class="adapt-img">`
    );
    expect(parsed).toMatchSnapshot();
  });

  test("should work with error", () => {
    const dom = new JSDOM(articleError);
    const parsed = parseDom(dom, "article112747", "article-error");
    expect(parsed).toMatchSnapshot();
  });

  it.each`
    input                                       | expected
    ${"<button>hello</button>"}                 | ${""}
    ${'<div class="oembed-source">hello</div>'} | ${""}
    ${`<dt><!--[if IE]><img src='local/adapt-img/1024/10x/IMG/png/tableau-taux1.png?1667570454' width='1024' height='2532' alt='' class='adapt-img-ie ' /><![endif]--><!--[if !IE]><!--><picture class="adapt-img-wrapper c3054040965 png"><img src='data:image/svg+xml;base64,PiUlFHUTkvMW9KVWYvcm9BVmZZz4=' width='1024' height='2532' alt='' class='adapt-img adapt-img-multilayers blur' onmousedown='adaptImgFix(this)' /></picture><!--<![endif]--></dt>`} | ${"<dt><img src=\"https://travail-emploi.gouv.fr/local/adapt-img/1024/10x/IMG/png/tableau-taux1.png\" style=\"width:100%;height:auto;\"></dt>"}
    ${`<dl class="spip_document_432065 spip_documents spip_documents_center"><dt><!--[if IE]><img src='local/adapt-img/1024/10x/IMG/jpg/creche_vip.jpg?1669818837' width='849' height='565' alt='' class='adapt-img-ie ' /><![endif]--><!--[if !IE]><!--><picture class="adapt-img-wrapper c831727054 jpg"><img src="data:image/svg+xml;base64,Pz0g==" width="849" height="565" alt="" class="adapt-img adapt-img-multilayers blur"></picture><!--<![endif]--></dt></dl>`} | ${"<dl class=\"spip_document_432065 spip_documents spip_documents_center\"><dt><img src=\"https://travail-emploi.gouv.fr/local/adapt-img/1024/10x/IMG/jpg/creche_vip.jpg\" style=\"width:100%;height:auto;\"></dt></dl>"}
    ${`<dl class="spip_document_435034 spip_documents spip_documents_center"><dt><!--[if IE]><img src='local/adapt-img/1024/10x/IMG/jpg/shutterstock_702099169_2_.jpg?1669823553' width='1000' height='563' alt='' class='adapt-img-ie ' /><![endif]--><!--[if !IE]><!--><picture class="adapt-img-wrapper c208822612 jpg"><img src="data:image/svg+xml;base64,PHN2ZyB2aWV3Qm99zdmc+" width="1000" height="563" alt="" class="adapt-img adapt-img-multilayers blur"></picture><!--<![endif]--></dt></dl>`} | ${"<dl class=\"spip_document_435034 spip_documents spip_documents_center\"><dt><img src=\"https://travail-emploi.gouv.fr/local/adapt-img/1024/10x/IMG/jpg/shutterstock_702099169_2_.jpg\" style=\"width:100%;height:auto;\"></dt></dl>"}
    ${`<picture class="adapt-img-wrapper c831727054 jpg" style="background-image:url(data:image/svg+xml;base64,PHN22Zz4=)">`} | ${`<picture class="adapt-img-wrapper c831727054 jpg" style="background-image:url(data:image/svg+xml;base64,PHN22Zz4=)"></picture>`}
  `("$# should parse correctly", ({input, expected}) => {
    const dom = new JSDOM(`<meta property="article:modified_time" content="2022-08-02" /><main><h1>Hello</h1><div class="main-article__texte texte--editorial crayon article-texte-377828 "><h3></h3>${input}</div></main>`);
    const parsed = parseDom(dom, "id");
    expect(parsed.sections[0].html).toBe(expected);
  });
});
