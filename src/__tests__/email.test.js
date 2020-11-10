import { decode, encode } from "../email";

test("encode one email", () => {
  expect(encode("michel@socialgouv.fr")).toBe("michel_@socialgouv.fr");
});
test("encode multiple email", () => {
  expect(encode("serge@socialgouv.fr jeanne@socialgouv.fr")).toBe(
    "serge_@socialgouv.fr jeanne_@socialgouv.fr"
  );
});

test("decode one email", () => {
  expect(decode("michel_@socialgouv.fr")).toBe("michel@socialgouv.fr");
});

test("decode multiple email", () => {
  expect(decode("serge_@socialgouv.fr jeanne_@socialgouv.fr")).toBe(
    "serge@socialgouv.fr jeanne@socialgouv.fr"
  );
});
