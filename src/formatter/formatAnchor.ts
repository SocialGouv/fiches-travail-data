import { unwrapEmail } from "../unwrapEmail";

export const formatAnchor = (node: Element): void => {
  if (node.textContent === "" && !node.children.length) {
    node.remove();
    return;
  }

  if (node.getElementsByTagName("img").length) {
    node.classList.add("no-after");
  }

  // remove ATTAg(...) on pdf link
  node.removeAttribute("onclick");

  const href = node.getAttribute("href");
  if (!href) return;

  // unwrap link with href="javascript:"
  if (/^javascript:/.test(href)) {
    node.removeAttribute("href");
    return;
  }

  if (/email-protection/.test(href)) {
    const [, data = ""] = href.split("#");
    const value = unwrapEmail(data);
    node.setAttribute("href", `mailto:${decodeURIComponent(escape(value))}`);
    return;
  }

  if (!href.match(/^\w+?:\/\//)) {
    node.setAttribute(
      "href",
      `https://travail-emploi.gouv.fr/${href.replace(/^\//, "")}`
    );
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "nofollow, noopener");
  }
};
