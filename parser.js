'use strict'

const { Writable } = require('stream')

const noop = () => {}

/* eslint no-invalid-this: 1 */
const errorHandler = function (e) {
  this.emit('error', e)
}

// My ndjson streaming parser
const delimit = (broker = noop) => {
  let body = ''
  let mark = -1

  const marker = '\r\n'
  const border = marker.length
  const parser = new Writable({
    write(chunk, encoding, next) {
      body += chunk.toString()

      while ((mark = body.indexOf(marker)) > 0) {
        const section = body.slice(0, mark)

        const data = JSON.parse(section)
        const { errors } = data

        if (errors) {
          errors.forEach(errorHandler, parser)
        } else {
          parser.emit('data', data)
        }

        body = body.slice(mark + border)
      }

      next()
    }
  })

  parser
    .on('error', broker)
    .on('data', (data) => { broker(null, data) })

  return parser
}

// My concat stream
const concat = (broker = noop) => {
  const body = []
  const sink = new Writable({
    write(chunk, encoding, next) {
      body.push(chunk)
      next()
    }
  })

  sink
    .on('error', broker)
    .on('finish', () => {
      const result = Buffer.concat(body).toString()

      const data = JSON.parse(result)
      const { errors } = data

      if (errors) {
        errors.forEach(errorHandler, sink)
      } else {
        broker(null, data)
      }
    })

  return sink
}

module.exports = { delimit, concat }
