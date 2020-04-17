export const $$ = (node: ParentNode, selector: string): ParentNode[] =>
  Array.from(node.querySelectorAll(selector));
export const $ = (node: ParentNode, selector: string): Element | null =>
  node.querySelector(selector);
