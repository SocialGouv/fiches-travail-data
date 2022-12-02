import { htmlPostParser } from "../postProcess";

describe("postProcess", () => {
  describe("htmlPostParser", () => {
    it("should replace picture tags with img tags", () => {
      const html = `<dt><!--[if IE]><img src='local/adapt-img/1024/10x/IMG/png/tableau-taux1.png?1667570454' width='1024' height='2532' alt='' class='adapt-img-ie ' /><![endif]--><!--[if !IE]><!--><picture class="adapt-img-wrapper c3054040965 png"><img src='data:image/svg+xml;base64,PiUlFHUTkvMW9KVWYvcm9BVmZZz4=' width='1024' height='2532' alt='' class='adapt-img adapt-img-multilayers blur' onmousedown='adaptImgFix(this)' /></picture><!--<![endif]--></dt>`
      const result = htmlPostParser(html);
      expect(result).toContain(
        "https://travail-emploi.gouv.fr/local/adapt-img/1024/10x/IMG/png/tableau-taux1.png?1667570454"
      );
    });
  });
});
