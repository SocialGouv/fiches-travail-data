import type { Node } from "unist";

export default function find<V extends Node>(
  tree: Node,
  condition: string | object | ((node: Node) => boolean)
): V;
