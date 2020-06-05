'use strict'

const { Writable } = require('stream')

const noop = v => v

// My ndjson stream informed by:
// - ndjson/ndjson-spec
// - maxogden/ndjson
// - mcollina/split2 (delimiter)
const split = (callback = noop, delimiter = /\r?\n/) => {
  let store = ''

  const parser = new Writable({
    write(chunk, encoding, next) {
      const input = store + chunk.toString()
      const items = input.split(delimiter)

      store = items.pop()

      for (const item of items) {
        try {
          const data = JSON.parse(item)
          const { errors } = data

          if (errors) {
            errors.forEach((e) => {
              parser.emit('error', e)
            })
          } else {
            parser.emit('data', data)
          }
        } catch (e) {
          callback(e)
        }
      }

      next()
    }
  })

  parser
    .on('error', callback)
    .on('data', (data) => {
      callback(null, data)
    })

  return parser
}

// My concat stream
const unite = (callback = noop) => {
  const memo = []

  const parser = new Writable({
    write(chunk, encoding, next) {
      memo.push(chunk)
      next()
    }
  })

  parser
    .on('error', callback)
    .on('finish', () => {
      // If any of Buffer or JSON operations throw,
      // the error gets passed on to `callback` via listener above
      const body = Buffer.concat(memo).toString()
      const data = JSON.parse(body)

      const { errors } = data

      if (errors) {
        errors.forEach((e) => {
          parser.emit('error', e)
        })
      } else {
        callback(null, data)
      }
    })

  return parser
}

module.exports = { split, unite }
