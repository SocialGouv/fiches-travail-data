import slugify from "@socialgouv/cdtn-slugify";
import {ParseError} from "got";

import {encode} from "../email";
import {extractReferences} from "./referenceExtractor";
import {resolveReferences} from "./referenceResolver";

const $$ = (node, selector) => Array.from(node.querySelectorAll(selector));
const $ = (node, selector) => node.querySelector(selector);

function unwrapEmail(data = "") {
  const [k, ...tokens] = Array.from({length: data.length / 2}, (_, i) => i * 2).map((val) => parseInt(data.slice(val, val + 2), 16));
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
  node.parentElement
    .childNodes
    .forEach(function (childNode) {
      if (childNode.nodeName === "#comment" || childNode.nodeType === 8) {
        if (childNode.data.match(SRC_REGEX)) {
          comment = childNode;
        }
      }
    });

  if (!comment) {
    //upper sibbling node is not a comment so it's not a case we handle
    return;
  }
  const [, src = ""] = comment.data.match(SRC_REGEX);
  if (src.length === 0) {
    return;
  }
  const srcClean = getCleanSrc(src);
  node.parentNode.innerHTML = `<img src="${srcClean}" style="width:100%;height:auto;" />`;
};
const formatImage = (node) => {
  node.removeAttribute("onmousedown");
  if (node.getAttribute("src").indexOf("data:image") === -1) {
    let src = node.getAttribute("src");

    if (!src.match(/^https?:\/\//)) {
      const srcClean = getCleanSrc(src);
      node.setAttribute("src", srcClean);
      node.removeAttribute("srcset");
      node.removeAttribute("sizes");
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

const getSectionTag = (article) => {
  const h3 = $$(article, ".main-article__texte > h3").length && "h3";
  const h4 = $$(article, ".main-article__texte > h4").length && "h4";
  const h5 = $$(article, ".main-article__texte > h5").length && "h5";
  return h3 || h4 || h5 || "sectionTag";
};

const getReferences = (text) => {
  // first we extract the tokens referencing articles
  const references = extractReferences(text);
  // then we try to resolve the actual articles ids using legi-data
  return resolveReferences(references);
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
  const title = titleElement.textContent.trim();

  const dateRaw = $(dom.window.document, "meta[property*=modified_time]") || $(dom.window.document, "meta[property$=published_time]");
  const [year, month, day] = dateRaw.getAttribute("content").split("-");
  let intro = $(article, ".main-article__chapo") || "";
  intro = intro && intro.innerHTML.replace(/\n/g, "").replace(/\s+/g, " ").trim();
  const description = $(dom.window.document, "meta[name=description]")?.getAttribute("content") ?? "";

  const sections = [];
  const sectionTag = getSectionTag(article);
  // First pass is only to get a potential untitled section at the top of the article
  // This section has neither anchor nor title
  let nextArticleElement = $(article, ".main-article__texte > *");
  const untitledSection = {
    anchor: "", html: "", text: "", title: title,
  };
  while (nextArticleElement && nextArticleElement.tagName.toLowerCase() !== sectionTag) {
    if (nextArticleElement.textContent) {
      if (!untitledSection.description) {
        untitledSection.description = "temp description";
      }
      untitledSection.html += nextArticleElement.outerHTML
        .replace(/\n+/g, "")
        .replace(/>\s+</g, "><")
        .replace(/\s+/g, " ")

      untitledSection.text += " " + nextArticleElement.textContent.replace(/\s+/g, " ").trim();
    }
    nextArticleElement = nextArticleElement.nextElementSibling;
  }
  if (untitledSection.description) {
    untitledSection.text.trim();
    untitledSection.description = untitledSection.text.slice(0, 200).trim();
    untitledSection.references = getReferences(untitledSection.text);
    sections.push(untitledSection);
  }
  // Gets all the titled content
  const articleChildren = $$(article, `.main-article__texte > ${sectionTag}`);
  articleChildren.forEach(function (el) {
    if (el.tagName.toLowerCase() === sectionTag) {
      let nextEl = el.nextElementSibling;
      let html = "";

      while (nextEl && nextEl.tagName.toLowerCase() !== sectionTag) {
        html += nextEl.outerHTML;
        nextEl = nextEl.nextElementSibling;
      }

      const section = dom.window.document.createElement("div");
      section.innerHTML = html;
      const sectionText = section.textContent.replace(/\s+/g, " ").trim();

      sections.push({
        anchor: el.getAttribute("id") || slugify(el.textContent),
        description: sectionText.slice(0, 200).trim(),
        html: html.replace(/\n+/g, "").replace(/>\s+</g, "><").replace(/\s+/g, " "),
        references: getReferences(sectionText),
        text: sectionText,
        title: el.textContent.trim(),
      });
    }
  });

  if (sections.length === 0) {
    throw new ParseError(`No sections`);
  }

  return {
    date: `${day}/${month}/${year}`, description, intro, pubId: id, sections, title, url,
  };
}
