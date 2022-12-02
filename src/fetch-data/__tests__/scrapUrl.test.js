import got, { HTTPError, ParseError } from "got";

import { parseDom } from "../parseDom";
import { scrapUrl } from "../scrapUrl";

jest.mock("got");
jest.mock("../parseDom");

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(jest.fn);
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

const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetModules(); // Most important - it clears the cache
  process.env = { ...OLD_ENV }; // Make a copy
});

afterAll(() => {
  process.env = OLD_ENV; // Restore old environment
});

test("scrapUrl should throw an error if no TOKEN variable has been set", async () => {
  expect.assertions(1);
  try {
    await scrapUrl("id", "http://url.ok");
  } catch (e) {
    // eslint-disable-next-line jest/no-conditional-expect
    expect(e.message).toBe(
      "Token (cgtoken) is required to fetch the data. This token is provided by the travail-emploi.gouv.fr team."
    );
  }
});

test("scrapUrl should return formated data", async () => {
  process.env.TOKEN_MT = "TOKEN";
  const result = await scrapUrl("id", "http://url.ok");
  expect(result).toEqual({ title: "Yo" });
});

test("scrapUrl should throw if redirected url failed", async () => {
  process.env.TOKEN_MT = "TOKEN";
  await expect(scrapUrl("id", "url.wrong-redirect")).rejects.toThrow(
    /Wrong redirectUrl/
  );
});

test("scrapUrl should throw if url failed", async () => {
  process.env.TOKEN_MT = "TOKEN";
  await expect(scrapUrl("id", "url.http.fail")).rejects.toThrow(/HTTP Error/);
});

test("scrap should throw if parse fail", async () => {
  process.env.TOKEN_MT = "TOKEN";
  await expect(scrapUrl("id", "url.parse.fail")).rejects.toThrow(
    /Parsing Error/
  );
});
