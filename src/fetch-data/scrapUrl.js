import got from "got";
import { JSDOM } from "jsdom";

import { parseDom } from "./parseDom";

export async function scrapUrl(url) {
  try {
    let response = await got(url, {
      followRedirect: true,
      http2: true,
      retry: 3,
    });
    if (/HTTP 30\d/.test(response.body)) {
      const [, redirectUrl] = response.body.match(/href="(.*)"/);
      try {
        response = await got(redirectUrl, {
          followRedirect: true,
          http2: true,
          retry: 3,
        });
      } catch (error) {
        throw new Error(`Wrong redirectUrl: ${url} => ${redirectUrl}`);
      }
    }
    const dom = new JSDOM(response.body, { url });
    return parseDom(dom, url);
  } catch (error) {
    let err;
    if (error instanceof got.ParseError) {
      err = new Error(`Parsing Error: ${error.message}`);
    } else if (error instanceof got.HTTPError) {
      err = new Error(
        `HTTP Error: ${error.response.statusCode} - ${error.options.url.href} - ${error.message}`
      );
    } else {
      err = new Error(error.message);
    }

    err.url = url;
    throw err;
  }
}
