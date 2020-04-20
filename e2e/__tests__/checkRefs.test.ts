import "../helpers/expect.toBeDefinedReferences";

import fiches from "../../data/fiches-travail.json";

describe.each(fiches as any)("Fiche Travail", (fiche) => {
  describe.each(fiche.sections)(
    `[${fiche.title}](${fiche.url})`,
    (section) => {
      describe(`#${section.anchor}`, () => {
        const referencesEntries = Object.entries(section.references);
        if (!referencesEntries.length) {
          // NOTE(douglasduteil): avoid test.each empty Array error
          // Jest will fail if test.each is called with an empty Array of table data
          return;
        }
        // console.log(referencesEntries)
        test.each(referencesEntries)(
          `%s should be a defined reference`,
          (legiTextId, ref: object) => {
            expect({ id: legiTextId, ...ref }).toBeDefinedReferences();
          }
        );
      });
    }
  );
});
