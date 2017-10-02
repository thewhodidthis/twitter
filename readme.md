## Twitter
> Work in progress

### Setup
```sh
# Fetch latest from github
npm i thewhodidthis/twitter

# Try the examples
node node_modules/@thewhodidthis/twitter/example
```

### Usage
```js
const createClient = require('@thewhodidthis/twitter')
const client = createClient({
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: ''
})

client.pull('search/tweets', { q: '#trump' }, (error, { statuses }) => {
    if (error) {
        console.error(error)
    } else {
        console.log(statuses)
    }
})
```

### Credits
Original authors: [@technoweenie](http://github.com/technoweenie), [@jdub](http://github.com/jdub), [@desmondmorris](http://github.com/desmondmorris), [more &rarr;](https://github.com/desmondmorris/node-twitter/graphs/contributors)
