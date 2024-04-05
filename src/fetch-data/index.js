import fs from "fs";
import got from "got";
import pLimit from "p-limit";
import path from "path";

import { injectToken } from "./injectToken";
import { scrapUrl } from "./scrapUrl";

const FEED_URL = "https://travail-emploi.gouv.fr/?page=oseo_json";

const limit = pLimit(10);

export async function fetchFeed(url) {
  const response = await got.post(injectToken(url), {
    http2: true,
    retry: 3,
  });
  const { fiches: feed } = JSON.parse(response.body);
  const localJson = fs.readFileSync(
    path.join(__dirname, "../../local.data.json"),
    "utf8"
  );
  const { fiches: localFeed } = JSON.parse(localJson);
  return [...feed, ...localFeed];
}

export async function scrap(urls) {
  const inputs = urls.map(({ id, url }) => limit(() => scrapUrl(id, url)));
  const results = await Promise.allSettled(inputs);

  const failedPromise = results.filter(({ status }) => status === "rejected");

  if (failedPromise.length > 0) {
    console.error(
      "scrap fail",
      failedPromise.map(({ reason }) => reason)
    );
    throw new Error("Error - fetching pages fail. Some pages are missing");
  }

  const resolvedPromise = results.flatMap(({ status, value }) =>
    status === "fulfilled" ? [value] : []
  );
  // ensure we not have duplicate url
  let hasDuplicate = false;

  for (const { pubId, url } of resolvedPromise) {
    const count = resolvedPromise.filter(
      (fiche) => fiche.pubId === pubId && pubId !== undefined
    ).length;
    if (count > 1) {
      hasDuplicate = true;
      console.error(
        `[error] la fiche ${url} est présente ${count} fois. Veuillez supprimer le doublon du datafiller`
      );
    }
  }
  if (hasDuplicate) {
    throw new Error(
      `[error] fiches en doublons. Veuillez supprimer les doublons du datafiller`
    );
  }
  return resolvedPromise;
}

if (module === require.main) {
  const t0 = Date.now();
  fetchFeed(FEED_URL)
    .then(scrap)
    .then((fiches) => {
      console.log(`done in ${Math.round((Date.now() - t0) / 1000)} sec`);
      const dataFilePath = path.join(
        __dirname,
        "..",
        "..",
        "data",
        "fiches-travail.json"
      );
      fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
      fs.writeFileSync(dataFilePath, JSON.stringify(fiches, null, 2));
    })
    .catch((error) => {
      console.error(error);
      console.error(`fail in ${Math.round((Date.now() - t0) / 1000)} sec`);
      process.exit(1);
    });
}
