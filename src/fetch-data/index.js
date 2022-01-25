import fs from "fs";
import got from "got";
import pLimit from "p-limit";
import path from "path";

import { scrapUrl } from "./scrapUrl";

const FEED_URL = "https://travail-emploi.gouv.fr/?page=oseo_json";

const limit = pLimit(10);
export async function fetchFeed(url) {
  const response = await got.post(url, {
    headers: {
      "Content-Type": "application/json",
      // See issue https://github.com/SocialGouv/cdtn-admin/issues/707
      Cookie:
        "atauthority=%7B%22name%22%3A%22atauthority%22%2C%22val%22%3A%7B%22authority_name%22%3A%22cnil%22%2C%22visitor_mode%22%3A%22exempt%22%7D%2C%22options%22%3A%7B%22end%22%3A%222023-01-14T08%3A34%3A09.636Z%22%2C%22path%22%3A%22%2F%22%7D%7D; TSPD_101=08eeb285a9ab28006ea1b33079132448a70a8eeb5c082316b043fdebcc52e6493d0e0785ddc6dbf1dfc2cef3ddc5b0b40827d62c5a0510000167604732602cb5904334b599d12d1a:08eeb285a9ab2800da071da76ed893ba52f7c19b60efdc66209516375a1c20487a7c303deb2d387889bedf6b67e35ad5088d839d27063000cdfeb3bf91d21d637bd0b7179fdf324de7cc500eef41a59e6a2dca60ea9e22c764e90a572c2ff28cf36a36c98def608f; BIGipServerpool-dicom-portail-dares2.cegedim.cloud-HTTP=!uEusk+oWgYdRv8kqJlLL3fNyljz02f1hkUzl16O5bs3qacwFr3MVUhQr3X8bWzdw/B6Zw7ZvKi+gYtU1LcZ96Dl07OA=",
    },
    http2: true,
    retry: 3,
  });
  const { fiches: feed } = JSON.parse(response.body);
  return feed;
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
