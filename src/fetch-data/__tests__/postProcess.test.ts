import { htmlPostParser } from "../postProcess";

describe("postProcess", () => {
  describe("htmlPostParser", () => {
    it.each`
      input                                       | expected
      ${"<button>hello</button>"}                 | ${""}
      ${'<div class="oembed-source">hello</div>'} | ${""}
      ${`<dt><!--[if IE]><img src='local/adapt-img/1024/10x/IMG/png/tableau-taux1.png?1667570454' width='1024' height='2532' alt='' class='adapt-img-ie ' /><![endif]--><!--[if !IE]><!--><picture class="adapt-img-wrapper c3054040965 png"><img src='data:image/svg+xml;base64,PiUlFHUTkvMW9KVWYvcm9BVmZZz4=' width='1024' height='2532' alt='' class='adapt-img adapt-img-multilayers blur' onmousedown='adaptImgFix(this)' /></picture><!--<![endif]--></dt>`} | ${"<dt><!--[if IE]><img src='local/adapt-img/1024/10x/IMG/png/tableau-taux1.png?1667570454' width='1024' height='2532' alt='' class='adapt-img-ie ' /><![endif]--><!--[if !IE]><!--><img src=\"https://travail-emploi.gouv.fr/local/adapt-img/1024/10x/IMG/png/tableau-taux1.png?1667570454\" style=\"width:100%;height:auto;\"><!--<![endif]--></dt>"}
    `("should return $expected for $input", ({ input, expected }) => {
      expect(htmlPostParser(input)).toBe(expected);
    });
  });
});
