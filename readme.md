## about

A twitter API client for Node.js with own [OAuth](https://developer.twitter.com/en/docs/basics/authentication/guides) and [NDJSON](https://github.com/ndjson/ndjson-spec) helpers.

## setup

Fetch the latest version from GitHub directly:

```sh
# No side deps
npm install thewhodidthis/twitter
```

## usage

Please create an [`.npmrc`](https://docs.npmjs.com/files/npmrc#per-project-config-file) with your own `PASSWORD` and `APPLE_ID` information to test or to get the enclosed example working locally. 

```npmrc
# Sample .npmrc
CONSUMER_KEY=***
CONSUMER_SECRET=***
ACCESS_TOKEN_KEY=***
ACCESS_TOKEN_SECRET=***
```

That would make it possible to, for example,

```sh
# Let example know of your login information
export $(cat .npmrc) && node node_modules/@thewhodidthis/twitter/example.js
```

The methods provided are: `tail()` for streaming, `push()` for publishing, `drop()` for removing, and `pull()` for reading tweets. For example,

```js
const createClient = require('@thewhodidthis/twitter')
const client = createClient({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
})

client.pull('search/tweets', { q: '#js' }, (error, result) => {
  if (error) {
    console.error(error)
  } else {
    console.log(result.statuses)
  }
})
```

## authors

This module is based off of [twitter](https://www.npmjs.com/package/twitter) in its various incarnations, principally the work of:

- [@technoweenie](http://github.com/technoweenie)
- [@jdub](http://github.com/jdub)
- [@desmondmorris](http://github.com/desmondmorris)

## see also

- [twitter](https://github.com/desmondmorris/node-twitter)
- [twit](https://github.com/ttezel/twit)
