import slugify from "@socialgouv/cdtn-slugify";
import { ParseError } from "got";

import { encode } from "../email";
import { extractReferences } from "./referenceExtractor";
import { resolveReferences } from "./referenceResolver";

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

const textClean = (text, noNbsp = false) => {
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

const titleTags = ["h2", "h3", "h4", "h5"];

const getSections = (
  article,
  children,
  sections = [
    {
      anchor: "",
      description: "",
      html: "",
      references: {},
      text: "",
      title: "",
    },
  ],
  fromDiv = false
) => {
  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    const lastSection = sections[sections.length - 1];
    if (
      !fromDiv &&
      titleTags.indexOf(el.tagName.toLowerCase()) !== -1 &&
      el.textContent.trim() !== ""
    ) {
      const text = textClean(lastSection.text, true);
      lastSection.html = textClean(lastSection.html);
      lastSection.description = text.slice(0, 200).trim();
      lastSection.text = text;
      lastSection.references = getReferences(text);
      sections.push({
        anchor:
          el.getAttribute("id") || slugify(textClean(el.textContent, true)),
        description: "",
        html: "",
        references: {},
        text: "",
        title: textClean(el.textContent, true),
      });
    } else if (
      ["section", "article", "div"].indexOf(el.tagName.toLowerCase()) !== -1
    ) {
      if (el.tagName === "DIV") {
        lastSection.html += el.outerHTML;
        lastSection.text += el.textContent;
      }
      sections = getSections(
        article,
        el.children,
        sections,
        el.tagName === "DIV"
      );
    } else if (
      lastSection &&
      titleTags.indexOf(el.tagName.toLowerCase()) === -1
    ) {
      lastSection.html += el.outerHTML;
      lastSection.text += el.textContent;
    }
  }
  return sections;
};

export function parseDom(dom, id, url) {
  const article = $(dom.window.document, "main");
  if (!article) {
    throw new ParseError("no <main>");
  }
  if (!id) {
    throw new ParseError(`No id`);
  }
  $$(article, "a").forEach(formatAnchor);
  $$(article, "picture").forEach(formatPicture);
  $$(article, "[data-cfemail]").forEach(formatEmail);
  $$(article, ".cs_blocs").forEach(flattenCsBlocs);
  $$(article, "img").forEach(formatImage);

  $$(article, "style").forEach(removeNode);
  $$(article, "button").forEach(removeNode);
  $$(article, ".oembed-source").forEach(removeNode);

  let titleElement = $(article, "h1");
  if (!titleElement) {
    titleElement = $(article, "h2");
    if (!titleElement) {
      throw new ParseError("No <h1> or <h2> element");
    }
  }
  const title = textClean(titleElement.textContent, true);

  const dateRaw =
    $(dom.window.document, "time:nth-child(1)") ||
    $(dom.window.document, "time:first-child");
  const date = dateRaw?.textContent;
  const introImg = $(dom.window.document, "article img")?.outerHTML;
  let intro = $(article, ".fr-text--lead") || "";
  intro =
    intro &&
    textClean(
      introImg ? introImg + intro.innerHTML : intro.innerHTML,
      true
    ).replace(/<script[^>]*>([\s\S]*?)<\/script>/g, "");
  const description =
    $(dom.window.document, "meta[name=description]")?.getAttribute("content") ??
    "";

  let sections = [];

  const mainElement = $$(article, `.main-content`)[0];
  if (mainElement) {
    const articleSectionChildren = mainElement ? [...mainElement.children] : [];

    sections = sections.concat(
      getSections(mainElement, articleSectionChildren).filter(
        ({ anchor }) =>
          [
            "textes-de-reference",
            "qui-contacter",
            "articles-associes",
            "lire-en-complement",
            "documents",
          ].indexOf(anchor) === -1
      )
    );
  }

  if (sections.length === 0) {
    throw new ParseError(`No sections`);
  }

  return {
    date,
    description,
    intro,
    pubId: id,
    sections,
    title,
    url,
  };
}
