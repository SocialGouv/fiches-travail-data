import slugify from "@socialgouv/cdtn-slugify";
import { ParseError } from "got";

import { encode } from "../email";
import { extractReferences } from "./referenceExtractor";
import { resolveReferences } from "./referenceResolver";
import { JSDOM } from "jsdom";

const $$ = (node, selector) => Array.from(node.querySelectorAll(selector));
const $ = (node, selector) => node.querySelector(selector);

function unwrapEmail(data = "") {
  const [k, ...tokens] = Array.from(
    { length: data.length / 2 },
    (_, i) => i * 2
  ).map((val) => parseInt(data.slice(val, val + 2), 16));
  const rawValue = tokens.map((v) => String.fromCharCode(v ^ k)).join("");
  return encode(decodeURIComponent(escape(rawValue)));
}

const formatEmail = (node) => {
  const value = unwrapEmail(node.getAttribute("data-cfemail"));
  node.removeAttribute("data-cfemail");
  node.textContent = value;
};
const SRC_REGEX = /src=["']([^'"]*)["']/;

function getCleanSrc(src) {
  let [srcClean] = src.split("?");
  if (!srcClean.match(/^https?:\/\//)) {
    if (srcClean.slice(0, 1) !== "/") {
      srcClean = "/" + srcClean;
    }
    srcClean = `https://travail-emploi.gouv.fr${srcClean}`;
  }
  return srcClean;
}

const formatPicture = (node) => {
  let comment;
  node.parentElement.childNodes.forEach(function (childNode) {
    if (childNode.nodeName === "#comment" || childNode.nodeType === 8) {
      if (childNode.data.match(SRC_REGEX)) {
        comment = childNode;
      }
    }
  });

  if (comment) {
    const [, src = ""] = comment.data.match(SRC_REGEX);
    if (src.length) {
      const srcClean = getCleanSrc(src);
      node.parentNode.innerHTML = `<img src="${srcClean}" style="width:100%;height:auto;" />`;
      return;
    }
  }
  let image;
  node.childNodes.forEach(function (childNode) {
    if (childNode.nodeName === "IMG") {
      image = childNode;
    }
  });
  if (image) {
    node.replaceWith(image);
  }
};
const formatImage = (node) => {
  node.removeAttribute("onmousedown");
  if (node.getAttribute("src").indexOf("data:image") === -1) {
    node.removeAttribute("srcset");
    node.removeAttribute("sizes");

    let src = node.getAttribute("src");
    if (!src.match(/^https?:\/\//)) {
      const srcClean = getCleanSrc(src);
      node.setAttribute("src", srcClean);
    }
  }
};

const formatAnchor = (node) => {
  if (node.innerHTML.trim() === "") {
    node.remove();
    return;
  }
  if (node.getElementsByTagName("img").length) {
    node.classList.add("no-after");
  }
  let href = node.getAttribute("href");
  // remove ATTAg(...) on pdf link
  node.removeAttribute("onclick");
  if (!href) return;
  // unwrap link with href="javascript:"
  if (/^javascript:/.test(href)) {
    node.parentNode.innerHTML = node.textContent;
  }
  if (/email-protection/.test(href)) {
    const [, data = ""] = href.split("#");
    const value = unwrapEmail(data);
    node.setAttribute("href", `mailto:${value}`);
    return;
  }
  if (!href.match(/^https?:\/\//)) {
    if (href.slice(0, 1) !== "/") {
      href = "/" + href;
    }
    node.setAttribute("href", `https://travail-emploi.gouv.fr${href}`);
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "nofollow, noopener");
  }
};
const removeNode = (node) => {
  node.remove();
};
const flattenCsBlocs = (node) => {
  node.insertAdjacentHTML("afterend", node.innerHTML);
  node.parentNode.removeChild(node);
};

const getReferences = (text) => {
  // first we extract the tokens referencing articles
  const references = extractReferences(text);
  // then we try to resolve the actual articles ids using legi-data
  return resolveReferences(references);
};

export const textClean = (text, noNbsp = false) => {
  const regexStr = "\\n";
  return text
    .replace(
      new RegExp(noNbsp ? `(${regexStr}|&nbsp;)` : `(${regexStr})`, "g"),
      " "
    )
    .replace(/([.!?]+)(?![^<]*>)/g, "$1 ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
};

const duplicateContent = (sections, highlight) => {
  if (highlight) {
    return (
      sections.find((section) => highlight.text.includes(section.text)) !==
      undefined
    );
  }
  return false;
};

function parseHTMLSections(dom) {
  const document = dom.window.document;

  const mainContent = $(document, ".main-content");
  if (!mainContent) {
    throw new Error('No <div class="main-content"> found in the HTML content.');
  }

  const sections = [];

  const h2Tags = $$(mainContent, "h2");

  h2Tags.forEach((h2Tag) => {
    const section = {
      title: textClean(h2Tag.textContent, true) || "",
      html: "",
      text: "",
    };

    let nextSibling = h2Tag.nextElementSibling;
    if (!nextSibling) {
      nextSibling = h2Tag.parentElement
        ? h2Tag.parentElement.nextElementSibling
        : undefined;
      if (!nextSibling && h2Tag.parentElement) {
        nextSibling = h2Tag.parentElement.parentElement
          ? h2Tag.parentElement.parentElement.nextElementSibling
          : undefined;
      }
    }
    const sectionHtmlContent = [];
    const sectionTextContent = [];

    while (nextSibling && nextSibling.nodeName !== "H2") {
      sectionHtmlContent.push(textClean(nextSibling.outerHTML || "", true));
      sectionTextContent.push(textClean(nextSibling.textContent || "", true));
      nextSibling = nextSibling.nextElementSibling;
    }

    section.html = sectionHtmlContent.join("").trim();
    section.text = sectionTextContent.join("").trim();
    sections.push(section);
  });

  const cleanSections = sections.map((section) => ({
    ...section,
    // Sometimes, we have all the html in a section
    // We check a second times and delete HTML from the h2 found
    // (H2 should not be in a section)
    html: removeExtraH2(section.html),
  }));
  if (cleanSections.find((section) => section.html === "")) {
    return [
      {
        title: "Contenu",
        html: mainContent.innerHTML,
        text: mainContent.textContent,
      },
    ];
  }
  if (cleanSections) {
    return cleanSections;
  }
}

const removeExtraH2 = (html) => {
  const dom = new JSDOM(`<div>${html}</div>`);
  const document = dom.window.document;
  const mainDiv = $(document, "div");

  const firstH2 = $(mainDiv, "h2");

  if (firstH2) {
    let parent = firstH2.parentElement;
    let h2 = firstH2;
    while (parent.nextElementSibling) {
      parent.nextElementSibling.remove();
    }
    while (firstH2.nextElementSibling) {
      firstH2.nextElementSibling.remove();
    }
    h2.remove();
  }

  return textClean(mainDiv.innerHTML, true);
};

const parseHighlight = (dom) => {
  const document = dom.window.document;

  const mainContent = $(document, ".main-content");
  if (!mainContent) {
    throw new Error('No <div class="main-content"> found in the HTML content.');
  }

  const highlightHtmlContent = [];
  const highlightTextContent = [];

  let nextSibling = mainContent.firstElementChild;
  while (nextSibling && nextSibling.nodeName !== "H2") {
    highlightHtmlContent.push(textClean(nextSibling.outerHTML || "", true));
    highlightTextContent.push(textClean(nextSibling.textContent || "", true));
    nextSibling = nextSibling.nextSibling;
  }

  if (highlightHtmlContent.length > 0) {
    return {
      title: "",
      html: textClean(highlightHtmlContent.join("").trim(), true),
      text: highlightTextContent.join("").trim(),
    };
  }
  return undefined;
};

const getDate = (article) => {
  const firstParagraph = $(article, "p");

  let publicationAt = null;
  let updatedAt = null;

  if (!firstParagraph) {
    throw new Error("Can't find the updated date, first paragraph missing");
  }

  const spans = $$(firstParagraph, "span");
  spans.forEach((span) => {
    const textContent = span.textContent;
    if (textContent.includes("Publié le")) {
      publicationAt = textContent.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
    }
    if (textContent.includes("Mis à jour le")) {
      updatedAt = textContent.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
    }
  });

  if (updatedAt) {
    return updatedAt[0];
  }
  if (publicationAt) {
    return publicationAt[0];
  }
  throw new Error("Can't find the updated date in the first paragraph");
};

const populateSections = (sections) => {
  return sections.map((section) => ({
    anchor: slugify(section.title),
    description: section.text.slice(0, 200),
    html: section.html,
    references: getReferences(section.text),
    text: section.text,
    title: section.title,
  }));
};

export function parseDom(dom, id, url) {
  const article = $(dom.window.document, "article");
  if (!article) {
    throw new ParseError("no <article>");
  }
  if (!id) {
    throw new ParseError(`No id`);
  }
  $$(article, "a").forEach(formatAnchor);
  $$(article, "picture").forEach(formatPicture);
  $$(article, "[data-cfemail]").forEach(formatEmail);
  $$(article, ".cs_blocs").forEach(flattenCsBlocs);
  $$(article, "img").forEach(formatImage);

  $$(article, ".oembed-source").forEach(removeNode);

  let titleElement = $(article, "h1");
  if (!titleElement) {
    titleElement = $(article, "h2");
    if (!titleElement) {
      throw new ParseError("No <h1> or <h2> element");
    }
  }
  const title = textClean(titleElement.textContent, true);

  const date = getDate(article);
  let intro = $(article, ".fr-text--lead") || "";
  intro =
    intro &&
    textClean(intro.innerHTML, true).replace(
      /<script[^>]*>([\s\S]*?)<\/script>/g,
      ""
    );
  const description =
    $(dom.window.document, "meta[name=description]")?.getAttribute("content") ??
    "";

  let sections = parseHTMLSections(dom);

  const highlight = parseHighlight(dom);
  if (duplicateContent(sections, highlight)) {
    sections = [];
  }
  if (highlight) {
    sections.unshift(highlight);
  }

  if (sections.length === 0) {
    throw new ParseError(`No sections`);
  }

  return {
    date,
    description,
    intro,
    pubId: id,
    sections: populateSections(sections),
    title,
    url,
  };
}
