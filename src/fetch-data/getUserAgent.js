/**
 * Get user agent to bypass bot protection
 */
export function getUserAgent() {
  if (!process.env.USER_AGENT) {
    throw Error(
      "User agent is required to fetch the data. This user agent is provided by the travail-emploi.gouv.fr team."
    );
  }
  return process.env.USER_AGENT;
}
