import got from "got";
import { JSDOM } from "jsdom";

import { generateHeaders } from "./generateHeaders";
import { parseDom } from "./parseDom";
const fs = require("fs");

export async function scrapUrl(id, url) {
  const headers = generateHeaders();
  try {
    try {
      let response = await got(url, {
        followRedirect: true,
        headers,
        http2: true,
        retry: 3,
      });
      if (/HTTP 30\d/.test(response.body)) {
        const [, redirectUrl] = response.body.match(/href="(.*)"/);
        try {
          response = await got(redirectUrl, {
            followRedirect: true,
            headers,
            http2: true,
            retry: 3,
          });
        } catch (error) {
          throw new Error(`Wrong redirectUrl: ${url} => ${redirectUrl}`);
        }
      }
      try {
        const dom = new JSDOM(response.body.toString());
        try {
          const res = parseDom(dom, id, url);
          return res;
        } catch (e) {
          console.log("ID", id);
          console.log("URL", url);
          fs.writeFileSync("response-body.txt", response.body);
          fs.writeFileSync("dom.txt", JSON.stringify(dom, null, 2));
          console.log("PARSE DOM");
          console.log(e);
        }
      } catch (e) {
        console.log("JS-DOM");
        console.log(e);
      }
    } catch (e) {
      console.log("FETCH");
      console.log(e);
    }
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
