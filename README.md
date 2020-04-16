# fiches-travail-data
Json formated data from from set of page of travail-emploi website
You can include json data 

## Usage

```js 

const fiches = require("@socialgouv/fiches-travail-data/data/fiches-travail.json");
```

## Development

Fetch fiches from https://travail-emploi.gouv.fr

```sh
$ yarn start
```

## Tests

```sh
$ yarn test
```

## Release policy

The release job is schedule every day at 23.00PM ans also trigger after each commit in the master branch.
If data had changed, a new release will be made.

### Manual release

If you need to trigger the release job manually, you can do it using curl
You will need to provide a valid token.

```sh
curl -H "Accept: application/vnd.github.everest-preview+json" \
    -H "Authorization: token <your-token-here>" \
    --request POST \
    --data '{"event_type": "manual_release"}' \
    https://api.github.com/repos/SocialGouv/fiches-travail-data/dispatches
```
