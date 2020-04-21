import { JSDOM } from "jsdom";
import { formatAnchor } from "../../formatter/formatAnchor";

const actual = `
  <body>
    <span></span>
    <img/>
    <button>foo</button>
    <button onclick="console.log('foo')">bar</button>
    <a href="">foo</a>
    <a href="relative">relative</a>
    <a href="/absolute">absolute</a>
    <a href="http://example.com">http://example.com</a>
    <a href="https://example.com">https://example.com</a>
    <a href="ftp://example.com">ftp://example.com</a>
    <a href="/foo/email-protection">bar</a>
    <a href="/foo/email-protection#">bar</a>
    <a href="/foo/email-protection#bar">qux</a>
    <a href="/foo/email-protection#73101c1d071210075e1203331200035e0306111f1a105d1501">bar</a>
    <a href="javascript">javascript</a>
    <a href="javascript:">javascript:</a>
    <a href="javascript:alert('Hello');">javascript:alert('Hello');</a>
  </body>
`;

test("formatEmail should alter the node", () => {
  const dom = new JSDOM(actual);
  const {
    document: { body },
  } = dom.window;

  Array.from(body.querySelectorAll("a")).forEach(formatAnchor);

  expect(body).toMatchSnapshot();
});
