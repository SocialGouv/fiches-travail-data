const fiches = require("../data/fiches-travail.json");

const UNDEFINED_KEY = "UNDEFINED";

const undefinedReferences = fiches.filter((fiche) => {
  const refErrors = fiche.sections.filter((section) => {
    if (!section.references) {
      console.log("no refs in " + fiche.title);
    }
    return section.references && UNDEFINED_KEY in section.references;
  });

  return refErrors.length > 0;
});

const printMissingRef = (fiche) => {
  console.log(`#### [${fiche.title}](${fiche.url})`);
  fiche.sections.forEach((section) => {
    if (section.references && UNDEFINED_KEY in section.references) {
      console.log(`- ${section.anchor}`);
      const fmt = section.references[UNDEFINED_KEY].articles.map(
        (ref) => ref.text
      );
      console.log(`> ${Array.from(new Set(fmt)).join(" / ")}`);
    }
  });
};

console.log(
  `### ${undefinedReferences.length}/${fiches.length} fiches aux références non résolues.`
);

undefinedReferences.map((fiche) => printMissingRef(fiche));
