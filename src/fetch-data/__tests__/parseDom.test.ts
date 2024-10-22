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

const pictureHtmlSimple = fs
  .readFileSync(path.join(__dirname, "article-picture-simple.html"))
  .toString();

const sampleWithUpdatedDate = fs
  .readFileSync(path.join(__dirname, "article-with-updated-date.html"))
  .toString();

const sampleWithoutUpdatedDate = fs
  .readFileSync(path.join(__dirname, "article-without-updated-date.html"))
  .toString();

const sampleHarcelementTravail = fs
  .readFileSync(path.join(__dirname, "harcelement-travail.html"))
  .toString();

const sampleDoubleVideo = fs
  .readFileSync(path.join(__dirname, "double-video.html"))
  .toString();

const sampleH2InListe = fs
  .readFileSync(path.join(__dirname, "h2-in-list.html"))
  .toString();

const sampleComplexHtml = fs
  .readFileSync(path.join(__dirname, "article-complex-html.html"))
  .toString();

const sampleLaDemission = fs
  .readFileSync(path.join(__dirname, "la-demission.html"))
  .toString();

describe("parseDom", () => {
  test("should parse HTML section", () => {
    const dom = new JSDOM(sample);
    const parsed = parseDom(dom, "article375531", "url-sample");
    expect(parsed.sections[0].title).toBe("");
    expect(parsed.sections[0].html).toMatchSnapshot();
    expect(parsed.sections[1].title).toBe(
      "La rupture conventionnelle en vidéo (Web série droit du travail)"
    );
    expect(parsed.sections[1].html).toMatchSnapshot();
    expect(parsed.sections[2].title).toBe(
      "En quoi consiste la rupture conventionnelle ?"
    );
    expect(parsed.sections[2].html).toMatchSnapshot();
    expect(parsed.sections[3].title).toBe("Quelle est la procédure ?");
    expect(parsed.sections[3].html).toMatchSnapshot();
    expect(parsed.sections[4].title).toBe(
      "Quel est le contenu de la convention ?"
    );
    expect(parsed.sections[4].html).toMatchSnapshot();
    expect(parsed.sections[5].title).toBe("Peut-on se rétracter ?");
    expect(parsed.sections[5].html).toMatchSnapshot();
    expect(parsed.sections[6].title).toBe(
      "En quoi consiste l'homologation de la convention ?"
    );
    expect(parsed.sections[6].html).toMatchSnapshot();
    expect(parsed.sections[7].title).toBe(
      "Les salariés « protégés » sont-ils concernés ?"
    );
    expect(parsed.sections[7].html).toMatchSnapshot();
    expect(parsed.sections[8].title).toBe(
      "Un recours juridictionnel est-il possible ?"
    );
    expect(parsed.sections[8].html).toMatchSnapshot();
    expect(parsed.sections[9].title).toBe(
      "Quelles sont les indemnités dues au salarié ?"
    );
    expect(parsed.sections[9].html).toMatchSnapshot();
    expect(parsed.sections[10].title).toBe("Textes de référence");
    expect(parsed.sections[10].html).toMatchSnapshot();
    expect(parsed.sections[11].title).toBe("Qui contacter");
    expect(parsed.sections[11].html).toMatchSnapshot();
    expect(parsed.sections[12].title).toBe("Articles associés");
    expect(parsed.sections[12].html).toMatchSnapshot();
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
    expect(parsed.sections.length).toBe(8);
    expect(parsed).toMatchSnapshot();
  });

  test("should remove whitespace in HTML section", () => {
    const dom = new JSDOM(sample);
    const parsed = parseDom(dom, "article200993", "url");
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
    expect(parsed.sections.length).toBe(5);
    expect(parsed.sections[0].html).not.toContain(
      '<img src="https://travail-emploi.gouv.fr/IMG/png/message-alerte3.png" width="189" height="91" alt="">'
    );
    expect(parsed.sections[2].html).toContain(
      '<img src="https://travail-emploi.gouv.fr/sites/travail-emploi/files/styles/w_1200/public/files-spip/png/ap_3.png.webp" width="450" height="187" alt="png/ap_3.png" loading="lazy" typeof="foaf:Image" class="fr-fluid-img">'
    );
  });

  test("should remove intro picture", () => {
    const dom = new JSDOM(pictureHtmlSimple);
    const parsed = parseDom(dom, "article377828", "simple-picture-html");
    expect(parsed.sections.length).toBe(5);
    expect(parsed.intro).not.toContain(
      '<img src="https://travail-emploi.gouv.fr/sites/travail-emploi/files/styles/w_1200/public/2024-08/logo-activite-partielle.jpg.webp" width="800" height="450" alt="Activité partielle" loading="lazy" typeof="foaf:Image" class="fr-fluid-img">'
    );
    expect(parsed.sections[2].html).toContain(
      '<img src="https://travail-emploi.gouv.fr/sites/travail-emploi/files/styles/w_1200/public/files-spip/png/ap_3.png.webp" width="450" height="187" alt="png/ap_3.png" loading="lazy" typeof="foaf:Image" class="fr-fluid-img">'
    );
    expect(parsed).toMatchSnapshot();
  });

  describe("Check the updated date", () => {
    test("should return the updated date if available", () => {
      const dom = new JSDOM(sampleWithUpdatedDate);
      const parsed = parseDom(dom, "article375531", "url-sample");
      expect(parsed.date).toBe("17/09/2024");
    });

    test("should return the publication date if updated date not available", () => {
      const dom = new JSDOM(sampleWithoutUpdatedDate);
      const parsed = parseDom(dom, "article375531", "url-sample");
      expect(parsed.date).toBe("12/03/2013");
    });
  });

  test("Web serie : Le harcèlement au travail", () => {
    const dom = new JSDOM(sampleHarcelementTravail);
    const parsed = parseDom(dom, "article375531", "url-sample");
    expect(parsed.title).toBe("Le harcèlement moral");
    expect(parsed.intro).toMatchSnapshot();
    expect(parsed.sections[0].title).toBe(
      "Le harcèlement moral (web série droit du travail)"
    );
    expect(parsed.sections[0].html).toMatchSnapshot();
    expect(parsed.sections[1].title).toBe(
      "Quelle est l'étendue de la protection des victimes et des témoins du harcèlement moral ?"
    );
    expect(parsed.sections[1].html).toMatchSnapshot();
  });

  test("Web serie : Double video", () => {
    const dom = new JSDOM(sampleDoubleVideo);
    const parsed = parseDom(dom, "article375531", "url-sample");
    expect(parsed.title).toBe("Le contrat de travail temporaire");
    expect(parsed.intro).toMatchSnapshot();
    expect(parsed.sections[0].title).toBe("");
    expect(parsed.sections[0].html).toMatchSnapshot();
    expect(parsed.sections[1].title).toBe(
      "Les entreprises de travail temporaire en vidéo (Web série droit du travail)"
    );
    expect(parsed.sections[1].html).toMatchSnapshot();
    expect(parsed.sections[2].title).toBe(
      "Les relations entre les parties en vidéo (Web série droit du travail)"
    );
    expect(parsed.sections[2].html).toMatchSnapshot();
    expect(parsed.sections[3].title).toBe("Qu'est-ce qu'une mission ?");
    expect(parsed.sections[3].html).toMatchSnapshot();
  });

  test("H2 in a list (ul)", () => {
    const dom = new JSDOM(sampleH2InListe);
    const parsed = parseDom(dom, "article375531", "url-sample");
    expect(parsed.title).toBe("La prévention des chutes de hauteur");

    expect(parsed.sections[3].title).toBe("Travaux en hauteur sur trémies");
    expect(parsed.sections[3].html).toMatchSnapshot();
  });

  test("Complex HTML failed to parse", () => {
    const dom = new JSDOM(sampleComplexHtml);
    const parsed = parseDom(dom, "article375531", "url-sample");
    expect(parsed.title).toBe("Les plans santé au travail (PST)");
    expect(parsed.sections).toHaveLength(1);
    expect(parsed.sections[0].title).toBe("");
    expect(parsed.sections[0].html).toMatchSnapshot();
  });

  test("Page avec accordéons", () => {
    const dom = new JSDOM(sampleLaDemission);
    const parsed = parseDom(dom, "article375531", "url-sample");
    expect(parsed.title).toBe("La démission");
    expect(parsed.sections).toHaveLength(11);
    expect(parsed.sections[0].title).toBe("");
    expect(parsed.sections[0].html).toBe(
      `<div class="fr-highlight"><h3>À savoir ! </h3><p>Le code du travail prévoit désormais une <strong>procédure particulière en cas d’abandon volontaire de son poste de travail par le salarié,</strong> au terme de laquelle ce dernier pourra être considéré comme ayant démissionné. </p></div><div></div>`
    );
  });
});
