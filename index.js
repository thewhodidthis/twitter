'use strict'

const https = require('https')
const { stringify } = require('querystring')

const { fixPath, simpleOauth, strictEncode } = require('./helper')
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
    const handleError = (error) => { parser.emit('error', error) }
    const queryString = stringify(params, null, null, { encodeURIComponent: strictEncode })

    const { path } = request
    const pathname = fixPath(basePath, path)

    // Marginally relevant for GET requests as well
    if (path.includes('media')) {
      request.hostname = 'upload.twitter.com'
    }

    // When streaming
    if (path.includes('filter')) {
      request.method = 'POST'
    }

    const settings = Object.assign({}, defaults, request)

    settings.path = queryString ? `${pathname}?${queryString}` : pathname
    settings.headers.authorization = authFrom(settings, params)

    https
      .request(settings)
      .on('error', handleError)
      .on('response', (response) => {
        response.on('error', handleError)
        if (response.statusCode === 200) {
          response.pipe(parser)
        } else {
          handleError(Error(`HTTP: ${response.statusCode} ${response.statusMessage}`))
        }
      })
      .end()

    return parser
  }

  const pull = (request = {}, args) => {
    const callback = args.pop()
    const [params] = args

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
