import {htmlPostParser} from "../postProcess";

/* eslint-disable no-useless-escape */

describe("postProcess", () => {
  describe("htmlPostParser", () => {
    it.each`
      input                                       | expected
      ${"<button>hello</button>"}                 | ${""}
      ${'<div class="oembed-source">hello</div>'} | ${""}
      ${`<dt><!--[if IE]><img src='local/adapt-img/1024/10x/IMG/png/tableau-taux1.png?1667570454' width='1024' height='2532' alt='' class='adapt-img-ie ' /><![endif]--><!--[if !IE]><!--><picture class="adapt-img-wrapper c3054040965 png"><img src='data:image/svg+xml;base64,PiUlFHUTkvMW9KVWYvcm9BVmZZz4=' width='1024' height='2532' alt='' class='adapt-img adapt-img-multilayers blur' onmousedown='adaptImgFix(this)' /></picture><!--<![endif]--></dt>`} | ${"<dt><!--[if IE]><img src='local/adapt-img/1024/10x/IMG/png/tableau-taux1.png?1667570454' width='1024' height='2532' alt='' class='adapt-img-ie ' /><![endif]--><!--[if !IE]><!--><img src=\"https://travail-emploi.gouv.fr/local/adapt-img/1024/10x/IMG/png/tableau-taux1.png?1667570454\" style=\"width:100%;height:auto;\"><!--<![endif]--></dt>"}
      ${`<dl class=\"spip_document_432065 spip_documents spip_documents_center\"><dt><!--[if IE]><img src='local/adapt-img/1024/10x/IMG/jpg/creche_vip.jpg?1669818837' width='849' height='565' alt='' class='adapt-img-ie ' /><![endif]--><!--[if !IE]><!--><picture class=\"adapt-img-wrapper c831727054 jpg\"><img src=\"data:image/svg+xml;base64,Pz0g==\" width=\"849\" height=\"565\" alt=\"\" class=\"adapt-img adapt-img-multilayers blur\"></picture><!--<![endif]--></dt></dl>`} | ${"<dl class=\"spip_document_432065 spip_documents spip_documents_center\"><dt><!--[if IE]><img src='local/adapt-img/1024/10x/IMG/jpg/creche_vip.jpg?1669818837' width='849' height='565' alt='' class='adapt-img-ie ' /><![endif]--><!--[if !IE]><!--><img src=\"https://travail-emploi.gouv.fr/local/adapt-img/1024/10x/IMG/jpg/creche_vip.jpg?1669818837\" style=\"width:100%;height:auto;\"><!--<![endif]--></dt></dl>"}
      ${`<dl class=\"spip_document_435034 spip_documents spip_documents_center\"><dt><!--[if IE]><img src='local/adapt-img/1024/10x/IMG/jpg/shutterstock_702099169_2_.jpg?1669823553' width='1000' height='563' alt='' class='adapt-img-ie ' /><![endif]--><!--[if !IE]><!--><picture class=\"adapt-img-wrapper c208822612 jpg\"><img src=\"data:image/svg+xml;base64,PHN2ZyB2aWV3Qm99zdmc+\" width=\"1000\" height=\"563\" alt=\"\" class=\"adapt-img adapt-img-multilayers blur\"></picture><!--<![endif]--></dt></dl>`} | ${"<dl class=\"spip_document_435034 spip_documents spip_documents_center\"><dt><!--[if IE]><img src='local/adapt-img/1024/10x/IMG/jpg/shutterstock_702099169_2_.jpg?1669823553' width='1000' height='563' alt='' class='adapt-img-ie ' /><![endif]--><!--[if !IE]><!--><img src=\"https://travail-emploi.gouv.fr/local/adapt-img/1024/10x/IMG/jpg/shutterstock_702099169_2_.jpg?1669823553\" style=\"width:100%;height:auto;\"><!--<![endif]--></dt></dl>"}
      ${`<picture class="adapt-img-wrapper c831727054 jpg" style="background-image:url(data:image/svg+xml;base64,PHN22Zz4=)">`} | ${`<picture class="adapt-img-wrapper c831727054 jpg" style="background-image:url(data:image/svg+xml;base64,PHN22Zz4=)"></picture>`}
    `("should return $expected for $input", ({input, expected}) => {
      expect(htmlPostParser(input)).toBe(expected);
    });
  });
});
