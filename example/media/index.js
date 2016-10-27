'use strict';

const Twitter = require('../..');
const Config = require('../config');

const config = new Config();
const client = new Twitter(config);

// Load your image
const media_data = require('fs').readFileSync(__dirname + '/image-506x253.jpg').toString('base64');

const params = {
  media_data: media_data
}

// Make post request on media endpoint. Pass file data as media parameter
client.post('media/upload', params, (error, response, body) => {
  if (error) {
    console.error(error);
  } else {

    // Lets tweet it
    var tweet = {
      status: 'Look ma, uploads!',

      // Pass the media id string
      media_ids: body.media_id_string
    }

    client.post('statuses/update', tweet, (error, response, body) => {
      if (error) {
        console.error(error);
      } else {
        console.log(body);
      }
    });
  }
});

