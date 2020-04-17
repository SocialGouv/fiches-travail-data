import externalUrls from "@socialgouv/datafiller-data/data/externals.json";
import fs from "fs";
import { JSDOM } from "jsdom";
import pLimit from "p-limit";
import path from "path";
import { extractReferences } from "./referenceExtractor";
import { resolveReferences } from "./referenceResolver";
import { $$, $ } from "./utils";

function unwrapEmail(data = "") {
  const [k, ...tokens] = Array.from(
    { length: data.length / 2 },
    (_, i) => i * 2
  ).map((val) => parseInt(data.slice(val, val + 2), 16));
  const rawValue = tokens.map((v) => String.fromCharCode(v ^ k)).join("");
  return decodeURIComponent(escape(rawValue));
}
const formatEmail = (node) => {
  const value = unwrapEmail(node.getAttribute("data-cfemail"));
  node.className = "";
  node.removeAttribute("data-cfemail");
  node.textContent = value;
};

const formatAnchor = (node) => {
  if (node.textContent === "") {
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
    node.setAttribute("href", `mailto:${decodeURIComponent(escape(value))}`);
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

const flattenCsBlocs = (node) => {
  node.insertAdjacentHTML("afterend", node.innerHTML);
  node.parentNode.removeChild(node);
};

const getSectionTag = (article) => {
  const h3 = $$(article, ".main-article__texte > h3").length && "h3";
  const h4 = $$(article, ".main-article__texte > h4").length && "h4";
  const h5 = $$(article, ".main-article__texte > h5").length && "h5";
  return h3 || h4 || h5;
};

const getReferences = (text) => {
  // first we extract the tokens referencing articles
  const references = extractReferences(text);
  // then we try to resolve the actual articles ids using legi-data
  return resolveReferences(references);
};

function parseDom(dom) {
  const article = $(dom.window.document, "main");
  $$(article, "a").forEach(formatAnchor);
  $$(article, "[data-cfemail]").forEach(formatEmail);
  $$(article, ".cs_blocs").forEach(flattenCsBlocs);
  $$(article, "img")
    .filter((node) => node.getAttribute("src").indexOf("data:image") === -1)
    .forEach((node) => {
      // remove adaptImgFix(this) on hero img
      node.removeAttribute("onmousedown");
      let src = node.getAttribute("src");
      if (!src.match(/^https?:\/\//)) {
        if (src.slice(0, 1) !== "/") {
          src = "/" + src;
        }
        src = `https://travail-emploi.gouv.fr${src}`;
        node.setAttribute("src", src);
      }
    });

  const title = $(article, "h1").textContent.trim();

  const dateRaw =
    $(dom.window.document, "meta[property*=modified_time]") ||
    $(dom.window.document, "meta[property$=published_time]");
  const [year, month, day] = dateRaw.getAttribute("content").split("-");
  let intro = $(article, ".main-article__chapo") || "";
  intro = intro && intro.innerHTML.trim();
  const description = $(
    dom.window.document,
    "meta[name=description]"
  ).getAttribute("content");
  const pubIdMeta = $(dom.window.document, "meta[name='SPIP.identifier']");
  const sections = [];
  const sectionTag = getSectionTag(article);

  // First pass is only to get a potential untitled section at the top of the article
  // This section has neither anchor nor title
  let nextArticleElement = $(article, ".main-article__texte > *");
  const untitledSection = {
    title: title,
    anchor: "",
    html: "",
    text: "",
  };
  while (
    nextArticleElement &&
    nextArticleElement.tagName.toLowerCase() !== sectionTag
  ) {
    if (nextArticleElement.textContent) {
      if (!untitledSection.description) {
        untitledSection.description = nextArticleElement.textContent.trim();
      }
      untitledSection.html += nextArticleElement.outerHTML;
      untitledSection.text += " " + nextArticleElement.textContent.trim();
    }
    nextArticleElement = nextArticleElement.nextElementSibling;
  }
  if (untitledSection.description) {
    untitledSection.text.trim();
    untitledSection.references = getReferences(untitledSection.text);
    sections.push(untitledSection);
  }
  // Gets all the titled content
  const articleChildren = $$(article, ".main-article__texte > *");
  articleChildren
    .filter((el) => el.getAttribute("id"))
    .forEach(function (el) {
      if (el.tagName.toLowerCase() === sectionTag) {
        let nextEl = el.nextElementSibling;
        const section = {
          anchor: el.id,
          description: nextEl.textContent.trim().slice(0, 200),
          html: "",
          text: "",
          title: el.textContent.trim(),
        };
        while (nextEl && nextEl.tagName.toLowerCase() !== sectionTag) {
          section.text += nextEl.textContent.trim();
          section.html += nextEl.outerHTML;
          nextEl = nextEl.nextElementSibling;
        }
        // section.html = addTags(section.html);

        section.references = getReferences(section.text);
        sections.push(section);
      }
    });

  return {
    date: `${day}/${month}/${year}`,
    description,
    intro,
    sections,
    title,
    pubId: pubIdMeta && pubIdMeta.getAttribute("content"),
  };
}

const limit = pLimit(15);

async function parseFiche(url) {
  try {
    const dom = await JSDOM.fromURL(url);
    return {
      ...parseDom(dom),
      url,
    };
  } catch (error) {
    if (error.statusCode) {
      console.error(error.options.uri);
    } else {
      console.error("parse error", url, error);
    }
    return error;
  }
}

async function fetchAndParse(urls) {
  const inputs = urls.map((url) => limit(() => parseFiche(url)));
  const results = await Promise.all(inputs);

  const fiches = results.filter(
    (fiche) => fiche.sections && fiche.sections.length > 0
  );

  fs.writeFileSync(
    path.join(__dirname, "..", "data", "fiches-travail.json"),
    JSON.stringify(fiches, null, 2)
  );
}

if (module === require.main) {
  const { urls } = externalUrls.find(
    ({ title }) => title === "ministere-travail"
  );
  const t0 = Date.now();
  fetchAndParse(urls)
    .then(() => {
      console.log(`done in ${Math.round((Date.now() - t0) / 1000)} sec`);
    })
    .catch((error) => {
      console.error(error);
      console.error(`fail in ${Math.round((Date.now() - t0) / 1000)} sec`);
      process.exit(-1);
    });
}

export { parseDom };
