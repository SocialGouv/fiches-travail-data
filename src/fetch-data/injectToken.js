/**
 * Inject  a specific token to bypass bot protection
 */
export function injectToken(url) {
  if (!process.env.TOKEN_MT) {
    throw Error(
      "Token (cgtoken) is required to fetch the data. This token is provided by the travail-emploi.gouv.fr team."
    );
  }
  if (url.includes("?")) {
    return `${url}&cgtoken=${process.env.TOKEN_MT}`;
  } else {
    return `${url}?cgtoken=${process.env.TOKEN_MT}`;
  }
}
