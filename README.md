# fiches-travail-data

> Json formated data from from set of page of travail-emploi website
You can include json data 

[![Node.js CI](https://github.com/SocialGouv/fiches-travail-data/workflows/Node.js%20CI/badge.svg)](https://github.com/SocialGouv/fiches-travail-data/actions?query=workflow%3A%22Node.js+CI%22+branch%3Amaster)
[![Release](https://github.com/SocialGouv/fiches-travail-data/workflows/Release/badge.svg)](https://github.com/SocialGouv/fiches-travail-data/actions?query=workflow%3ARelease+branch%3Amaster)
[![codecov](https://codecov.io/gh/SocialGouv/fiches-travail-data/branch/master/graph/badge.svg)](https://codecov.io/gh/SocialGouv/fiches-travail-data)

## Usage

```js 

const {data, decodeEmail} = require("@socialgouv/fiches-travail-data");
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

### email

There are some email adresses in the data. To prevent email sniffing
we transform the `@` into `_@`.  
