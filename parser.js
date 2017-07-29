'use strict'

const { Writable } = require('stream')

const noop = () => {}

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
        const data = body.slice(0, mark)

        try {
          const result = JSON.parse(data)

          // Check for errors in this json block
          parser.emit('data', result)
        } catch (e) {
          parser.emit('error', e)
        }

        body = body.slice(mark + border)
      }

      next()
    }
  })

  parser
    .on('error', broker)
    .on('data', (message) => { broker(null, message) })

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
      const data = Buffer.concat(body).toString()

      try {
        const result = JSON.parse(data)

        // Check for errors in this json block
        broker(null, result)
      } catch (e) {
        broker(e)
      }
    })

  return sink
}

module.exports = { delimit, concat }
