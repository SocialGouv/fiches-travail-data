import got, { HTTPError, ParseError } from "got";

import { parseDom } from "../parseDom";
import { scrapUrl } from "../scrapUrl";

jest.mock("got");
jest.mock("../parseDom");

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

got.mockImplementation((url) => {
  if (url === "http://url.ok") {
    return Promise.resolve({
      body: `<html><body><h1>hello</h1></body></html>`,
    });
  }
  if (url === "url.wrong-redirect") {
    return Promise.resolve({
      body: `HTTP 301 <a href="url.http.fail">url fail</a>`,
    });
  }
  if (url === "url.http.fail") {
    const error = new HTTPError();
    error.response = {
      statusCode: 500,
    };
    error.options = { url: { href: "url.fail" } };
    error.message = "http fail";
    error.name = "HTTPError";
    return Promise.reject(error);
  }
  if (url === "url.parse.fail") {
    const error = new ParseError();
    error.message = "parse fail";
    error.name = "ParseError";
    return Promise.reject(error);
  }
});

parseDom.mockImplementation(() => ({ title: "Yo" }));

test("scrapUrl should return formated data", async () => {
  const result = await scrapUrl("http://url.ok");
  expect(result).toEqual({ title: "Yo" });
});

test("scrapUrl should throw if redirected url failed", async () => {
  await expect(scrapUrl("url.wrong-redirect")).rejects.toThrow(
    /Wrong redirectUrl/
  );
});

test("scrapUrl should throw if url failed", async () => {
  await expect(scrapUrl("url.http.fail")).rejects.toThrow(/HTTP Error/);
});

test("scrap should throw if parse fail", async () => {
  await expect(scrapUrl("url.parse.fail")).rejects.toThrow(/Parsing Error/);
});
