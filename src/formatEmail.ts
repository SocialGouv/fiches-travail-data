import { unwrapEmail } from "./unwrapEmail";

export const formatEmail = (node: Element): Element => {
  const cfemail = node.getAttribute("data-cfemail");
  if (!cfemail) {
    return node;
  }
  const value = unwrapEmail(cfemail);
  node.className = "";
  node.removeAttribute("data-cfemail");
  node.textContent = value;
  return node;
};
