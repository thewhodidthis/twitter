'use strict';

const Twitter = require('../..');
const Config = require('../config');

const config = new Config();
const client = new Twitter(config);

const params = {
  screen_name: '64326c30656d4a7'
}

client.get('statuses/user_timeline', params, (error, response, body) => {
  if (error) {
    console.error(error);
  } else {

    // Does it matter that all of the following is assuming too much?
    client.post(`statuses/retweet/${body[0].id_str}`, (error, response, body) => {
      if (error) {
        console.error(error);
      } else {
        console.log('HTTP', response.statusCode, body.text);
      }
    });
  }
});

