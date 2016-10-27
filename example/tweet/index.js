const Twitter = require('../..');
const Config = require('../config');

const crypto = require('crypto');

const config = new Config();
const client = new Twitter(config);

const logResponse = function (error, reponse, body) {
  if (error) {
    console.error(error);
  } else {
    console.log(body);
  }
}

// TODO: Check for encoding of ! and other special chars
var token = crypto.randomBytes(64).toString('hex').substring(0, 144);
var params = {
  status: token
};

client.post('statuses/update', params, logResponse);
