/*
Here we resolve the references :
Given an article (or a range) and its code (code du travail ou securite sociale), we search for its
actual id in the legi data corpus.
*/

import find from "unist-util-find";
import visit from "unist-util-visit";
import { codesFullNames, CODE_TRAVAIL } from "./referenceExtractor";
import { asInt, rangeMarkers } from "./utils";
import type { Reference, ResolvedReferences } from "./types";
// FIXME(rmelisson) : not sure to understand why import Node is causing issue
// eslint-disable-next-line import/no-unresolved
import type { Node } from "unist";

const codes = Object.values(codesFullNames).reduce<{ [id: string]: Node }>(
  (memo, { id }) => {
    const code = require(`@socialgouv/legi-data/data/${id}.json`) as Node;
    return { [id]: code, ...memo };
  },
  {}
);

type CodeArticle = {
  data: {
    num: string;
    id: string;
  };
};

const CODE_UNKNOWN = { id: "UNDEFINED", name: "code undefined" };
// shall we use "code du travail" by default ?
const DEFAULT_CODE = CODE_TRAVAIL;

function getLegiDataRange(
  code: Node,
  start: string,
  end: string
): CodeArticle[] {
  // check if num is numerically after start. also check LRD prefix
  const isAfterStart = (article: CodeArticle): boolean =>
    asInt(article.data.num) >= asInt(start) &&
    article.data.num.charAt(0) === start.charAt(0);

  // check if num is numerically before end. also check LRD prefix
  const isBeforeEnd = (article: CodeArticle): boolean =>
    asInt(article.data.num) <= asInt(end) &&
    article.data.num.charAt(0) === end.charAt(0);

  const articles: CodeArticle[] = [];
  visit(code, "article", (node) => {
    // using untyped tree representation, only option is to cast here
    const article = (node as unknown) as CodeArticle;
    if (isAfterStart(article) && isBeforeEnd(article)) {
      articles.push(article);
    }
  });
  return articles;
}

function formatStartEnd(startRaw: string, endRaw: string): [string, string] {
  // we need to identify special case where end ref is relative to start ref (e.g. L. 4733-9 à 11)
  // if there's nothing in common between end and start, we consider being in this special case

  const [startParts, endParts] = [startRaw, endRaw].map((a) =>
    a
      .replace(/\u2011/g, "-")
      .split("-")
      .map((p) => p.trim())
  );

  const letter = startParts[0].slice(0, 1);

  const startNums = Array.from(startParts);
  startNums[0] = startNums[0].replace(/\D/g, "");

  let endNums = Array.from(endParts);
  endNums[0] = endNums[0].replace(/\D/g, "");

  if (endNums.length == 1 && /^\d+$/.test(endParts[0])) {
    const endRange = endNums[0];
    endNums = Array.from(startNums.slice(0, -1));
    endNums.push(endRange);
  }

  return [letter + startNums.join("-"), letter + endNums.join("-")];
}

type UnravelledReference = {
  text: string;
  fmt: string | undefined;
  code: {
    name: string;
    id: string;
  };
};

// in case of a range (like "L. 4733-9 à 4733-11"), we try to identify
// the articles implicitly included within the range
function unravelRange(range: Reference): UnravelledReference[] {
  const mark = rangeMarkers.filter((a) => range.text.includes(a))[0];
  const rawParts = range.text.split(mark).map((p) => p.trim());

  const code = range.code ? range.code : DEFAULT_CODE;

  if (rawParts.length == 2 && code != CODE_UNKNOWN) {
    // objective is to identify starting and ending articles (with the legi data correct format)
    // then we can do a legi-data lookup
    const [startRaw, endRaw] = rawParts;
    const [startFMT, endFMT] = formatStartEnd(startRaw, endRaw);

    const unraveled = getLegiDataRange(codes[code.id], startFMT, endFMT).map(
      (a) => {
        const fmt = a.data !== undefined ? a.data.num : undefined;
        // keep original text for beginning and end
        let text;
        if (startFMT == fmt) {
          text = startRaw;
        } else if (endFMT == fmt) {
          text = endRaw;
        } else {
          text = range.text + " => " + fmt;
        }
        return { text, fmt, code };
      }
    );

    if (unraveled.length > 0) {
      return unraveled;
    }
  }

  // default in case of error, note that we explicitly set code to unknown
  // in order to identify range errors
  return range.text.split(mark).map((a) => {
    return { text: a.trim(), fmt: undefined, code: CODE_UNKNOWN };
  });
}

function formatArticle(article: string): string {
  // remove dot and spaces + remove non digit trailing chars + replace unicode dash ‑ to standard -
  return article
    .replace(".", "")
    .replace(" ", "")
    .replace(/\D*$/, "")
    .replace(/\u2011/g, "-");
}

function resolveReference(ref: Reference): Reference[] {
  let toResolve: Reference[] = [ref];
  if (rangeMarkers.filter((a) => ref.text.includes(a)).length != 0) {
    toResolve = unravelRange(ref).map((ref) => ref as Reference);
  }

  return toResolve.map((a) => {
    // use default code if no defined
    const code =
      a.code == CODE_UNKNOWN || a.code == undefined ? DEFAULT_CODE : a.code;

    if (!a.fmt) a.fmt = formatArticle(a.text);

    if (code && code != CODE_UNKNOWN) {
      // again we have to cast as nodes are generic
      const article = (find(
        codes[code.id],
        (node: Node) => node.type === "article" && node.data?.num === a.fmt
      ) as unknown) as CodeArticle;
      if (article) {
        a.id = article.data ? article.data.id : "";
        a.code = code;
      } else {
        // not found in code
        a.code = CODE_UNKNOWN;
      }
    }
    return a;
  });
}

function resolveReferences(refs: Reference[]): ResolvedReferences {
  const resolvedRefs = refs.map(resolveReference).flat();

  const deduplicated = resolvedRefs.reduce((acc, art) => {
    // drop duplicated references
    const existing = acc
      .map((a: Reference) => [a.text, a.fmt])
      .flat()
      .filter((v) => v);

    if (!(existing.includes(art.fmt) || existing.includes(art.text))) {
      acc.push(art);
    }
    return acc;
  }, new Array<Reference>());

  // group by code
  const grouped = deduplicated.reduce((acc, art) => {
    const { code, ...rawArticle } = art;
    const parsedCode = code ? code : CODE_UNKNOWN;

    if (!acc.has(parsedCode.id)) {
      acc.set(parsedCode.id, { name: parsedCode.name, articles: [] });
    }
    acc.get(parsedCode.id)?.articles.push(rawArticle);

    return acc;
  }, new Map<string, { name: string; articles: { text: string; fmt: string; id: string }[] }>());
  return Object.fromEntries(grouped);
}

export { resolveReferences };
