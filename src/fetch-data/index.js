import fs from "fs";
import pLimit from "p-limit";
import path from "path";

import { scrapUrl } from "./scrapUrl";

const FEED_URL = "https://travail-emploi.gouv.fr/?page=oseo_json";

const limit = pLimit(10);

export async function fetchFeed() {
  const localJsonData = fs.readFileSync(
    path.join(__dirname, "../../local.data.json"),
    "utf8"
  );
  return JSON.parse(localJsonData).fiches;
}

export async function scrap(urls) {
  const inputs = urls.map(({ id, url }) => limit(() => scrapUrl(id, url)));
  const results = await Promise.allSettled(inputs);

  const failedPromise = results.filter(({ status }) => status === "rejected");

  // Separate 403 errors from other errors
  const forbiddenErrors = failedPromise.filter(
    ({ reason }) => reason.isForbidden
  );
  const otherErrors = failedPromise.filter(({ reason }) => !reason.isForbidden);

  // Log 403 errors as warnings and save them to a file for GitHub Actions
  if (forbiddenErrors.length > 0) {
    const forbiddenUrls = forbiddenErrors.map(({ reason }) => reason.url);
    console.warn(
      "WARNING: The following pages returned 403 Forbidden and were skipped:",
      forbiddenUrls
    );

    // Write forbidden URLs to a file for GitHub Actions to use
    fs.writeFileSync(
      path.join(__dirname, "../../forbidden-urls.json"),
      JSON.stringify(
        {
          urls: forbiddenUrls,
          timestamp: new Date().toISOString(),
          count: forbiddenUrls.length,
        },
        null,
        2
      )
    );
  }

  // Only fail if there are non-403 errors
  if (otherErrors.length > 0) {
    console.error(
      "scrap fail",
      otherErrors.map(({ reason }) => reason)
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
