import externalUrls from "@socialgouv/datafiller-data/data/externals.json";
import fs from "fs";
import got from "got";
import { JSDOM } from "jsdom";
import pLimit from "p-limit";
import path from "path";

import { encode } from "../email";
import { extractReferences } from "./referenceExtractor";
import { resolveReferences } from "./referenceResolver";

class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "ParseError";
  }
}

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

const formatPicture = (node) => {
  const comment = node.parentElement.childNodes[0];
  if (comment.nodeName !== "#comment") {
    //upper sibbling node is not a comment so it's not a case we handle
    return;
  }
  const [, src = ""] = comment.data.match(/src=["']([^'"]*)["']/);
  if (src.lenght === 0) {
    return;
  }
  let [srcClean] = src.split("?");
  if (!srcClean.match(/^https?:\/\//)) {
    if (srcClean.slice(0, 1) !== "/") {
      srcClean = "/" + srcClean;
    }
    srcClean = `https://travail-emploi.gouv.fr${srcClean}`;
  }

  // we remove the ie comment that have timestamp in the url
  comment.remove();
  // we add e
  const sourceNode = node.ownerDocument.createElement("source");
  sourceNode.setAttribute("srcset", srcClean);
  sourceNode.setAttribute("media", "(min-width: 300px)");
  node.appendChild(sourceNode);
  return node;
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

function getType(node) {
  if (/page_article/.test(node.className)) {
    return "article";
  }
  if (/page_rubrique/.test(node.className)) {
    return "rubrique";
  }
  return "";
}

function getRubriqueId(node) {
  if (!/id_rubrique=(\d+)/.test(node.href)) {
    throw new ParseError("No id element");
  }
  const [, id] = node.href.match(/id_rubrique=(\d+)/);
  return `rubrique${id}`;
}

function getArticleId(node) {
  if (!/article-titre-(\d+)/.test(node.className)) {
    throw new ParseError("No id element");
  }
  const [, id] = node.className.match(/article-titre-(\d+)/);
  return `article${id}`;
}

function getId(dom) {
  const pageType = getType(dom.window.document.documentElement);
  switch (pageType) {
    case "rubrique": {
      const syndicationNode = $(dom.window.document, "link[href^='spip.php']");
      return getRubriqueId(syndicationNode);
    }
    case "article": {
      const title = $(dom.window.document, "main h1");
      return getArticleId(title);
    }
  }
  return null;
}

function parseDom(dom) {
  const article = $(dom.window.document, "main");
  if (!article) {
    throw new ParseError("no <main>");
  }
  $$(article, "a").forEach(formatAnchor);
  $$(article, "picture").forEach(formatPicture);
  $$(article, "[data-cfemail]").forEach(formatEmail);
  $$(article, ".cs_blocs").forEach(flattenCsBlocs);
  const imgs = $$(article, "img");
  imgs.forEach((node) => {
    // remove adaptImgFix(this) on hero img
    node.removeAttribute("onmousedown");
  });
  imgs
    .filter((node) => node.getAttribute("src").indexOf("data:image") === -1)
    .forEach((node) => {
      let src = node.getAttribute("src");
      if (!src.match(/^https?:\/\//)) {
        if (src.slice(0, 1) !== "/") {
          src = "/" + src;
        }
        src = `https://travail-emploi.gouv.fr${src}`;
        node.setAttribute("src", src);
      }
    });

  const titleElement = $(article, "h1");
  if (!titleElement) {
    throw new ParseError("No <h1> element");
  }
  const title = titleElement.textContent.trim();

  const pubId = getId(dom);

  const dateRaw =
    $(dom.window.document, "meta[property*=modified_time]") ||
    $(dom.window.document, "meta[property$=published_time]");
  const [year, month, day] = dateRaw.getAttribute("content").split("-");
  let intro = $(article, ".main-article__chapo") || "";
  intro =
    intro && intro.innerHTML.replace(/\n/g, "").replace(/\s+/g, " ").trim();
  const description = $(
    dom.window.document,
    "meta[name=description]"
  ).getAttribute("content");

  const sections = [];
  const sectionTag = getSectionTag(article);

  // First pass is only to get a potential untitled section at the top of the article
  // This section has neither anchor nor title
  let nextArticleElement = $(article, ".main-article__texte > *");
  const untitledSection = {
    anchor: "",
    html: "",
    text: "",
    title: title,
  };
  while (
    nextArticleElement &&
    nextArticleElement.tagName.toLowerCase() !== sectionTag
  ) {
    if (nextArticleElement.textContent) {
      if (!untitledSection.description) {
        untitledSection.description = nextArticleElement.textContent
          .replace(/\s+/g, " ")
          .slice(0, 200)
          .trim();
      }
      untitledSection.html += nextArticleElement.outerHTML
        .replace(/\n+/g, "")
        .replace(/>\s+</g, "><")
        .replace(/\s+/g, " ");
      untitledSection.text +=
        " " + nextArticleElement.textContent.replace(/\s+/g, " ").trim();
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
        let html = "";

        while (nextEl && nextEl.tagName.toLowerCase() !== sectionTag) {
          html += nextEl.outerHTML;
          nextEl = nextEl.nextElementSibling;
        }

        const section = dom.window.document.createElement("div");
        section.innerHTML = html;
        const sectionText = section.textContent.replace(/\s+/g, " ").trim();

        sections.push({
          anchor: el.id,
          description: sectionText.slice(0, 200).trim(),
          html: html
            .replace(/\n+/g, "")
            .replace(/>\s+</g, "><")
            .replace(/\s+/g, " "),
          references: getReferences(sectionText),
          text: sectionText,
          title: el.textContent.trim(),
        });
      }
    });

  return {
    date: `${day}/${month}/${year}`,
    description,
    intro,
    pubId,
    sections,
    title,
  };
}

const limit = pLimit(10);

async function parseFiche(url) {
  try {
    let response = await got(url, {
      followRedirect: true,
      http2: true,
      retry: 3,
    });
    if (/HTTP 30\d/.test(response.body)) {
      const [, redirectUrl] = response.body.match(/href="(.*)"/);
      try {
        response = await got(redirectUrl, {
          followRedirect: true,
          http2: true,
          retry: 3,
        });
      } catch (error) {
        console.error(`Wrong redirectUrl: ${url} => ${redirectUrl}`);
        throw error;
      }
    }
    const dom = new JSDOM(response.body, { url });
    return {
      ...parseDom(dom),
      url,
    };
  } catch (error) {
    if (error instanceof ParseError) {
      throw {
        message: error.message,
        name: error.name,
        url,
      };
    }
    if (error instanceof got.HTTPError) {
      throw {
        message: error.message,
        name: error.name,
        statusCode: error.response.statusCode,
        url: error.options.url.href,
      };
    }
    error.url = url;
    throw error;
  }
}

async function scrap(urls) {
  const inputs = urls.map((url) => limit(() => parseFiche(url)));
  const results = await Promise.allSettled(inputs);

  const failedPromise = results.filter(
    ({ status, reason }) =>
      status === "rejected" &&
      (reason.name === "HTTPError" || reason.name === "ParseError")
  );

  if (failedPromise.length > 0) {
    console.error(failedPromise.map(({ reason }) => reason));
    console.error("Error - fetching pages fail. Some pages are missing");
    process.exit(-1);
  }

  const resolvedPromise = results.flatMap(({ status, value }) =>
    status === "fulfilled" ? [value] : []
  );

  const fiches = resolvedPromise.filter(
    (fiche) => fiche.sections && fiche.sections.length > 0
  );
  const dataFilePath = path.join(
    __dirname,
    "..",
    "..",
    "data",
    "fiches-travail.json"
  );
  fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
  fs.writeFileSync(dataFilePath, JSON.stringify(fiches, null, 2));
}

if (module === require.main) {
  const { urls } = externalUrls.find(
    ({ title }) => title === "ministere-travail"
  );
  const t0 = Date.now();

  scrap(urls)
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
