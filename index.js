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
    this.login = Object.assign({}, Twitter.defaults, options);

    // Request defaults
    this.request = {
      headers: {
        Accept: '*/*',
        'User-Agent': `minion-${this.VERSION}`
      },
      hostname: 'api.twitter.com',
      method: 'GET',
      path: '/1.1/',
      port: 443
    };

    // If using application only authentication
    if (this.login.bearer) {
      this.request.headers.authorization = `Bearer ${this.login.bearer}`;
    }
  }

  buildOauth(options, params) {
    const consumerKey = this.login.consumer_key;
    const accessToken = this.login.access_token_key;

    // Convert the HTTP Method to uppercase
    const method = options.method.toUpperCase();

    // base64 encoding 32 bytes of random data, and stripping out all non-word characters
    const nonce = crypto.randomBytes(32).toString('base64').replace(/\W+/g, '');

    // Timestamp each request
    const timestamp = Math.floor((new Date()).getTime() * 0.001);

    // Assemble and percent encode request url in full
    const endpoint = encodeURIComponent(`https://${options.hostname}${url.parse(options.path).pathname}`);

    const parts = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: accessToken,
      oauth_version: '1.0'
    };

    const percentEncode = Twitter.fixedEncodeURIComponent;

    const version = parts.oauth_version;
    const signatureMethod = parts.oauth_signature_method;

    // NB: The docs say no encoding of params is needed for uploading media, but
    const partsAndParams = Object.assign({}, parts, params);
    const parameterString = Object.keys(partsAndParams).sort().reduce((prev, curr) => {
      const p = prev.length ? `${prev}&` : '';
      const c = percentEncode(curr);
      const v = percentEncode(partsAndParams[curr]);

      return `${p}${c}=${v}`;
    }, '');

    const encodedParameterString = percentEncode(parameterString);
    const signatureBaseString = `${method}&${endpoint}&${encodedParameterString}`;
    const consumerSecret = percentEncode(this.login.consumer_secret);
    const tokenSecret = percentEncode(this.login.access_token_secret);
    const signingKey = `${consumerSecret}&${tokenSecret}`;
    const signature = percentEncode(crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64'));

    Object.keys(parts).forEach((part) => {
      parts[part] = percentEncode(parts[part]);
    });

    return `OAuth oauth_consumer_key="${consumerKey}",
                  oauth_nonce="${nonce}",
                  oauth_signature="${signature}",
                  oauth_signature_method="${signatureMethod}",
                  oauth_timestamp="${timestamp}",
                  oauth_token="${accessToken}",
                  oauth_version="${version}"`;
  }

  static fixedEncodeURIComponent(target) {
    return encodeURIComponent(target).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16)}`);
  }

  get(path, params, callback) {
    let options = {
      hostname: this.request.hostname
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
        callback(error);
      }

      const body = [];

      response
        .on('data', (chunk) => {
          body.push(chunk);
        })
        .on('end', () => callback(null, response, JSON.parse(Buffer.concat(body))));
    });
  }

  pathMath(path) {
    // Just a precaution
    let target = url.parse(path).path;

    // Prefix
    target = url.resolve(this.request.path, target);

    // Remove trailing slash
    target = target.replace(/\/$/, '');

    // Add json extension if missing
    target += target.split('.').pop() !== 'json' ? '.json' : '';

    return target;
  }

  post(path, params, callback) {
    const options = {
      method: 'POST',
      path
    };

    // Be got
    this.get(options, params, callback);
  }

  sendRequest(options, params, callback) {
    const settings = Object.assign({}, this.request, options);

    // Format request data
    /* const data = JSON.stringify(params); */

    // Format request path
    const path = this.pathMath(settings.path);

    const qs = querystring.stringify(params, null, null, {
      encodeURIComponent: Twitter.fixedEncodeURIComponent
    });

    // Set this prior to calculating oauth string
    settings.path = qs ? `${path}?${qs}` : path;

    // Preserve settings
    settings.headers = Object.assign({}, this.request.headers, settings.headers);

    // NB: Streaming apis will only accept oauth
    settings.headers.authorization = this.request.headers.authorization || this.buildOauth(settings, params);

    https
      .request(settings)
      .on('error', callback)
      .on('response', (response) => {
        if (response.statusCode === 200) {
          callback(null, response);
        } else {
          callback(new Error(`HTTP ${response.statusCode} ${response.statusMessage}`), response);
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

    const options = {
      hostname: 'stream.twitter.com',
      method: 'GET',
      path
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
        .on('data', (chunk) => {
          message += chunk.toString('utf8');

          while ((ended = message.indexOf(messageEnd)) > 0) {
            let data = message.slice(0, ended);
            let eventType = 'data';

            try {
              data = JSON.parse(data);
              messageTypes.forEach((type) => {
                if ({}.hasOwnProperty.call(data, type)) {
                  eventType = type;
                }
              });

              stream.emit(eventType, data);
            } catch (e) {
              stream.emit('error', e);
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

