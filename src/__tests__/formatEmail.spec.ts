import { JSDOM } from "jsdom";
import { formatEmail } from "../formatEmail";

const actual = `
  <body>
    <a>foo</a>
    <a data-cfemail="">bar</a>
    <a data-cfemail="3566565a5975585c545b4150">qux</a>
  </body>
`;

test("formatEmail should alter the node", () => {
  const dom = new JSDOM(actual);
  const {
    document: { body },
  } = dom.window;

  Array.from(body.querySelectorAll("a")).forEach(formatEmail);

  expect(body).toMatchSnapshot();
});
