'use strict'

const https = require('https')
const { stringify } = require('querystring')

const { fixPath, simpleOauth, strictEncode, isFunction } = require('./helper')
const { delimit, concat } = require('./parser')
const { version } = require('./package.json')

const basePath = '/1.1/'
const defaults = {
  headers: { 'Accept': '*/*', 'User-Agent': `minion-${version}` },
  hostname: 'api.twitter.com',
  method: 'GET',
  port: 443
}

const createClient = (login = {}) => {
  const authFrom = simpleOauth(login)

  const send = (request = {}, params, parser) => {
    const handleError = (e) => { parser.emit('error', e) }

    const { path } = request

    // For now, but see: https://dev.twitter.com/webhooks/account-activity
    if (path === 'user' || path === 'site') {
      request.hostname += path
    }

    // Marginally relevant for GET requests as well
    if (path.includes('media')) {
      request.hostname = 'upload.twitter.com'
    }

    // When streaming
    if (path.includes('filter')) {
      request.method = 'POST'
    }

    const settings = Object.assign({}, defaults, request)
    const pathname = fixPath(basePath, path)
    const queryString = stringify(params, null, null, { encodeURIComponent: strictEncode })

    settings.path = queryString ? `${pathname}?${queryString}` : pathname
    settings.headers.authorization = authFrom(settings, params)

    https
      .request(settings)
      .on('error', handleError)
      .on('response', (response) => {
        if (response.statusCode === 200) {
          response.pipe(parser)
        } else {
          const { statusCode: code, statusMessage: message } = response

          handleError({ code, message })
        }

        response.on('error', handleError)
      })
      .end()

    return parser
  }

  const pull = (request = {}, args) => {
    const callback = args.find(isFunction)
    const params = args.filter(a => !isFunction(a)).pop()

    const { hostname: target } = request
    const parser = (target && target.includes('stream') ? delimit : concat)(callback)

    return send(request, params, parser)
  }

  return {
    pull: (path, ...rest) => pull({ path }, rest),
    push: (path, ...rest) => pull({ path, method: 'POST' }, rest),
    drop: (path, ...rest) => pull({ path, method: 'DELETE' }, rest),
    tail: (path, ...rest) => pull({ path, hostname: 'stream.twitter.com' }, rest)
  }
}

module.exports = createClient
