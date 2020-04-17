import { JSDOM } from "jsdom";
import { $, $$ } from "../utils";

const actual = `
  <body>
    <h1>Foo</h1>
    <h1>Bar</h1>
  </body>
`;
test("$ should query one element", () => {
  const dom = new JSDOM(actual);
  const { document } = dom.window;
  expect($(document, "h1")).toMatchInlineSnapshot(`
    <h1>
      Foo
    </h1>
  `);
});

test("$$ should query multiple elements", () => {
  const dom = new JSDOM(actual);
  const { document } = dom.window;
  expect($$(document, "h1")).toMatchInlineSnapshot(`
    Array [
      <h1>
        Foo
      </h1>,
      <h1>
        Bar
      </h1>,
    ]
  `);
});
