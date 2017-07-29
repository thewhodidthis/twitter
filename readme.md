## Twitter
> Work in progress

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

const createClient = require('@thewhodidthis/twitter');
const client = createClient({
	consumer_key: '',
	consumer_secret: '',
	access_token_key: '',
	access_token_secret: ''
});

client.pull('search/tweets', {
  q: '#trump'
}, (error, data) => {
  if (error) {
    console.error(error);
  } else {
    console.log(data.statuses);
  }
});
```

### Credits
Original authors include [@technoweenie](http://github.com/technoweenie), [@jdub](http://github.com/jdub), [@desmondmorris](http://github.com/desmondmorris), [more &rarr;](https://github.com/desmondmorris/node-twitter/graphs/contributors)
