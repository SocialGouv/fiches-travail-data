/**
 * Build the header for request with a specific token to bypass bot protection
 */
export function generateHeaders(extras) {
  if (!process.env.TOKEN_MT) {
    throw Error(
      "Token (cgtoken) is required to fetch the data. This token is provided by the travail-emploi.gouv.fr team."
    );
  }
  return {
    ...extras,
    Cookie: `cgtoken=${process.env.TOKEN_MT};`,
  };
}
