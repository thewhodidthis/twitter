'use strict'

const { Writable } = require('stream')

const noop = v => v

// My ndjson stream
const split = (callback = noop) => {
  let store = ''

  const parser = new Writable({
    write(chunk, encoding, next) {
      const input = store + chunk.toString()
      const items = input.split('\r\n')

      store = items.pop()

      items.forEach((item) => {
        const data = JSON.parse(item)
        const { errors } = data

        if (errors) {
          errors.forEach((e) => {
            parser.emit('error', e)
          })
        } else {
          parser.emit('data', data)
        }
      })

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
