'use strict'

const keys = require('./keys.js')
const client = require('../')(keys)

client
  .tail('statuses/sample')
  .on('error', console.error)
  .on('data', ({ text }) => {
    if (text) {
      console.log(text)
    }
  })
