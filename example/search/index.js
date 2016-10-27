const Twitter = require('../..');
const Config = require('../config');

const config = new Config();
const client = new Twitter(config);

const logResponse = function (error, reponse, body) {
  if (error) {
    console.error(error);
  } else {
    console.log(body);
  }
}

var params = {
  q: '#freebandnames'
};

client.get('search/tweets', params, logResponse);
