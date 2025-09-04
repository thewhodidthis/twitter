## about

A Twitter API client for Node.js based off of [twitter](https://www.npmjs.com/package/twitter) in its various incarnations, but with own [OAuth](https://developer.twitter.com/en/docs/basics/authentication/guides) helper and slightly modified [NDJSON](https://github.com/ndjson/ndjson-spec) parser.

## setup

Fetch the latest version from GitHub directly:

```sh
# No side deps
npm install thewhodidthis/twitter
```

## usage

Consider creating an [`.npmrc`](https://docs.npmjs.com/files/npmrc#per-project-config-file) with your API credentials to test or to get the enclosed examples working locally.

```npmrc
# Sample .npmrc
ACCESS_TOKEN_KEY=****
ACCESS_TOKEN_SECRET=****
CONSUMER_KEY=****
CONSUMER_SECRET=****
```

That would then make it possible to:

```sh
# Let image upload example know of your OAuth 1.0a details
export $(cat .npmrc) && node node_modules/@thewhodidthis/twitter/example/media.js
```

The methods provided are: `tail()` for streaming, `push()` for publishing, `drop()` for removing, and `pull()` for reading tweets. For example,

```js
const createClient = require("@thewhodidthis/twitter")
const client = createClient({
  consumer_key: "",
  consumer_secret: "",
  access_token_key: "",
  access_token_secret: "",
})

client.pull("search/tweets", { q: "#js" }, (error, result) => {
  if (error) {
    console.error(error)
  } else {
    console.log(result.statuses)
  }
})
```

## see also

- [twitter](https://github.com/desmondmorris/node-twitter)
- [twit](https://github.com/ttezel/twit)
