'use strict';

// For sending out stream events
const EventEmitter = require('events');

// TODO: Eject
/* const Parser = require('./parser'); */
const request = require('request');

// For handling request params
const querystring = require('querystring');
const url = require('url');

// For generating the nonce
const crypto = require('crypto');

// Docs advice
const VERSION = require('../package.json').version;

class Twitter {
  constructor(options) {
    this.VERSION = VERSION;

    this.settings = {};

    // Merge the default options with the client submitted options
    this.options = Object.assign(Twitter.defaults, {
      request: {
        headers: {
          Accept: '*/*',
          
          // TODO: These might prove handy at some point
          /* 'Accept-Encoding': 'deflate, gzip', */
          /* Connection: 'close', */

          // TODO: What's a valid host?
          /* Host: '', */
          'User-Agent': 'node-twitter/' + VERSION
        }
      }
    }, options);

    // Default to user authentication
    this.options.oauth = {
      oauth: {
        consumer_key: this.options.consumer_key,
        consumer_secret: this.options.consumer_secret,
        token: this.options.access_token,
        token_secret: this.options.access_token_secret
      }
    };
   
    // For now
    this.options.key = this.options.consumer_key;
    this.options.token = this.options.access_token;

    this.options.https = this.options.request;

    // Check to see if we are going to use User Authentication or Application Authetication
    if (this.options.bearer) {
      this.options.oauth = `Bearer ${this.options.bearer}`;

      authentication_options = {
        headers: {
          Authorization: 'Bearer ' + this.options.bearer
        }
      };
    }

    // Configure default request options
    this.request = request.defaults(Object.assign(this.options.request, this.options.oauth));
  }

  buildEndpoint(path, base) {
    var bases = {
      'rest': 'https://api.twitter.com/1.1',
      'stream': 'https://stream.twitter.com/1.1',
      'user_stream': 'https://userstream.twitter.com/1.1',
      'site_stream': 'https://sitestream.twitter.com/1.1',
      'media': 'https://upload.twitter.com/1.1'
    };

    var endpoint = (bases.hasOwnProperty(base)) ? bases[base] : bases.rest;

    if (url.parse(path).protocol) {
      endpoint = path;
    } else {

      // If the path begins with media or /media
      // https://dev.twitter.com/rest/media/uploading-media
      /* Because the method uses multipart POST, OAuth is handled a little differently. POST or query string parameters are not used when calculating an OAuth signature basestring or signature. Only the oauth_* parameters are used. */
      if (path.match(/^(\/)?media/)) {
        endpoint = bases.media;
      }

      endpoint += (path.charAt(0) === '/') ? path : '/' + path;
    }

    // Remove trailing slash
    endpoint = endpoint.replace(/\/$/, '');

    // Add json extension if not provided in call
    endpoint += (path.split('.').pop() !== 'json') ? '.json' : '';

    return endpoint;
  }

  sendRequest(method, path, params, callback) {
    var base = 'rest';

    // Set the callback if no params are passed
    if (typeof params === 'function') {
      callback = params;
      params = {};
    }

    // Set API base
    if (typeof params.base !== 'undefined') {
      base = params.base;
      delete params.base;
    }

    // Build the options to pass to our custom request object
    var options = {

      // Request method - get || post
      method: method.toLowerCase(),

      // Generate url
      url: this.buildEndpoint(path, base) 
    };

    // Pass url parameters if get
    if (method === 'get') {
      options.qs = params;
    }

    // Pass form data if post
    if (method === 'post') {
      var formKey = 'form';

      if (typeof params.media !== 'undefined') {
        formKey = 'formData';
      }

      options[formKey] = params;
    }

    this.request(options, function(error, response, data) {

      // Request error
      if (error) {
        return callback(error, data, response);
      }

      // JSON parse error or empty strings
      try {

        // An empty string is a valid response
        if (data === '') {
          data = {};
        } else {
          data = JSON.parse(data);
        }
      } catch (error) {
        return callback(
          new Error('JSON parseError with HTTP Status: ' + response.statusCode + ' ' + response.statusMessage),
          data,
          response
        );
      }

      // Response object errors, should return an error object not an array of errors
      if (data.errors !== undefined) {
        return callback(data.errors, data, response);
      }

      // Status code errors
      if(response.statusCode < 200 || response.statusCode > 299) {
        return callback(
          new Error('HTTP Error: ' + response.statusCode + ' ' + response.statusMessage),
          data,
          response
        );
      }

      // No errors
      callback(null, data, response);
    });
  }

  get(url, params, callback) {
    return this.sendRequest('get', url, params, callback);
  }

  post(url, params, callback) {
    return this.sendRequest('post', url, params, callback);
  }
  
  stream(method, params, callback) {
    var stream = new EventEmitter();
    var base = 'stream';

    if (typeof params === 'function') {
      callback = params;
      params = {};
    }

    if (method === 'user' || method === 'site') {
      base = method + '_' + base;
    }

    var url = this.buildEndpoint(method, base);

    var messageTypes = 'delete scrub_geo limit status_withheld user_withheld disconnect warning friends event for_user control';
    var messageTypes = messageTypes.split(' ');

    var messageEnd = '\r\n';
    var message = '';
    var ended = -1;

    var request = this.request({
      url: url,
      qs: params
    })
    .on('error', error => {
      stream.emit('error', error);
    })
    .on('response', response => {
        if (response.statusCode !== 200) {
          stream.emit('error', new Error('Status Code: ' + response.statusCode));
        }

        response
          .on('data', chunk => {

            // https://dev.twitter.com/streaming/overview/processing
            /* By passing delimited=length when connecting to a stream (note that the value is the literal string length, not a number) each message will be preceded by a string representation of a base-10 integer indicating the length of the message in bytes. Note that this is independent of, and does not affect any chunked transfer encoding. Clients may use these length delimiters to more efficiently copy chunks of text off of the incoming stream, rather than having to parse message text for \r\n tokens. */

            /* while (true) { */
            /*   do { */
            /*     lengthBytes = readline() */
            /*   } while (lengthBytes.length < 1) */
            /*   messageLength = parseInt(lengthBytes); */
            /*   messageBytes = read(messageLength); */
            /*   enqueueForMarkupProcessor(messageBytes); */
            /* } */ 

            message += chunk.toString('utf8');
            ended = message.indexOf(messageEnd);

            if (ended !== -1) {
              var data = message.slice(0, ended);

              try {
                var json = JSON.parse(data);
                var eventType = 'data';

                messageTypes.forEach(type => {
                  if (json.hasOwnProperty(type)) {
                    eventType = type;
                  }
                });

                stream.emit(eventType, json);
              } catch (error) {
                stream.emit('error', error);
              }

              message = message.slice(ended + messageEnd.length);
            }

          })
          .on('error', error => {
            stream.emit('error', error);
          })
          .on('end', () => {
            stream.emit('end', response);
          });
      });

    if (typeof callback === 'function') {
      callback(stream);
    } else {
      return stream;
    }
  }
}

Twitter.defaults = {
  access_token: null,
  access_token_secret: null,

  // TODO: Figure this out
  bearer: null,
  consumer_key: null,
  consumer_secret: null,
};

module.exports = Twitter;

