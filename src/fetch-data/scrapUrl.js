import got from "got";
import { JSDOM } from "jsdom";

import { injectToken } from "./injectToken";
import { parseDom } from "./parseDom";

export async function scrapUrl(id, url) {
  try {
    let response = await got(injectToken(url), {
      followRedirect: true,
      http2: true,
      retry: 3,
    });
    if (/HTTP 30\d/.test(response.body)) {
      const [, redirectUrl] = response.body.match(/href="(.*)"/);
      try {
        response = await got(injectToken(redirectUrl), {
          followRedirect: true,
          http2: true,
          retry: 3,
        });
      } catch (error) {
        throw new Error(`Wrong redirectUrl: ${url} => ${redirectUrl}`);
      }
    }
    const dom = new JSDOM(response.body, { url });
    const res = parseDom(dom, id, url);
    return res;
  } catch (error) {
    let err;
    if (error instanceof got.ParseError) {
      err = new Error(`Parsing Error: ${error.message}`);
    } else if (error instanceof got.HTTPError) {
      err = new Error(
        `HTTP Error: ${error.response.statusCode} - ${url} - ${error.message}`
      );
      // Add a property to identify 403 errors specifically
      if (error.response.statusCode === 403) {
        err.isForbidden = true;
      }
    } else {
      err = new Error(error.message);
    }

    err.url = url;
    throw err;
  }
}
