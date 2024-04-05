import { injectToken } from "../injectToken";

describe("scrapUrl", () => {
  beforeEach(() => {
    process.env.TOKEN_MT = "token_mt";
  });

  test("injectToken should inject the TOKEN_MT in the URL", async () => {
    expect(injectToken("http://monurl.test")).toEqual(
      "http://monurl.test?cgtoken=token_mt"
    );
    expect(injectToken("http://monurl.test/test?withParam=true")).toEqual(
      "http://monurl.test/test?withParam=true&cgtoken=token_mt"
    );
  });
});
