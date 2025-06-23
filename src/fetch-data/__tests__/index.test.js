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
    return Promise.reject(error);
  }
  if (url === "url.forbidden") {
    const error = new Error(`HTTP Error: 403 - ${url} - Forbidden`);
    error.url = url;
    error.isForbidden = true;
    return Promise.reject(error);
  }
});

test("scrap should throw if some scrapped pages failed with non-403 errors", async () => {
  await expect(
    scrap([
      { id: "url.a", url: "url.sections" },
      { id: "noid", url: "url.fail" },
    ])
  ).rejects.toThrowError(/fetching pages fail/);
});

test("scrap should not throw if some scrapped pages failed with 403 errors", async () => {
  // Mock console.warn to verify it's called
  const consoleWarnSpy = jest
    .spyOn(console, "warn")
    .mockImplementation(jest.fn);

  const result = await scrap([
    { id: "url.a", url: "url.sections" },
    { id: "noid", url: "url.forbidden" },
  ]);

  // Verify that console.warn was called
  expect(consoleWarnSpy).toHaveBeenCalled();
  // Verify that we still get the successful results
  expect(result).toHaveLength(1);
  expect(result[0].pubId).toBe("url.a");

  // Restore the original console.warn
  consoleWarnSpy.mockRestore();
});

test("scrap should throw if some scrapped pages have same id", async () => {
  await expect(
    scrap([
      { id: "url.a", url: "url.sections" },
      { id: "url.a", url: "url.sections" },
    ])
  ).rejects.toThrowError(/fiches en doublons/);
});
