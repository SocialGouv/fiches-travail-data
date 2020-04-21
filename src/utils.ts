export const $$ = (node: ParentNode, selector: string): ParentNode[] =>
  Array.from(node.querySelectorAll(selector));
export const $ = (node: ParentNode, selector: string): Element | null =>
  node.querySelector(selector);

//

// dumb convert article.data.num as integer for comparison
// each part up to MAX_DEPTH is padded with PAD_LENGTH
export const PAD_LENGTH = 5; // left pad numbers to X chars
export const MAX_DEPTH = 5; // max number of L432-1-1-1

// padding numbers : 2 -> "0002"
export const leftPad = (num: number | string) => {
  let padded = "" + num;
  while (padded.length < PAD_LENGTH) {
    padded = "0" + padded;
  }
  return padded;
};

// transform articles into comparable integers
export const asInt = (num: string): number => {
  const parts = num
    .replace(/[^\d-]/g, "")
    .split("-")
    .map(leftPad);
  while (parts.length < MAX_DEPTH) {
    parts.push(leftPad(0));
  }
  const int = parseInt(parts.join(""));
  return int;
};
