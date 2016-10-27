const Twitter = require('../..');
const Config = require('../config');

const config = new Config();
const client = new Twitter(config);

client
  .stream('statuses/sample')
  .on('error', error => {
    console.error(error);
  })
  .on('data', data => {
    console.log(data.text);
  })
  .on('end', response => {
    console.log('HTTP', response.statusCode);
  });
