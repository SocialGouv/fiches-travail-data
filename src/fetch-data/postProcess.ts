import * as cheerio from "cheerio";

export const htmlPostParser = (html: string): string => {
  const $ = cheerio.load(html, null, false);
  const arrImgSrc: string[] = [];
  let currentIndex = 0;

  // https://travail-emploi.gouv.fr/emploi-et-insertion/accompagnement-des-mutations-economiques/activite-partielle-chomage-partiel/article/activite-partielle-chomage-partiel
  $("*")
    .contents()
    .each(function () {
      if (this.nodeType === 8) {
        const regex = /src=['"](.*?)['"]/;
        const result = regex.exec((this as any).nodeValue);
        if (result) {
          const src = result[0].slice(5, -1);
          if (src) arrImgSrc.push(src);
        }
      }
    });
  $("picture").replaceWith(function () {
    const src = arrImgSrc[currentIndex];

    if (src) {
      currentIndex++;
      return `<img src="https://travail-emploi.gouv.fr/${src}" style="width:100%;height:auto;"/>`;
    }

    return $(this).html();
  } as any);

  return $.html();
};
