# fiches-travail-data

> Json formated data from from set of page of travail-emploi website
> You can include json data

[![Node.js CI](https://github.com/SocialGouv/fiches-travail-data/workflows/Node.js%20CI/badge.svg)](https://github.com/SocialGouv/fiches-travail-data/actions?query=workflow%3A%22Node.js+CI%22+branch%3Amaster)
[![Release](https://github.com/SocialGouv/fiches-travail-data/workflows/Release/badge.svg)](https://github.com/SocialGouv/fiches-travail-data/actions?query=workflow%3ARelease+branch%3Amaster)
[![codecov](https://codecov.io/gh/SocialGouv/fiches-travail-data/branch/master/graph/badge.svg)](https://codecov.io/gh/SocialGouv/fiches-travail-data)

<br>
<br>

## Usage

```js
const { decodeEmail } = require("@socialgouv/fiches-travail-data");
const fichesMT = require("@socialgouv/fiches-travail-data/data/fiches-travail.json");
```

## Development

Build dist folder once

```sh
$ yarn build
```

Make sure references are good

```sh
$ yarn checkRefs
```

Fetch fiches from https://travail-emploi.gouv.fr

```sh
$ yarn start
```

## Tests

```sh
$ yarn test
```

## Notes

### email

There are some email adresses in the data. To prevent email sniffing
we transform the `@` into `_@`.

## Release policy

The release job is schedule every day at 23.00PM ans also trigger after each commit in the master branch.
If data had changed, a new release will be made.

Releases are automaticly made through our [GitHub Actions](https://github.com/SocialGouv/fiches-travail-data/actions) strictly following the [Semantic Versioning](http://semver.org/) specification thanks to [semantic-release](https://github.com/semantic-release/semantic-release).

We release an additional `@socialgouv/fiches-travail-data-types` package by sed-ing the package.json (see [`.releaserc.yml`](./.releaserc.yml))

### Manual release

If you need to trigger the release job manually, you can do it using the [GitHub UI](https://github.com/SocialGouv/fiches-travail-data/actions/workflows/release.yml) or curl. You will need to provide a valid token.

``` 
curl -H "Accept: application/vnd.github.everest-preview+json" \
 -H "Authorization: token <your-token-here>" \
 --request POST \
 --data '{"event_type": "manual_release"}' \
 https://api.github.com/repos/SocialGouv/fiches-travail-data/dispatches
``` 
