import externalUrls from "@socialgouv/datafiller-data/data/externals.json";
import fs from "fs";
import pLimit from "p-limit";
import path from "path";

import { scrapUrl } from "./scrapUrl";

const limit = pLimit(10);

export async function scrap(urls) {
  const inputs = urls.map((url) => limit(() => scrapUrl(url)));
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
  const { urls } = externalUrls.find(
    ({ title }) => title === "ministere-travail"
  );
  const t0 = Date.now();

  scrap(urls)
    .then((fiches) => {
      if (fiches.length !== urls.length) {
        throw new Error(
          `[error] scrap fail - Missing documents ${fiches.length}/${urls.length}`
        );
      }
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
