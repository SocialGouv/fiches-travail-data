// eslint-disable-next-line import/no-unresolved
import type { Node } from "unist";

export type ExtractedReference = {
  text: string;
  code: { name: string; id: string } | undefined;
};

export type Code = {
  name: string;
  id: string;
};

export type Reference = {
  text: string;
  fmt: string;
  id: string;
  code: Code | undefined;
};

export type ResolvedReferences = {
  [codeId: string]: {
    name: string;
    articles: { text: string; fmt: string; id: string }[];
  };
};

export type UnravelledReference = {
  text: string;
  fmt: string | undefined;
  code: Code;
};

export interface CodeArticle extends Node {
  data: {
    num: string;
    id: string;
  };
}
