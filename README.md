## Twitter
> Client lib for interacting with twitter api, rewrite of desmondmorris/node-twitter

### Setup
```sh
# Install from github
npm install thewhodidthis/twitter

# Try the examples
node node_modules/@thewhodidthis/twitter/example
```

### Usage
```js
'use strict';

const Twitter = require('@thewhodidthis/twitter');
const client = new Twitter({
	consumer_key: '',
	consumer_secret: '',
	access_token_key: '',
	access_token_secret: ''
});

client.get('search/tweets', {
  q: '#freebandnames'
}, (error, reponse, body) => {
  if (error) {
    console.error(error);
  } else {
    console.log(body);
  }
});
```

### Credits
Original authors include [@technoweenie](http://github.com/technoweenie), [@jdub](http://github.com/jdub), [@desmondmorris](http://github.com/desmondmorris), [more &rarr;](https://github.com/desmondmorris/node-twitter/graphs/contributors)
