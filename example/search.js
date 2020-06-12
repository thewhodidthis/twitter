'use strict'

const keys = require('./keys.js')
const client = require('../')(keys)

client.pull('search/tweets', { q: '#IraqCasualties' }, (error, data) => {
  if (error) {
    console.error(error)
  } else {
    console.log(data.search_metadata)
  }
})
