'use strict';

const https = require('https');

// For handling request params
const querystring = require('querystring');
const url = require('url');

// For generating the nonce
const crypto = require('crypto');

// For sending out stream events
const EventEmitter = require('events');

// Docs advice
const VERSION = require('./package.json').version;

class Twitter {
  constructor(options) {
    this.VERSION = VERSION;

    // Merge options and defaults
    this._login = Object.assign({}, Twitter.defaults, options);

    // Request defaults
    this._request = {
      headers: {
        Accept: '*/*',
        'User-Agent': 'minion-' + this.VERSION
      },
      hostname: 'api.twitter.com',
      method: 'GET',
      path: '/1.1/',
      port: 443
    };

    // If using application only authentication
    if (this._login.bearer) {
      this._request.headers['Authorization'] = 'Bearer ' + this._login.bearer;
    }
  }

  buildOauth(options, params) {
    var consumerKey = this._login.consumer_key;
    var accessToken = this._login.access_token_key;

    // Convert the HTTP Method to uppercase
    var method = options.method.toUpperCase();

    // base64 encoding 32 bytes of random data, and stripping out all non-word characters
    var nonce = crypto.randomBytes(32).toString('base64').replace(/\W+/g, '');

    // Timestamp each request
    var timestamp = Math.floor((new Date()).getTime() * 0.001);

    // Assemble and percent encode request url in full
    var endpoint = encodeURIComponent(`https:\/\/${options.hostname}${url.parse(options.path).pathname}`);

    var parts = {
      'oauth_consumer_key': consumerKey,
      'oauth_nonce': nonce,
      'oauth_signature_method': 'HMAC-SHA1',
      'oauth_timestamp': timestamp,
      'oauth_token': accessToken,
      'oauth_version': '1.0'
    };

    var percentEncode = this.fixedEncodeURIComponent;

    var version = parts.oauth_version;
    var signatureMethod = parts.oauth_signature_method;

    // NB: The docs say no encoding of params is needed for uploading media, but
    var partsAndParams = Object.assign({}, parts, params);
    var parameterString = Object.keys(partsAndParams).sort().reduce((prev, curr) => {
      var p = prev.length ? `${prev}&` : '';
      var c = percentEncode(curr);
      var v = percentEncode(partsAndParams[curr])

      return `${p}${c}=${v}`;
    }, '');

    var encodedParameterString = percentEncode(parameterString);
    var signatureBaseString = `${method}&${endpoint}&${encodedParameterString}`;
    var consumerSecret = percentEncode(this._login.consumer_secret);
    var tokenSecret = percentEncode(this._login.access_token_secret);
    var signingKey = consumerSecret + '&' + tokenSecret;
    var signature = percentEncode(crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64'));

    Object.keys(parts).forEach(part => {
      parts[part] = percentEncode(parts[part]);
    });

    return `OAuth oauth_consumer_key="${consumerKey}", oauth_nonce="${nonce}", oauth_signature="${signature}", oauth_signature_method="${signatureMethod}", oauth_timestamp="${timestamp}", oauth_token="${accessToken}", oauth_version="${version}"`;
  }

  fixedEncodeURIComponent(target) {
    return encodeURIComponent(target).replace(/[!'()*]/g, function(c) {
      return '%' + c.charCodeAt(0).toString(16);
    });
  }

  get(path, params, callback) {
    var options = {
      hostname: this._request.hostname
    };

    if (typeof path === 'string') {
      options.path = path;
    } else {
      options = Object.assign({}, options, path);
    }

    if (options.path.indexOf('media') !== -1) {
      options.hostname = 'upload.twitter.com';
    }

    if (typeof params === 'function') {
      callback = params;
      params = {};
    }

    this.sendRequest(options, params, (error, response) => {
      if (error) {
        return callback(error);
      }

      const body = [];

      response
        .on('data', chunk => {
          body.push(chunk);
        })
        .on('end', () => {
          return callback(null, response, JSON.parse(Buffer.concat(body)));
        });
    });
  }

  pathMath(path) {

    // Just a precaution
    var path = url.parse(path).path;

    // Prefix
    path = url.resolve(this._request.path, path);

    // Remove trailing slash
    path = path.replace(/\/$/, '');

    // Add json extension if missing
    path += path.split('.').pop() !== 'json' ? '.json' : '';

    return path;
  }

  post(path, params, callback) {
    var options = {
      method: 'POST',
      path: path
    };

    // Be got
    this.get(options, params, callback);
  }

  sendRequest(options, params, callback) {
    var options = Object.assign({}, this._request, options);

    // Format request data
    var data = JSON.stringify(params);

    // Format request path
    var path = this.pathMath(options.path);

    var qs = querystring.stringify(params, null, null, {
      encodeURIComponent: this.fixedEncodeURIComponent
    });

    // Set this prior to calculating oauth string
    options.path = qs ? path + '?' + qs : path;

    // Preserve settings
    options.headers = Object.assign({}, this._request.headers, options.headers);

    // NB: Streaming apis will only accept oauth
    options.headers['Authorization'] = this._request.headers['Authorization'] || this.buildOauth(options, params);

    https
      .request(options)
      .on('error', callback)
      .on('response', response => {
        if (response.statusCode === 200) {
          callback(null, response);
        } else {
          return callback(new Error(`HTTP ${response.statusCode} ${response.statusMessage}`), response);
        }

        response.on('error', callback);
      })
      .end();
  }

  stream(path, params, callback) {
    const stream = new EventEmitter();

    const messageEnd = '\r\n';
    const messageTypes = [
      'delete',
      'scrub_geo',
      'limit',
      'status_withheld',
      'user_withheld',
      'disconnect',
      'warning',
      'friends',
      'event',
      'for_user',
      'control'
    ];

    var options = {
      hostname: 'stream.twitter.com',
      method: 'GET',
      path: path
    };

    if (path === 'user' || path === 'site') {
      options.hostname = path + options.hostname;
    }

    if (path.indexOf('filter') !== -1) {
      options.method = 'POST';
    }

    if (typeof params === 'function') {
      callback = params;
      params = {};
    }

    this.sendRequest(options, params, (error, response) => {
      if (error) {
        stream.emit('error', error);
      }

      let ended = -1;
      let message = '';

      response
        .on('data', chunk => {
          message += chunk.toString('utf8');

          while ((ended = message.indexOf(messageEnd)) > 0) {
            let data = message.slice(0, ended);
            let eventType = 'data';

            try {
              data = JSON.parse(data);

              messageTypes.forEach(type => {
                if (data.hasOwnProperty(type)) {
                  eventType = type;
                }
              });

              stream.emit(eventType, data);
            } catch (error) {
              stream.emit('error', error);
            }

            message = message.slice(ended + messageEnd.length);
          }
        })
        .on('end', () => {
          stream.emit('end', response);
        });
    });

    return typeof callback === 'function' ? callback(stream) : stream;
  }
}

Twitter.defaults = {
  access_token_key: null,
  access_token_secret: null,
  bearer: null,
  consumer_key: null,
  consumer_secret: null,
};

module.exports = Twitter;

