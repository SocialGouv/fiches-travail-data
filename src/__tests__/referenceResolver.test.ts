import { resolveReferences } from "../referenceResolver";
import { extractReferences } from "../referenceExtractor";
import { Reference } from "../types";

test("should resolve les articles L. 2313‑8 et R. 2313-3 à R. 2313-6 du code du travail ainsi que le L. 1251-18", () => {
  expect(
    resolveReferences([
      {
        code: {
          id: "LEGITEXT000006072050",
          name: "code du travail",
        },
        text: "L. 2313‑8",
      },
      {
        code: {
          id: "LEGITEXT000006072050",
          name: "code du travail",
        },
        text: "R. 2313-3 à R. 2313-6",
      },
      {
        code: undefined,
        text: "L. 1251-18",
      },
    ] as Reference[])
  ).toMatchSnapshot();
});

test("should resolve L. 1251-23xx du code du travail", () => {
  expect(
    resolveReferences([
      {
        code: {
          id: "LEGITEXT000006072050",
          name: "code du travail",
        },
        text: "L. 1251-21 à L. 1251-23xx",
      },
    ] as Reference[])
  ).toMatchSnapshot();
});

test.each([
  "L. 1251-21 à L. 1251-23xx du code du travail",
  "L. 1233‑34 à L. 1233-35-1 du code du travail",
  "L. 2312-72 à 2312-77 du code du travail",
  "L. 2312-72 à 2312-77 du code de l'éducation",
  "D. 5132-9 à D. 5132-10-4 du code du travail",
  "D. 5132-9 à D. 5132-10-4",
  "L. 2315-38 à 40 du code du travail",
  "L. 351-1 à L. 351-5 du code de la sécurité sociale",
])('should resolve range "%s"', (range) => {
  const extractedRefs = extractReferences(range);
  const resolvedRefs = resolveReferences(extractedRefs);

  expect(resolvedRefs).toMatchSnapshot();
});
