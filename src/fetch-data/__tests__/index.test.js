import { scrap } from "../index";
import { scrapUrl } from "../scrapUrl";

jest.mock("../scrapUrl");

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(jest.fn);
});

scrapUrl.mockImplementation((id, url) => {
  if (url === "url.sections")
    return Promise.resolve({ pubId: "url.a", sections: [{ id: "section" }] });
  if (url === "url.no.section")
    return Promise.resolve({ pubId: "url.c", sections: [] });
  if (url === "url.fail") {
    const error = new Error(`xxx ${url} fail`);
    error.url = url;
    return Promise.reject(url);
  }
});

test("scrap should throw if some scrapped pages failed", async () => {
  await expect(
    scrap([
      { id: "url.a", url: "url.sections" },
      { id: "noid", url: "url.fail" },
    ])
  ).rejects.toThrowError(/fetching pages fail/);
});

test("scrap should throw if some scrapped pages have same id", async () => {
  await expect(
    scrap([
      { id: "url.a", url: "url.sections" },
      { id: "url.a", url: "url.sections" },
    ])
  ).rejects.toThrowError(/fiches en doublons/);
});
