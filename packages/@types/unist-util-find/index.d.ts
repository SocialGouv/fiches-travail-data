import type {Node} from "unist";

export default function find(
  tree: Node,
  condition: string | object | ((node: Node) => boolean)
): Node;
