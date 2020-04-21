//

export type Reference = {
  text: string;
  fmt: string;
  id: string;
  code:
    | {
        name: string;
        id: string;
      }
    | undefined;
};

export type ResolvedReferences = {
  [x: string]: {
    name: string;
    articles: { text: string; fmt: string; id: string }[];
  };
};
